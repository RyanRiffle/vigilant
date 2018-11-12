const rimraf = require('rimraf');
const path = require('path');

module.exports = {
  friendlyName: 'Unloads and deletes plugin from disk',
  description: 'Unloads a plugin from memory and deletes it from the disk',

  inputs: {
    id: { type: 'number' }
  },

  fn: async function (values, exits) {
      var plugin = await Plugin.findOne(values.id);
      if (!plugin)
        return exits.error('No such plugin exists');
      
      vigilant.PluginManager.unloadPlugin(plugin);

      var newPath = path.join(sails.config.vigilant.pluginPath, plugin.path);
      if (newPath === sails.config.vigilant.pluginPath || 
        newPath.length < sails.config.vigilant.pluginPath.length ||
        newPath.indexOf(sails.config.vigilant.pluginPath) === -1) {
        
        sails.log.error('Helper deletePluginFromDisk() attempted to delete the folder: ' + newPath);
        exits.error('Helper deletePluginFromDisk() attempted to delete the folder: ' + newPath);
      }

      rimraf(newPath, function(err) {
        if (err)
          sails.info.error(err);
        exits.success();
      });
  }

};