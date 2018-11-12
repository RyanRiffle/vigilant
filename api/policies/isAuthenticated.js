/**
 * isAuthenticated
 * @description :: Policy to inject user in req via JSON Web Token
 */
var passport = require('passport');
 
module.exports = async function (req, res, next) {
    passport.authenticate('jwt', function (error, user, info) {

		if (error) 
			return res.serverError(error);

		if (!user) {
			return res.unauthorized({redirect: 'login'}, info && info.code, info && info.message);
		}

		req.user = user;
		next();
    })(req, res);
};