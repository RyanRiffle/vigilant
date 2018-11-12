/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function(done) {
  //Put default settings in the db if they don't exist
  await Setting.count({})
    .then(result => {
      if (result != 0)
        return;

      Object.keys(sails.config.vigilant).map(async function(key) {
        await Setting.create({name: key, value: sails.config.vigilant[key]});
      });
    });

  global.vigilant = require('../src/Backend');
  vigilant.PluginManager.init()
  .then(() => {
    vigilant.Scheduler.init();
  });

  /* Setup initial user if neccessary
   */
  if (await User.count({}) > 0)
    return done();
  else {
    sails.log.info('Creating initial user:');
    sails.log.info('  email: vigilant@vigilant.io');
    sails.log.info('  password: vigilant');
    await User.create({
      email: 'vigilant@vigilant.io',
      password: 'vigilant',
      firstName: 'Vigilant',
      lastName: 'User',
      role: 'Administrator'
    });
  }



  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  return done();

};
