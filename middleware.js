module.exports = function(db) {
    return {
        requireAuthentication: function(req, res, next) {
            var token = req.get('Auth');

            if(!token)
                return res.sendStatus(401);

            db.user.findByToken(token).then(function(user) {
                req.user = user;
                next();
            }, function() {
                return res.sendStatus(401);
            });
        }
    };
};