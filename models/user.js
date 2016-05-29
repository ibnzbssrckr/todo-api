// This is predetermined format to use with sequelize.import
var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7,100]
            },
            set: function(value) {
                var salt = bcrypt.genSaltSync();
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        }
    }, {
        hooks: {
            beforeValidate: function(user, options) {
                user.email = user.email.toLowerCase().trim();
            }
        },
        instanceMethods:  {
            toPublicJSON: function() {
                var json = this.toJSON();
                return _.pick(json, ['id', 'email', 'createdAt', 'updatedAt']);
            },
            generateToken: function(type) {
                if(typeof type !== 'string'){
                    return undefined;
                }

                try {
                    var stringData = JSON.stringify({id: this.get('id'), type: type});
                    var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString();
                    return jwt.sign({ token: encryptedData }, 'qwerty098');
                } catch(e) {
                    console.error(e);
                    return undefined;
                }
            }
        },
        classMethods: {
            authenticate : function(body) {
                return new Promise(function(resolve, reject) {
                    if (!_.isString(body.email) || !_.isString(body.password)) {
                        return reject();
                    }

                    user.findOne({where: { email: body.email }}).then(
                        function(user) {
                            if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                                return reject();
                            }

                            return resolve(user);
                        }, function(e) {
                            return reject(e);
                        }
                    );
                });
            },
            findByToken : function(token) {
                return new Promise(function(resolve, reject){
                    try {
                        var decodedJWT = jwt.verify(token, 'qwerty098');
                        var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
                        var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

                        user.findById(tokenData.id).then(function(user) {
                            if(user) {
                                resolve(user);
                            } else {
                                reject();
                            }
                        }, function(e) {
                           reject(e);
                        });
                    } catch(e) {
                        reject(e);
                    }
                });
            }
        }
    });
    return user;
};