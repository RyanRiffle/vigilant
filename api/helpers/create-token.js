var jwt = require('jsonwebtoken');

module.exports = {
  friendlyName: 'Create JWT token for user',

  description: 'Create a JWT token based on the passed user.',

  inputs: {
    email: { type: 'string' },
    password: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    photo: { type: 'string' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
    id: { type: 'number' },
    role: { type: 'string' }
  },

  fn: async function (user, exits) {
    return exits.success(jwt.sign({
        user: user
      },
      sails.config.jwtSettings.secret,
      {
        algorithm: sails.config.jwtSettings.algorithm,
        issuer: sails.config.jwtSettings.issuer,
        audience: sails.config.jwtSettings.audience
      }
    ));
  }

};