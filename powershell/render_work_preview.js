'use strict';

module.exports = function render_work_preview (manifest) {
  let user = manifest.user ? manifest.user + '@' : '';

  return `
    <p>Command: <code>${manifest.command}</code></p>
  `;
}
