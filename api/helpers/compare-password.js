var bcrypt = require('bcrypt-nodejs');

module.exports = {
  friendlyName: 'Checks user password',

  description: 'Compare user password hash with unhashed password',

  inputs: {
  	plain: { type: 'string' },
  	hash: { type: 'string' }
  },

  fn: async function (values, exits) {
    return exits.success(bcrypt.compareSync(values.plain, values.hash));
  }

};