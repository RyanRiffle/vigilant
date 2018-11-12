var bcrypt = require('bcrypt-nodejs');

module.exports = {
  friendlyName: 'Hash user password',

  description: 'Hashes the password field of the passed user',

  inputs: {
  	email: { type: 'string' },
  	password: { type: 'string' },
  	firstName: { type: 'string' },
  	lastName: { type: 'string' },
  	photo: { type: 'string' },
  	createdAt: { type: 'number' },
  	updatedAt: { type: 'number' },
  	role: { type: 'string' }
  },

  fn: async function (user, exits) {
    if (user.password) {
      user.password = bcrypt.hashSync(user.password);
    }

    return exits.success(user.password);
  }

};