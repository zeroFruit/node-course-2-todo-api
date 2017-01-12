const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose}  = require('./db/mongoose');
const {Todo}      = require('./models/todo');
const {User}      = require('./models/user');

var app = express();
const port = process.env.PORT || 3000;

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

  Todo.findByIdAndRemove(id).then((doc) => {
    if (!doc) {
      res.status(404).send();
    }
    res.send({doc});
  }).catch((e) => res.status(400).send())
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
})

module.exports = {app};
