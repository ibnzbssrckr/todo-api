var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Todo API Root');
});

app.get('/todos', function(req, res) {
    res.json(todos);
});

app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    if (!isNaN(todoId))
    {
        for(var i = 0; i < todos.length; i++) {
            if (todos[i].id == todoId)
                res.json(todos[i]);
        }
    }

    res.status(404).send();
});

// POST /todos
app.post('/todos', function(req, res){
    var body = req.body;

    body.id = todoNextId++;
    todos.push(body);

    // todos.push({
    //     id: todoNextId,
    //     description: req.body.description,
    //     completed: req.body.completed
    // });

    res.json(body);
});

app.listen(PORT, function() {
   console.log('Express listening on port ' + PORT + '!');
});