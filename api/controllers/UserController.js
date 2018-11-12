/**
 * UserController
 * @description :: Server-side logic for manage user's authorization
 */
var passport = require('passport');
/**
 * Triggers when user authenticates via passport
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Object} error Error object
 * @param {Object} user User profile
 * @param {Object} info Info if some error occurs
 * @private
 */
async function _onPassportAuth(req, res, error, user, info) 
{
  if (error) return res.serverError(error);
  if (!user) return res.unauthorized(null, info && info.code, info && info.message);
 
  var token = await sails.helpers.createToken.with(user);
  res.cookie('jwt', token, { httpOnly: true });

  try {
    await Session.create({jwt: token, user: user.id});
  } catch(e) {
    return res.serverError(e);
  }

  return res.ok({
    user: {email: user.email, firstName: user.firstName, lastName: user.lastName, id: user.id}
  });
}
 
module.exports = {
  /**
   * Sign up in system
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  signup: function (req, res) 
  {
    User
      .create(_.omit(req.allParams(), 'id'))
      .then(function (user) {
        return {
          token: sails.helpers.createToken(user),
          user: user
        };
      })
      .then(res.created)
      .catch(res.serverError);
  },
 
  /**
   * Sign in by local strategy in passport
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  signin: function (req, res) 
  {
    passport.authenticate('local', 
      _onPassportAuth.bind(this, req, res))(req, res);
  },

  logout: function (req, res) {
    res.clearCookie('jwt');
    return res.json({
      loggedOut: true
    });
  },

  isLoggedIn: function(req, res) 
  {
    passport.authenticate('jwt', function (error, user, info) {
      if (error) 
        return res.serverError(error);

      if (!user) {
        return res.json({
          loggedIn: false
        });
      }

      return res.json({
        loggedIn: true
      });
    })(req, res);
  },
};

