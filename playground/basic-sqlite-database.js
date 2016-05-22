var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
    dialect: 'sqlite',
    storage: __dirname + '/basic-sqlite-database.sqlite'
});

var Todo = sequelize.define('todo', {
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [1,250]
        }
    },
    completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

sequelize.sync({
     //   force: true
    }).then(function() {
    console.log('Everything synced');

    Todo.findById(5).then(function(todo) {
        if (todo)
            console.log(todo.toJSON());
        else
            console.log('Todo not found');
    });
    // todo.create({
    //     description: 'Take out the trash'
    // }).then(function(todo) {
    //    return todo.create({
    //        description: 'Clean office'
    //    })
    // }).then(function() {
    //     // return todo.findById(2);
    //     return todo.findAll({
    //        where: {
    //            description: {
    //                $like: '%Office%'
    //            },
    //            completed: false
    //
    //        }
    //     });
    // }).then(function(todos) {
    //     if(todos) {
    //         todos.forEach(function (todo) {
    //             console.log(todo.toJSON());
    //         });
    //     }
    //     else {
    //         console.log('No todo found');
    //     }
    // }).catch(function(e) {
    //     console.log(e);
    // });
});