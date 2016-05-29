var request = require('supertest');
var server = require('../server');
var db = require('../db.js');
var should = require('should');

before(function (done) {
    db.sequelize.sync({force: true}).then(function() {
        done();
    });
});

describe('API', function () {
    var token1;
    var token2;

    var user1email = 'user3@example.com';
    var user1pword = 'password123';
    var user2email = 'user4@example.com';
    var user2pword = 'monkey456';

    before(function(done) {
        // Create a 1st user
        db.user.create({
            email: 'user1@example.com',
            password: 'qwerty123'
        }).then(function(user) {
            // retain the users token
            token1 = user.generateToken('authentication');
            // Create a _todo to give the user
            db.todo.create({
                description: 'Walk the Dog',
                completed: false
            }).then(
                function(todo) {
                    // Give the _todo to the user
                    user.addTodo(todo);
                });
            // create a second _todo to give to user
            db.todo.create({
                description: 'Take out the trash',
                completed: false
            }).then(
                function(todo) {
                    // Give the _todo to the user
                    user.addTodo(todo);
                });
        }).then(function() {
            // Create a second user
            db.user.create({
                email: 'user2@example.com',
                password: 'password'
            }).then(function(user) {
                token2 = user.generateToken('authentication');
                done();
            });
        });
    });
    describe('User creation and login', function() {
        it('creates a user', function(done) {
            request(server)
                .post('/users')
                .send({email: user1email, password: user1pword})
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, done);
        });
        it('creates a 2nd user', function(done) {
            request(server)
                .post('/users')
                .send({email: user2email, password: user2pword})
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, done);
        });
        it('fails a duplicate email address', function(done) {
            request(server)
                .post('/users')
                .send({email: user1email, password: "differentPassword2"})
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(400, done);
        });
        it('fails a missing password', function(done) {
            request(server)
                .post('/users')
                .send({email: user1email})
                .expect('Content-Type', /text/)
                .expect(400, done);
        });
        it('logs in first user', function(done) {
            request(server)
                .post('/users/login')
                .expect('Content-Type', /json/)
                .send({email: user1email, password: user1pword})
                .expect(200, done);
        });
        it('logs in second user', function(done) {
            request(server)
                .post('/users/login')
                .send({email: user2email, password: user2pword})
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
        it('fails a user with the wrong password', function(done) {
            request(server)
                .post('/users/login')
                .expect('Content-Type', /text/)
                .send({email: user1email, password: "wrongpassword"})
                .expect(401, done);
        });
    });
    describe('POST /todos ', function() {
        it('user1 should be able to create post with valid token', function (done) {
            request(server)
                .post('/todos')
                .set({'Auth': token1})
                .send({description: "Eat Lunch", completed: true})
                .expect(200, done);
        });
        it('user1 should not be able to create post without token', function (done) {
            request(server)
                .post('/todos')
                .send({description: "Eat Lunch", completed: true})
                .expect(401, done);
        });
        it('should return JSON for the created todo', function(done) {
            var desc = 'Walk the dog';
            var compl = false;
            request(server)
                .post('/todos')
                .set({'Auth': token1})
                .send({description: desc, completed: compl})
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res){
                    res.body.should.have.keys('createdAt', 'updatedAt', 'id', 'userId', 'description', 'completed');
                    res.body.id.should.be.a.Number();
                    res.body.userId.should.be.a.Number();
                    res.body.description.should.be.a.String().and.exactly(desc);
                    res.body.completed.should.be.a.Boolean().and.exactly(compl);
                    if (err) return done(err);
                    done();
                });
        });
        describe('user2 creates 3 posts', function() {
            it('user2 should be able to create a 2nd post', function (done) {
                request(server)
                    .post('/todos')
                    .set({'Auth': token2})
                    .send({description: "Go to the ball", completed: true})
                    .expect(200, done);
            });
            it('user2 should be able to create a 3rd post', function (done) {
                request(server)
                    .post('/todos')
                    .set({'Auth': token2})
                    .send({description: "Pick up milk", completed: true})
                    .expect(200, done);
            });
            it('user2 should be able to create a 4th post', function (done) {
                request(server)
                    .post('/todos')
                    .set({'Auth': token2})
                    .send({description: "Take out trash", completed: false})
                    .expect(200, done);
            });
        });
        it('should not allow an empty description key', function(done) {
            request(server)
                .post('/todos')
                .set({'Auth': token1})
                .send({description: "", completed: true})
                .expect(400, done);
        });
        it('should allow omission of the completed key and default to false', function(done) {
            request(server)
                .post('/todos')
                .set({'Auth': token1})
                .send({description: "Go to the ball"})
                .expect(200)
                .end(function(err, res) {
                    res.body.should.have.keys('id', 'description', 'completed', 'userId', 'createdAt', 'updatedAt');
                    res.body.completed.should.be.a.Boolean().and.be.exactly(false);
                    if(err) return done(err);
                    done();
                });
        });
    });
    describe('GET /todos', function() {
        it('should be able to consume the route /todos with valid token', function (done) {
            request(server)
                .get('/todos')
                .set({'Auth': token1})
                .expect(200, done);
        });
        it('should not be able to consume the route /todos without valid token', function (done) {
            request(server)
                .get('/todos')
                .expect(401, done);
        });
        it('should only return todos for the current user', function(done) {
            request(server)
                .get('/todos')
                .set({'Auth': token1})
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    res.body.forEach(function(todo) {
                        todo.userId.should.be.exactly(1);
                    });
                    // console.log(Array.isArray(res.body));
                    if(err) return done(err);
                    done();
                });
        });
        it('ran with query completed=true should only return todos where completed=true', function(done) {
            request(server)
                .get('/todos')
                .set({'Auth': token1})
                .query({completed: true})
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    res.body.forEach(function(todo) {
                        todo.completed.should.be.exactly(true);
                    });
                    // console.log(Array.isArray(res.body));
                    if(err) return done(err);
                    done();
                });
        });
        it('ran with query completed=false should only return todos where completed=false', function(done) {
            request(server)
                .get('/todos')
                .set({'Auth': token1})
                .query({completed: false})
                .expect('Content-type', /json/)
                .expect(200)
                .end(function(err, res) {
                    res.body.forEach(function(todo) {
                        todo.completed.should.be.exactly(false);
                    });
                    // console.log(Array.isArray(res.body));
                    if(err) return done(err);
                    done();
                });
        });
        it('ran with query q="search phrase" should only return todos with description containing "search phrase"',
            function(done) {
                var searchPhrase = 'WALK';

                request(server)
                    .get('/todos')
                    .set({'Auth': token1})
                    .query({q: searchPhrase})
                    .expect('Content-type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        res.body.forEach(function(todo) {
                            var todoDescription = todo.description.toLowerCase();
                            todoDescription.indexOf(searchPhrase.toLowerCase()).should.be.aboveOrEqual(0);
                        });
                        // console.log(Array.isArray(res.body));
                        if(err) return done(err);
                        done();
                    });
            });
    });
    describe('GET /todos/:id', function() {
        it('should be able to consume the route /todos/:id with valid token and id', function (done) {
            request(server)
                .get('/todos/1')
                .set({'Auth': token1})
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
        it('should not be able to consume the route /todos/:id without valid token', function (done) {
            request(server)
                .get('/todos/1')
                .expect('Content-Type', /text/)
                .expect(401, done);
        });
        it('should return JSON of the created todo', function(done) {
            request(server)
                .get('/todos/1')
                .set({'Auth': token1})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    res.body.should.have.keys('id', 'description', 'completed', 'createdAt', 'updatedAt', 'userId');
                    res.body.id.should.be.exactly(1);
                    res.body.userId.should.be.exactly(1);
                    if (err) return done(err);
                    done();
                });
        });
        it('should return 404 if the post is not found', function(done) {
           request(server)
               .get('/todos/100')
               .set({'Auth': token1})
               .expect(404, done);
        });
    });
    describe('DELETE /todos/:id', function() {
        it('should not be able to consume the route /todos/:id without valid token', function (done) {
            request(server)
                .delete('/todos/1')
                .set('Auth', 'abc123')
                .expect('Content-Type', /text/)
                .expect(401, done);
        });
        it('should DELETE posts that the user owns', function (done) {
            request(server)
                .delete('/todos/1')
                .set('Auth', token1)
                .expect('Content-Type', /json/)
                .expect(204, function() {
                    request(server)
                        .get('/todos/1')
                        .set('Auth', token1)
                        .expect(404, done);
                });
        });
        it('should not be able to DELETE posts that the user does not own', function (done) {
            request(server)
                .delete('/todos/6')
                .set('Auth', token1)
                .expect('Content-Type', /json/)
                .expect(400, done);
        });
    });
    describe('PUT /todos/:id', function() {
        it('should be able to edit a /todos/:id with valid token and id', function (done) {
            var newDescription = 'Take out the inside trash';
            request(server)
                .put('/todos/2')
                .set({'Auth': token1})
                .send({description: 'Take out the inside trash'})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err) {
                    if (err) return done(err);
                    request(server)
                        .get('/todos/2')
                        .set({'Auth': token1})
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function(err, res) {
                           if (err) return done(err);
                            res.body.description.should.be.exactly(newDescription);
                            done();
                        });
                });
        });
        it('should not be able to consume the route /todos/:id without valid token', function (done) {
            request(server)
                .put('/todos/2')
                .send({description: 'Pet the cat'})
                .expect('Content-Type', /text/)
                .expect(401, done);
        });
        it('should not be able to DELETE posts that the user does not own', function (done) {
            request(server)
                .put('/todos/6')
                .set('Auth', token1)
                .send({description: 'Wash the dishes'})
                .expect('Content-Type', /text/)
                .expect(404, done);
        });
    });
});