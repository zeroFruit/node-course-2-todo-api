var mongoose = require('mongoose');

/*
  Connect Mongoose to Mongo
*/
mongoose.Promise = global.Promise; // now mongoose can use Promise
mongoose.connect('mongodb://localhost:27017/TodoApp');

module.exports = {
  mongoose
}
