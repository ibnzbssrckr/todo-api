var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': __dirname + '/basic-sqlite-database.sqlite'
});

var Todo = sequelize.define('todo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

var UserTodo = sequelize.define('userTodo', {
	// No attributes required, just the userId and todoId
	// You could add something else here like a favorites boolean field so a user
	//   can mark a todo as "favorited".  
});

var SubTodo = sequelize.define('subTodo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

var User = sequelize.define('user', {
	email: Sequelize.STRING
});

User.belongsToMany(Todo, { through: UserTodo });
Todo.belongsToMany(User, { through: UserTodo });
SubTodo.belongsTo(Todo);
Todo.hasMany(SubTodo);

sequelize.sync({
	force: true
	}).then(function() {
	User.create({
		email: 'example2@example.com'
	}).then(function(user) {
		return Todo.create({description: 'Talk to grandma'}
		// return Todo.findOne({where: { id: 1}}
		).then(function(todo) {
			todo.addSubTodos([SubTodo.create({ description: "Take a poop"})]);
			return user.addTodos([todo]);
	});
}).then(function () {
		console.log('Everything worked, check the database.');
	}).catch(function () {
		console.log('Something went wrong. Catch was executed.');
	});
});
// }).then(function() {
// 	// Step One: Create a user
// 	User.create({
// 		email: 'example@example.com'
// 	}).then(function (user) {
// 		// Step Two: Create Todo
// 		return Todo.create({
// 			description: 'Learn many-to-many associations'
// 		}).then(function (todo) {
// 			// Step Three: Add todo to user
// 			return user.addTodos([todo])
// 		});
// 	}).then(function () {
// 		console.log('Everything worked, check the database.');
// 	}).catch(function () {
// 		console.log('Something went wrong. Catch was executed.');
// 	});
// });
