var SHA256 = require('crypto-js/sha256')

module.exports = function(db) {
    return {
        requireAuthentication: function(req, res, next) {
            var token = req.get('Auth') || '';

            db.token.findOne({  // Check if in token hash table
                where: {
                    tokenHash: SHA256(token).toString()
                }
            }).then(function(tokenInstance) {
                if (!tokenInstance) {   // not in token hash table
                    throw new Error();
                }

                req.token = tokenInstance;      // pass the token instance in the request
                return db.user.findByToken(token);  // find the user that had the token
            }).then(function(user) {
                req.user = user;                    // send the user along in request
                next();
            }).catch(function() {
               res.sendStatus(401);
            });

            // db.user.findByToken(token).then(function(user) {
            //     req.user = user;
            //     next();
            // }, function() {
            //     return res.sendStatus(401);
            // });
        }
    };
};