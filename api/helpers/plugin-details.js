const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Reads basic information from package.json of plugin.',
  description: 'Reads the package.json of a plugin and returns the name, description, \
                version, author, license, keywords, repository',

  inputs: {
    path: { type: 'string' }
  },

  fn: async function (values, exits) {
      if (values.path[0] !== '/') {
        values.path = path.join(sails.config.vigilant.pluginPath, values.path);
      }

      fs.readFile(path.join(values.path, '/package.json'), (err, data) => {
        if (err) {
          return exits.error(err);
        }

        data = JSON.parse(data);
        return exits.success({
          name: data.name,
          description: data.description,
          version: data.version,
          author: data.author,
          license: data.license,
          keywords: data.keywords,
          repository: data.repository,
          path: values.path.split(sails.config.vigilant.pluginPath).join('')
        });
      });
  }

};