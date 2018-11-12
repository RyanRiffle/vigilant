/**
 * PluginController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const simpleGit = require('simple-git/promise')(sails.config.vigilant.pluginPath);
const nodePath = require('path');

module.exports = {
	checkNewPlugins: async function(req, res)
	{
		var currentPlugins = await Plugin.find({});
		try {
			var newPlugins = [];

		  	fs.readdir(sails.config.vigilant.pluginPath, async function(err, files) {
		  		for (var fi = 0; fi < files.length; fi++) {
		  			var found = false;
		  			var file = files[fi];

		  			for (var pi = 0; pi < currentPlugins.length; pi++) {
		  				var plugin = currentPlugins[pi];
		  				if (plugin.path[0] !== '/')
		  					plugin.path = sails.config.vigilant.pluginPath + plugin.path;

		  				if (plugin.path === sails.config.vigilant.pluginPath + file) {
		  					found = true;
		  				}
		  			}

		  			if (!found) {
		  				await sails.helpers.pluginDetails.with({path: sails.config.vigilant.pluginPath + file})
		  					.then((details) => {
		  						details.status = 'Downloaded';
		  						newPlugins.push(details);
		  					})
		  					.catch(e => {
		  						newPlugins.push({
		  							name: file,
		  							error: 'Plugin does not contain a package.json'
		  						});
		  					});
		  			}
		  		}

		  		return res.json(newPlugins);
		  	});
		} catch(e) {
			return res.serverError(e);
		}
	},

	createFromUrl: async function(req, res)
	{
		if (!req.body.url) {
			return res.badRequest('Parameter `url` must be provided');
		}

		var plugin = await Plugin.create({
			name: 'Unknown',
			enabled: false,
			description: 'Unknown',
			author: 'Unknown',
			version: 'Unknown',
			license: 'Unknown',
			status: 'Download In Progress'
		}).fetch();

		simpleGit.clone(req.body.url)
			.then(async function() {
				//Done
				var path = req.body.url.split('/');
				path = path[path.length-1];
				path = path.split('.git').join('');

				await Plugin.update({id: plugin.id}).set({
					path: path,
					status: 'Downloaded',
					downloaded: true,
					enabled: true
				}).meta({fetch: true})
				.then(plugin => {
					return res.json(plugin[0]);
				})
				.catch(e => {
					return res.serverError(e);
				});
			})
			.catch(e => {
				return res.serverError(e);
			});
	},

	deleteFromDisk: async function(req, res)
	{
		if (!req.body.id) {
			return res.badRequest('Parameter `id` must be provided');
		}

		await sails.helpers.deletePluginFromDisk.with({id: req.body.id})
			.then(() => {
				return res.ok();
			})
			.catch(e => {
				return res.serverError(e);
			});
	},

	installDependencies: async function(req, res)
	{
		if (!req.body.id) {
			return res.badRequest('Parameter `id` must be provided');
		}

		var plugin = await Plugin.findOne({id: req.body.id});
		if (!plugin.downloaded) {
			return res.badRequest('Plugin has not been downloaded yet');
		}

		await sails.helpers.npmInstall.with({path: nodePath.join(sails.config.vigilant.pluginPath, plugin.path)})
			.then(async function(stdout) {
				plugin = await Plugin.update({id: req.body.id}).set({installed: true, path: plugin.path}).fetch();
				return res.json({
					output: stdout,
					plugin: plugin
				});
			})
			.catch(e => {
				return res.serverError(e);
			});
	}
};

