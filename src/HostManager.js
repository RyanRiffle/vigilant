'use strict';

class HostManager
{
	constructor()
	{

	}

	async updateHostStatus(hostID, state, plugin, options)
	{
		var host = Host.findOne({id: hostID});
		var status = host.status;
	}
}

module.exports = HostManager;