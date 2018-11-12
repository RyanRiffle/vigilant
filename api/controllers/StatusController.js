/**
 * StatusController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	service: async function(req, res)
	{
		return res.json({
			memory: process.memoryUsage(),
			pid: process.pid,
			platform: process.platform,
			version: process.version
		});
	}
};

