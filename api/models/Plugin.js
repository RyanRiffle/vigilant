/**
 * Plugin.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const path = require('path');
const rimraf = require('rimraf');

module.exports = {
	attributes: {
		name: { type: 'string', required: true},
		path: { type: 'string' },
		enabled: { type: 'boolean' },
		description: { type: 'string' },
		version: { type: 'string' },
		author: { type: 'string' },
		license: { type: 'string' },
		status: { type: 'string' },
		downloaded: { type: 'boolean' },
		installed: { type: 'boolean' }
	},

	/* Pulls in the details of the plugin from the package.json */
	beforeUpdate: async function (plugin, next) {
		if (!plugin.path)
			next();
		
		var details = await sails.helpers.pluginDetails.with({path: plugin.path});
		plugin.name = details.name;
		plugin.description = details.description;
		plugin.version = details.version;
		plugin.author = details.author;
		plugin.path = details.path;
		next();
	},
	beforeCreate: async function (plugin, next) {
		if (!plugin.enabled)
			return next();

		var details = await sails.helpers.pluginDetails.with({path: plugin.path});
		plugin.description = details.description;
		plugin.version = details.version;
		plugin.author = details.author;
		plugin.path = details.path;
		plugin.enabled = true;
		plugin.downloaded = true;
		next();
	},

	//Load the plugin
	afterCreate: async function(plugin, next) {
		if (plugin.enabled)
			vigilant.PluginManager.loadPlugin(plugin);
		next();
	},

	//Unload the plugin from PluginManager and delete it from disk
	beforeDestroy: async function(query, next) {
		await sails.helpers.deletePluginFromDisk.with({id: query.where.id})
			.then(() => {
				return next();
			})
			.catch(e => {
				sails.log.error(e);
				return next();
			});
	}
};

