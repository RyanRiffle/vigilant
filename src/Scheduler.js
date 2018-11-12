'use strict';

class Scheduler
{
	constructor()
	{
		this.schedules = {};
		this.pendingChecks = 0;
		this.checksPerMinute = 0;
		this._checksRan = 0;
	}

	/*
		Scheduler.initialize()
		Loads all schedules, 
	*/
	async init()
	{
		var schedules = await Schedule.find({enabled: true});

		if (schedules.length === 0) {
			sails.log.info('No schedules exist.');
		}

		for (var i = 0; i < schedules.length; i++) {
			this.beginSchedule(schedules[i]);
		}

		setInterval(() => {
			this.checksPerMinute = this._checksRan;
			this._checksRan = 0;
		}, 60000);
	}

	async beginSchedule(sched)
	{
		sails.log.info('Starting Schedule: ' + sched.name);

		var hostSchedules = await HostSchedule.find({schedule: sched.id});
		sched.hosts = hostSchedules;
		if (hostSchedules.length === 0) {
			sails.log.info('    Sleeping.... No hosts assigned to schedule.');
			await Schedule.update({id: sched.id}).set({state: 'inactive', errorString: 'Sleeping. No hosts assigned to schedule'});
			return;
		}

		sails.log.info('    Monitors: ' + sched.hosts.length + ' hosts');
		var d = new Date(Date.now() + sched.interval);
		sails.log.info('    Next Run: ' + (d.toString()));
		sails.log.info('    Last State: ' + sched.state);

		if (typeof sched.plugin !== 'number') {
			sched.plugin = sched.plugin.id;
		}

		if (!buoy.PluginManager.isPluginLoaded(sched.plugin)) {
			sails.log.error('Unable to start schedule \"' + sched.name + '\". Plugin is not loaded.');
			await Schedule.update({id: sched.id}).set({state: 'error', errorString: 'Unable to start. Plugin not loaded.'});
			this.setHostStatus(sched, 'unknown');
			return;
		}

		this.schedules[sched.id] = setInterval(() => {
			this.executeSchedule(sched);
		}, sched.interval);
	}

	async updateSchedule(sched)
	{
		this.endSchedule(sched);
		this.beginSchedule(sched);
	}

	async endSchedule(sched, opts)
	{
		clearInterval(this.schedules[sched.id]);
		delete this.schedules[sched.id];
		sails.log.info('Ended Schedule: ' + sched.name);
		sails.log.info('    Reason: ' + (opts.reason || 'unknown'));
	}

	isScheduleRunning(sched) 
	{
		return Object.keys(this.schedules).indexOf(sched.id) !== -1;
	}

	async executeSchedule(sched)
	{
		await Schedule.update({id: sched.id}).set({lastRun: Date.now(), state: 'running'});
		sails.log.debug('Executing Schedule: ' + sched.name + ' (interval: ' + sched.interval + 'ms)');

		var hosts = await HostSchedule.find({schedule: sched.id});
		this.pendingChecks += hosts.length;
		for (var i = 0; i < hosts.length; i++) {
			var host = await Host.findOne({id: hosts[i].host});
			if (host) {
				if (await buoy.PluginManager.checkHost(sched.plugin, host, hosts[i].options) !== true) {
					sails.log.debug("Check failed for host " + host.name);
					await HostSchedule.update({host: host.id, schedule: sched.id}).set({lastOutcome: 'down'});
				} else {
					sails.log.debug('Check passed for host ' + host.name);
					await HostSchedule.update({host: host.id, schedule: sched.id}).set({lastOutcome: 'up'});
				}
			}
			this.pendingChecks -= 1;
			this._checksRan++;
		}

		await Schedule.update({id: sched.id}).set({state: 'waiting', errorString: ""});
	}

	async setHostStatus(sched, status)
	{
		var hosts = await HostSchedule.find({schedule: sched.id});

		for (var i = 0; i < hosts.length; i++) {
			var host = await Host.findOne({id: hosts[i].host});
			if (host) {
				await HostSchedule.update({host: host.id, schedule: sched.id}).set({lastOutcome: status});
			}
		}
	}
}

module.exports = Scheduler;