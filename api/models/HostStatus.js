/**
 * HostStatus.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    host: { type: 'number', required: true },
    plugin: { type: 'number' },
    source: { type: 'string', required: true },
    status: { type: 'string', defaultsTo: 'uknown'}
  },
};

