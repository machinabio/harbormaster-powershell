'use strict';

module.exports = function render_input (values) {
  values = values || {};

  return `
    <label>Command to execute:
      <style>
        .shell-work { font: 14px monospace; }
      </style>
      <input
        type=text
        name=command
        class="shell-work"
        placeholder="(no default)"
        required
        value="${values.command || ''}"
      >
    </label>
    <button class="button hollow">Save</button>
  `;
};
