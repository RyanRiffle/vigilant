/**
 * Session.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    jwt: { type: 'string', required: true },
    user: { type: 'number', required: true }
  },
};