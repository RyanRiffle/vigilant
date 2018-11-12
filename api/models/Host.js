/**
 * Host.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const dns = require('dns');

module.exports = {
  attributes: {
    name: { type: 'string', required: true },
    ipv4: { type: 'string' },
    ipv6: { type: 'string' },
    hostname: { type: 'string' },
    dnsname: { type: 'string' },
  },

  beforeCreate: async function(host, next)
  {
  	if (host.ipv4 !== '' && host.ipv6 !== '') {
  		return next();
  	}

  	if (host.dnsname) {
  		dns.lookup(host.dnsname, {all: true}, (err, addresses) => {
  			if (err) {
  				next();
  			}

  			for (var i = 0; i < addresses.length; i++) {
  				var addr = addresses[i];
  				if (addr.family === 4) {
  					host.ipv4 = addr.address;
  				} else if (addr.family === 6) {
  					host.ipv6 = addr.address;
  				}
  			}

  			if (host.ipv6 === '') {
  				host.ipv6 = 'None';
  			}

  			next();
  		});
  	}
  }
};

