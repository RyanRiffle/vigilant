/**
 * User
 * @description :: Model for storing users
 */
module.exports = {
    schema: true,
    attributes: {
        password: {
            type: 'string'
        },
        email: {
            type: 'string',
            required: true,
            unique: true,
            isEmail: true
        },
        firstName: {
            type: 'string',
            defaultsTo: ''
        },
        lastName: {
            type: 'string',
            defaultsTo: ''
        },
        photo: {
            type: 'string',
            defaultsTo: '',
            isURL: true
        },
        role: {
            type: 'string',
            defaultsTo: 'user'
        }
    },
    beforeUpdate: async function (values, next) {
        values.password = sails.helpers.hashPassword.with(values);
        next();
    },
    beforeCreate: async function (values, next) {
        var password = await sails.helpers.hashPassword.with({password: values.password});
        values.password = password;
        next();
    },
    afterFetch: function(values, next) {
        delete values.password;
        next();
    }
};
