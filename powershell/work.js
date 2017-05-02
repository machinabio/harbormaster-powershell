'use strict';

module.exports = function work(lane, manifest) {
  let user = manifest.user ? manifest.user : 'Adminstrator';
  let key_location = expandTilde(manifest.use_key ? manifest.key_location : '~/.ssh/id_rsa');
  console.log('ket location: ', key_location);
  let private_key;
  let exit_code = 1;
  let shipment = Shipments.findOne({
    lane: lane._id,
    start: manifest.shipment_start_date
  });

  try {
    private_key = fs.readFileSync(key_location, 'utf8');
  } catch (err) {
    manifest.error = err;
  }

  let connection = new Client();
  let connection_options = {
    tryKeyboard: true,
    host: manifest.address,
    username: user,
    privateKey: private_key,
    password: manifest.password ? manifest.password : undefined
  };

  console.log(`Logging into ${connection_options.host}`);

  connection.on('ready', Meteor.bindEnvironment((err, stream) => {

    console.log(
      'Executing command "' + manifest.command + '" for:',
      manifest.address
    );
    connection.exec(
      manifest.command, { pty: true },
      Meteor.bindEnvironment((err, stream) => {

        if (err) {
          manifest.error = error;
        }

        stream.on('close', Meteor.bindEnvironment((code, signal) => {

          console.log(
            'Command "' + manifest.command + '" exited with code',
            code,
            'for:',
            manifest.address
          );

          exit_code = code;

          $H.call('Lanes#end_shipment', lane, exit_code, manifest);

        })).on('data', Meteor.bindEnvironment((buffer) => {

          console.log(
            'Command "' + manifest.command + '" logged data:\n',
            buffer.toString('utf8')
          );

          shipment.stdout.push({
            result: buffer.toString('utf8'),
            date: new Date()
          });
          Shipments.update(shipment._id, shipment);

        })).stderr.on('data', Meteor.bindEnvironment((buffer) => {

          console.log(
            'Command "' + manifest.command + '" errored with error:\n',
            buffer.toString('utf8')
          );

          shipment.stderr.push({
            result: buffer.toString('utf8'),
            date: new Date()
          });
          Shipments.update(shipment._id, shipment);

        }));
      }));

    console.log('Connection ready.');

  })).on('error', Meteor.bindEnvironment((err) => {
    console.error('Error with connection!', err);
    if (err) manifest.error = err;

    $H.call('Lanes#end_shipment', lane, exit_code, manifest);
  })).connect(connection_options);

  return manifest;
};
