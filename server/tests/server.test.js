const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');



/*
  beforeEach executed before real test begin
  if beforeEach fail, then other test stop
*/
beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => { /* custom expect function */
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        /* find {text} document and that result number must be 1 */
        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2); /* test happens asynchronously */
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
      /*There's no need to provide function, because nothing to do
      asynchronously
      */
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    // todos/123
    request(app)
      .get('/todos/123')
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
      /*
        Because removing data from data is Async function, used done.
        At end() which means received HTTP response, execute done.
        Because receiving HTTP response means all database work has finished which also means
        asynchronous callback function is finally finished.
      */
      var hexId = todos[1]._id.toHexString();

      request(app)
        .delete(`/todos/${hexId}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.todo._id).toBe(hexId);
        })
        .end((err, response) => {
          /* The last thing to test is quering to database to check whether data is
            actually deleted.
          */
          if (err) {
            return done(err); // pass done a @err to notice mocha the error message
          }
          Todo.findById(hexId).then((todo) => {
            expect(todo).toNotExist();
            done();
          }).catch((e) => done(e));
        });
  });

  it('should return 404 if todo not found', (done) => {
    var hexId = new ObjectID().toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .expect(404)
      .end(done)
  });

  it('should return 404 if object id is invalid', (done) => {
    var hexId = new ObjectID().toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .expect(404)
      .end(done)
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var hexId = todos[0]._id.toHexString();
    var body = {
      text: 'Update test',
      completed: true
    };

    request(app)
      .patch(`/todos/${hexId}`)
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(body.text);
      })
      .end((err, response) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo.text).toBe(body.text);
          expect(todo.completed).toBe(true);
          expect(todo.completedAt).toBeA('number');
          done();
        }).catch((e) => done(e));
      });
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var hexId = todos[1]._id.toHexString();
    var body = {
      text: 'Update completed as false',
      completed: false
    };

    request(app)
      .patch(`/todos/${hexId}`)
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(body.text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo.text).toBe(body.text);
          expect(todo.completed).toBe(false);
          expect(todo.completedAt).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200) /* Now after request, we can now make assumption what should comes back */
      .expect((res) => { // assumption about body property
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => { /* this custom end function make db query to making sure everything goes good */
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        });
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = '123'; // invalid
    var password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    var email = users[0].email; // already exist
    var password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });
});
