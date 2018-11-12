const PluginManager = require('./PluginManager');
const Scheduler = require('./Scheduler');
const HostManager = require('./HostManager');

module.exports = {
	PluginManager: new PluginManager(),
	Scheduler: new Scheduler(),
	HostManager: new HostManager()
};