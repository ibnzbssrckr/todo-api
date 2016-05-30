// This is predetermined format to use with sequelize.import
var SHA256 = require('crypto-js/sha256')

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('token', {
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [1]
            },
            set: function(value) {
                var tokenHash = SHA256(value).toString();

                this.setDataValue('token', value);
                this.setDataValue('tokenHash', tokenHash);
            }
        },
        tokenHash: DataTypes.STRING
    });
};