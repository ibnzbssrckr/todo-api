var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');

var app = express();
var PORT = process.env.PORT || 3000;

var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', function(req, res) {
    var query = req.query;
    var where = {};

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
            res.status(500).send();
        }
    );
});

app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findById(todoId).then(
        function(todo) {
            (!!todo) ? res.json(todo.toJSON()) : res.status(404).send();
        },
        function(e) {
            res.status(500).send();
        }
    );
});

// POST /todos
app.post('/todos', function(req, res){
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create({
        description: body.description.trim(),
        completed: body.completed
    }).then(
        function(todo) { res.json(todo.toJSON()); },
        function(e) { res.status(400).json(e); }
    );
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    if(body.hasOwnProperty('completed')){
        attributes.completed = body.completed;
    }

    if(body.hasOwnProperty('description')) {
        attributes.description = body.description.trim();
    }

    db.todo.findById(todoId).then(
        function(todo){
            if(todo){
                return todo.update(attributes);
            } else {
                res.sendStatus(404);
            }
        },
        function() {
            res.sendStatus(500);
        }).then(
        function(todo){
            res.json(todo.toJSON());
        },
        function(e) { res.sendStatus(400).json(e); });
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({where: { id: todoId }}).then(
        function(rowsDeleted) {
            if (rowsDeleted === 0) {
                res.status(400).json({
                    "error" : "no todo found with that id"});
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

    db.user.create({
        email: body.email.trim(),
        password: body.password
    }).then(
        function(user) { res.json(user.toPublicJSON()); },
        function(e) { res.status(400).json(e); }
    );
});

// POST /users/login
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');
    
    db.user.authenticate(body).then(function(user){
        return res.json(user.toPublicJSON());
    }, function() {
        return res.sendStatus(401);
    });
});

db.sequelize.sync({force: true}).then(function(){
    app.listen(PORT, function() {
        console.log('Express listening on port ' + PORT + '!');
    });
});

