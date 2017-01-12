const express = require('express');
const bodyParser = require('body-parser');

const {mongoose}  = require('./db/mongoose');
const {Todo}      = require('./models/todo');
const {User}      = require('./models/user');

var app = express();

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



app.listen(3000, () => {
  console.log('Started on port 3000');
})

module.exports = {app};
