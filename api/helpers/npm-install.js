var exec = require('child_process').exec;

var bcrypt = require('bcrypt-nodejs');

module.exports = {
  friendlyName: 'Hash user password',

  description: 'Hashes the password field of the passed user',

  inputs: {
  	path: { type: 'string' },
  },

  fn: async function (values, exits) {
    exec('npm install', {
    	cwd: values.path
    }, (err, stdout, stderr) => {
    	if (err) {
    		exits.error(err);
    	}

    	exits.success(stdout);
    });
  }

};