'use strict';

module.exports = function work(lane, manifest) {
  let exit_code = 1;
  let shipment = Shipments.findOne({
    lane: lane._id,
    start: manifest.shipment_start_date
  });

  let shell = new ps({ });

  shell.addCommand(manifest.command);

  shell.streams.stdout.on('data', $H.bindEnvironment(buffer => {
    console.log(
      'Command "' + manifest.command + '" logged data:\n',
      buffer.toString('utf8')
    );

    shipment.stdout.push({
      result: buffer.toString('utf8'),
      date: new Date()
    });
    Shipments.update(shipment._id, shipment);
  }));

  shell.streams.stderr.on('data', $H.bindEnvironment(buffer => {
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

  shells.streams.stdout.on('close', $H.bindEnvironment(code, signal => {
    console.log('Command "' + manifest.command + '" exited with code', code);

    exit_code = code;

    $H.call('Lanes#end_shipment', lane, exit_code, manifest);
  }));

  console.log('Executing command "' + manifest.command + '" in PowerShell...');
  shell.invoke().catch(err => {
    console.error('Error with executing PowerShell command!', err);
    if (err) manifest.error = err;

    $H.call('Lanes#end_shipment', lane, exit_code, manifest);
  });

  return manifest;
};
