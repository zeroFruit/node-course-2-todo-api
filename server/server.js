require('./config/config');

const _           = require('lodash');
const express     = require('express');
const bodyParser  = require('body-parser');
const {ObjectID}  = require('mongodb');

const {mongoose}  = require('./db/mongoose');
const {Todo}      = require('./models/todo');
const {User}      = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

/*
  Inside app.use, locate 3rd-party middleware or custom middleware
  By adding middleware inside app.use we can tell app we are going to use that middleware
*/
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    /* This is much better way with sending as object
      because sending as object can open the extendability
      we can add server status, other properties
    */
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET /todos/:id
app.get('/todos/:id', (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Todo.findById(id).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => res.status(400).send());
});

app.delete('/todos/:id', (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) {
      res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => res.status(400).send())
});

app.patch('/todos/:id', (req, res) => {
  var id    = req.params.id;
  var body  = _.pick(req.body, ['text', 'completed']); // we don't want user to modify timestamp

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  }
  else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});


// POST /users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body); // if one of info is not provided new User throw err by validator

  user.save().then(() => {
    /* When new user is signed up then send back token to them. */
    return user.generateAuthToken(); // will return auth token
  }).then((token) => {
    /* send auth token to user inside HTTP header
      x- prefix means this is custom header
    */
    res.header('x-auth', token).send(user);
  }).catch((e) => res.status(400).send(e));
});


// POST /users/login {email, password}
app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  /*
    Tip, Strategy
      call method first, so we can find what this method should do
  */
  User.findByCredentials(body.email, body.password).then((user) => {
    // then send back a token
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user); /* checking whether there's user params is determined by findByCredentials method */
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

/* logout*/
app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }).catch(() => res.status(400).send());
});

/* private route */
app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});


app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};
