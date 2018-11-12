'use strict';

const net = require('net');
const path = require('path');

class PluginManager
{
	constructor()
	{	
		this.loadedPlugins = {};
	}

	async init()
	{
		sails.log.info('Loading plugins');
		var plugins = await Plugin.find({enabled: true});

		return new Promise((resolve, reject) => {
			plugins.forEach(plugin => {
				this.loadPlugin(plugin);
			});

			resolve(this.loadedPlugins);
		});
	}

	async loadPlugin(pluginData)
	{
		try {
			var plugin = require(path.join(sails.config.vigilant.pluginPath, pluginData.path));
			this.loadedPlugins[pluginData.id] = new plugin();
		} catch (e) {
			sails.log.error(e);
		}

		sails.log.info('Succesfully loaded plugin: ' + pluginData.name);
	}

	async unloadPlugin(pluginData)
	{
		if (this.isPluginLoaded(pluginData.id)) {
			sails.log.info('Unloading Plugin: ' + pluginData.name);
			sails.log.info('    Description: ' + pluginData.description);
			delete this.loadedPlugins[pluginData.id];
		}
	}

	async reloadPlugin(pluginData)
	{
		this.unloadPlugin(pluginData);
		this.loadPlugin(pluginData);
	}

	isPluginLoaded(pluginID)
	{
		return Object.keys(this.loadedPlugins).indexOf(pluginID + '') !== -1;
	}

	validatePluginOptions(pluginID, opts)
	{
		if (!this.isPluginLoaded(pluginID)) {
			return {
				success: false,
				errorString: 'Plugin not loaded'
			};
		}

		var pluginMetaKeys = Object.keys(this.loadedPlugins[pluginID].meta.options);
		
		for (var i = 0; i < pluginMetaKeys.length; i++) {
			var metaKey = pluginMetaKeys[i];
			if (!opts[metaKey]) {
				continue;
			}

			if (typeof opts[metaKey] !== this.loadedPlugins[pluginID].meta.options[metaKey].type) {
				return false;
			}

			var metaOpts = this.loadedPlugins[pluginID].meta.options;
			if (metaOpts[metaKey].defaultsTo) {
				if (!opts[metaKey]) {
					opts.metaKey = metaOpts[metaKey].defaultsTo;
				}
			}
		}

		return opts;
	}

	async checkHost(pluginID, host, options)
	{
		if (!this.isPluginLoaded(pluginID)) {
			return {
				success: false,
				errorString: 'Plugin not loaded'
			};
		}

		var result = false;
		if (net.isIP(host.ip, 4)) {
			result = await this.loadedPlugins[pluginID].checkHostIPv4(host.ip, options);
		} else if (net.isIP(host.ip, 6)) {
			result = await this.loadedPlugins[pluginID].checkHostIPv6(host.ip, options);
		} else {
			result = await this.loadedPlugins[pluginID].checkHost(host.dnsname || host.name, options);
		}

		return result;
	}
}

module.exports = PluginManager;