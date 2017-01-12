var mongoose = require('mongoose');

/*
  Connect Mongoose to Mongo

  process.env.MONGODB_URI is for heroku
  the other is for our local machine
*/
mongoose.Promise = global.Promise; // now mongoose can use Promise
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp');

module.exports = {
  mongoose
}
