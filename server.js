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
    var queryParams = req.query;
    var filteredTodos  = todos;

    if(queryParams.hasOwnProperty('completed')) {
        if (queryParams.completed === 'true') {
            filteredTodos = _.where(filteredTodos, {completed: true});
        } else if(queryParams.completed === 'false') {
            filteredTodos = _.where(filteredTodos, {completed: false});
        } else {
            return res.status(400).send();
        }
    }

    if(queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        filteredTodos = _.filter(filteredTodos, function(todo) {
            return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
        })
    }

    res.json(filteredTodos);
});

app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    var matchedTodo = _.findWhere(todos, {id : todoId});

    (matchedTodo) ? res.json(matchedTodo) : res.status(404).send();
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
    // call create on db.Todo
    //  respond with 200 and todo
    //  fail error e.toJSON() error
    
    // if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
    //     return res.status(400).send();
    // }
    //
    // body.description = body.description.trim();
    //
    // body.id = todoNextId++;
    // todos.push(body);
    //
    // res.json(body);
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

