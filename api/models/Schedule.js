/**
 * Schedule.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true},
    interval: { type: 'number', required: true }, //Time in milliseconds
    plugin: { type: 'number', required: true },
    description: { type: 'string', defaultsTo: "" },
    enabled: { type: 'boolean', defaultsTo: true },
    lastRun: { type: 'number' },
    state: { type: 'string', defaultsTo: 'waiting'},
    errorString: { type: 'string' },
  },
};