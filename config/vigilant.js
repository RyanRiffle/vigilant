const path = require('path');

module.exports = {
	vigilant: {

		/* pluginPath
		 *
		 * MUST end with a /
		 * 
		 * default location for vigilant to search for plugins
		 * plugins should be a nodejs project with a package.json
		 */
		pluginPath: path.join(__dirname + '/../plugins/')
	}
};