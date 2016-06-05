var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', middleware.requireAuthentication, function(req, res) {
    var query = req.query;
    var where = {userId: req.user.get('id')};

    if(query.hasOwnProperty('completed')) {
        if (query.completed === 'true') {
            where.completed = true;
        } else if (query.completed === 'false') {
            where.completed = false;
        }
    }

    if(query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = { $like: '%' + query.q + '%' };
    }

    db.todo.findAll({where: where}).then(
        function(todos) {
            res.json(todos);
        },
        function(e) {
            res.status(500).json(e);
        }
    );
});

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findOne({where: { id: todoId, userId: req.user.get('id') }}).then(
        function(todo) {
            (!!todo) ? res.json(todo.toJSON()) : res.status(404).send();
        },
        function(e) {
            res.status(500).json(e);
        }
    );
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res){
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create({
        description: body.description.trim(),
        completed: body.completed
    }).then(
        function(todo) {
            req.user.addTodo(todo).then(function() {
                return todo.reload();
            }).then(function(todo) {
                res.json(todo.toJSON());
            });
        },
        function(e) { res.status(400).json(e); }
    );
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    if(body.hasOwnProperty('completed')){
        attributes.completed = body.completed;
    }
    if(body.hasOwnProperty('description')) {
        attributes.description = body.description.trim();
    }

    db.todo.findOne({ where: { id: todoId, userId: req.user.get('id')} })
        .then(
            function(todo){
                if(todo){
                    todo.update(attributes)
                        .then(function(todo) {      // Success
                            res.json(todo.toJSON());
                        }, function(e) {            // User sent bad data
                            res.sendStatus(400).json(e);
                        });
                } else {
                    res.sendStatus(404);    // Post not found
                }
            }, function() { return res.sendStatus(500); }   // something else went wrong
        );
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({where: { id: todoId, userId: req.user.get('id') }}).then(
        function(rowsDeleted) {
            if (rowsDeleted === 0) {
                res.status(400).json({
                    "error" : "no todo found with that id for this user"});
            } else {
                res.sendStatus(204);
            }
        },
        function() {
            res.sendStatus(500);
        });
});

app.post('/users/', function(req, res) {

    var body = _.pick(req.body, 'email', 'password');

    if(typeof body.email !== 'string' || typeof body.password !== 'string')
        return res.sendStatus(400);

    db.user.create({
        email: body.email,
        password: body.password
    }).then(
        function(user) { res.json(user.toPublicJSON()); },
        function(e) { return res.status(400).json(e); }
    );
});

// POST /users/login
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');
    var userInstance;
    
    db.user.authenticate(body).then(function(user){
        var token = user.generateToken('authentication');
        userInstance = user;

        return db.token.create({
            token: token
        });

    }).then(function(tokenInstance) {
        var resJSON = userInstance.toPublicJSON();
        // Add token to response
        resJSON.auth_token = tokenInstance.get('token');
        return res.header('Auth', tokenInstance.get('token')).json(resJSON).status(200);
    }).catch(function(e) {
        res.sendStatus(401).json(e);
    })
});

app.delete('/users/login', middleware.requireAuthentication, function(req, res) {
    req.token.destroy().then(
        function() {
            res.sendStatus(204);
        },
        function(e) {
            res.sendStatus(500).json(e);
        }
    );
});

if (process.env.NODE_ENV !== 'testing')
{
    db.sequelize.sync().then(function(){
        app.listen(PORT, function() {
            console.log('Express listening on port ' + PORT + '!');
        });
    });
}

module.exports = app;