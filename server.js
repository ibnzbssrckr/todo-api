var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

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

    db.Todo.findAll({where: where}).then(
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

    db.Todo.findById(todoId).then(
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

    db.Todo.create({
        description: body.description.trim(),
        completed: body.completed
    }).then(
        function(todo) { res.json(todo); }, 
        function(e) { res.status(400).json(e); }
    );
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id : todoId});
    if (!matchedTodo) {
        return res.status(404).send();
    }

    var body = _.pick(req.body, 'description', 'completed');

    var validAttributes = {};
    if(body.hasOwnProperty('completed') && _.isBoolean(body.completed)){
        validAttributes.completed = body.completed;
    } else if(body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }

    if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validAttributes.description = body.description.trim();
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    }

    _.extend(matchedTodo, validAttributes);

    res.json(matchedTodo);
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    var todoToDelete = _.findWhere(todos, {id: todoId});

    if (!todoToDelete) {
        res.status(404).json({"error": "no todo found with that id"});
    } else {
        todos = _.without(todos, todoToDelete);
        res.json(todoToDelete);
    }
});

db.sequelize.sync().then(function(){
    app.listen(PORT, function() {
        console.log('Express listening on port ' + PORT + '!');
    });
});

