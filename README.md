# Vigilant

A network monitoring service built with Node.js. The project was created because a lot of other monitoring systems are overly complicated to get up and running. Vigilant has a plugin system built on Node.js packages that are pulled from Git repositories. The plugins allow for monitoring different types of services on the network.

This repo hosts the REST API and the backend that runs the plugins against hosts according to the schedules configured. Currently no actual database is used, an on-disk database that is provided by Sails.js is still being used while in development.

## Disclaimer

The project at this time can use plugins to monitor services however the frontend [vigilang-web](https://github.com/RyanRiffle/vigilant-web) is not even minimally viable yet. In the frontend you can add hosts and plugins but are not able to setup schedules for using the plugins to scan the hosts. So to be able to use the service you must use an application like Postman until it is implemented.

## Building for Development
To get started you should install Sails.js.
```
npm install -g sails
```

Next, clone both the vigilant and vigilant-web repositories and install the depencies.
```sh
git clone https://github.com/RyanRiffle/vigilant.git
cd vigilant
npm install

git clone https://github.com/RyanRiffle/vigilant-web.git
cd vigilant-web
npm install
```

Both parts of the application (Backend / Frontend) will have to be started independently.
```sh
# To start the Backend
cd vigilant
sails inspect #or `sails lift` if you don't want to debug

# To start the Frontend
cd vigilant-web
npm run start
```

The backend by default listens at [http://localhost:1337/](http://localhost:1337/) and the frontend at [http://localhost:3000/](http://localhost:3000). The default username and password are:
```
Email: vigilant@localhost
Password: vigilant
```

## Big Picture

#### The API
There are a few things that are essential to monitoring with Vigilant. The `Host`, `Plugin`, and `Schedule`.

The `Host` does nothing on its own. It just stores information about a particular host like name, DNS name, and IP addresses.

The `Plugin` does a little more. It stores information about the plugin and where to find it. It will also, if the plugin is in the database and enabled, will register the plugin with the `vigilant.PluginManager`. Still though the PluginManger doesn't really do a lot on its own.

The `Schedule` is where the system sets up. A schedule is essentially the driver for the `Plugin`. A schedule includes things like an interval to run the plugin, and what hosts should be given to the plugin and with what options so that the plugin may correctly check the host. The `interval` is specified in *milliseconds* and is used to `setInterval()` to run the plugin on all of the hosts associated with the schedule every `interval` milliseconds. In conclusion without a Schedule nothing will ever be monitored.

#### The Backend
Under the namespace `vigilant.*` is the actual monitoring system. There are two primary children of the namespace.
* `vigilant.PluginManager`
* `vigilant.Scheduler`

The PluginManager is responsible for loading and unloading plugins at startup by itself. It will load and unload plugins when told to do so by some other part of the application.

The Scheduler loads all `Schedule`'s and sets up the timers for running the plugins at an interval. The Scheduler actually passes the details of what host and what options to use for scanning the host.


### Plugin Structure

* **Must** have a valid `package.json`
* **Should** contain the following fields at minimum:
  * name
  * description
  * version
  * author
  * license

* **Must** export a Class with the following methods
  * checkHost
  * checkHostIPv4
  * checkHostIPv6
* **Must** have a `meta` property to let the plugin manager know what types of information it expects from the user to use the plugin for monitoring.
```js
class MyPlugin
{
	constructor()
	{
		this.meta = {
			options: {
				port: { type: "number", defaultsTo: 80 },
				protocol: { type: "string", oneOf: ["http", "https"], defaultsTo: "http" },
				path: { type: "string", defaultsTo: "/"},
				description: { type: "string" }
			}
		};
	}

	/*
	* checkHost(name, opts)
	* called to have the plugin check a host by hostname or
	* DNS name
	*/
	checkHost(hostname, opts) {
		console.log(hostname, opts);
		/* what opts would look like
		  {
		    port: 8080,
		    protocol: 'HTTP',
		    path: '/some/path/to/test',
		    description: 'HTTP server for documentation'
		  }
		*/
	}

  /*
   * checkHostIPv4(name, opts)
   * called to have the plugin check a host by IPv4 Address
   */
  checkHostIPv4(ip, opts) {
    console.log(ip, opts);
  }

	/*
	* checkHostIPv6(name, opts)
	* called to have the plugin check a host by IPv6 Address
	*/
	checkHostIPv6(ip, opts) {
		console.log(ip, opts);
	}
}
module.exports = MyPlugin;
```

### Plugin import process
The best way to import a plugin is using the `POST /plugin/createFromUrl` and `POST /plugin/installDependencies` API endpoints which is what `vigilant-web` does when you add a plugin. It follows these steps:
* `POST /plugin/createFromUrl`
	* Creates a new plugin in the database with **no** `path` and sets the other fields like this:
		* `name`, `description`, `version`, `author`, `license` -- `"Unknown"`
		* `status` -- `"Downloading"`
		* `downloaded`, `installed` -- `false`
	* Clones the repository specified by the JSON request body `url` field.
	* Once download is complete, it updates the plugin record.
		* `path`: Absolute path to plugin **OR** just the folder name if it is located in `sails.config.vigilant.pluginPath` (*defaults to*: vigilant/pugins)
		* `downloaded` -- `true`
		* `status` -- `"Downloaded"`
		* `enabled` -- `true`
	* Returns `200 OK` and the plugin record that was created as JSON.
* `POST /plugin/installDependencies`
	* Uses sails helper `sails.helpers.npmInstall`
		* Uses `child_process.exec` to run `npm install` in the directory of the plugins
	* Once installed, updates the `installed` field of the plugin record to `true`
	* Returns `200 OK` and JSON: `{output: /*Output from npm install*/}`

When not using that method of importing plugins the steps below is the basic gist of how to add one.
* Get the plugin downloaded.
* `POST /plugin` with at **minimum** the `path` field.
	* The `path` field should be just the folder name if it is in the `sails.config.vigilant.pluginPath` **OR** the absolute path to the plugin directory.
	* Before the plugin is put in the database, the server will read it's `package.json` and retrieve the following fields:
		* `name`
		* `description`
		* `author`
		* `version`
		* `license`
* `POST /plugin/installDependencies` if the plugin hasn't had it's npm dependencies downloaded.

*Did you notice `path` field of a plugin is very important when creating a new record or updating?* That's because the server uses hooks on the `Plugin` model for `beforeCreate` and `beforeUpdate`. When you attempt to create or update a plugin if the `path` field is present it will automatically read the `package.json` and update the remaining fields. This can get a little tricky if you don't remember it and you plan to modify the server side for plugins.

### Managing Hosts
Hosts are 100x simpler than plugins. All fields are filled in via the JSON sent during the request. There is only one exception to the rule:
* If no `ipv4` or `ipv6` address is specified or equals `''` and the `dnsname` was specified, it will attempt to lookup the IP addresses before creating the host.

### Built With
* [Sails.js](https://sailsjs.com/) - REST API
* [Passport](http://www.passportjs.org/) - Authentication abstractions
* [Simple-Git](https://github.com/steveukx/git-js) - Git repositories
* [Bcrypt](https://github.com/kelektiv/node.bcrypt.js.git) - Password Security
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken.git) - JWT for authentication
