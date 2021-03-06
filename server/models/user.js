const {mongoose}  = require('../db/mongoose');
const validator   = require('validator');
const jwt         = require('jsonwebtoken');
const _           = require('lodash');
const bcrypt      = require('bcryptjs');

/* Store the schema of user model */
var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
        // invalid when @value with function inside is return false
        // return either false or true
      message: '{VALUE} is not a valid email' // error message
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  tokens: [{ // token is actually array, MongoDB support this nested document
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

/* **Override function** to control what is sent back to user
  Server should exclude password and tokens value when HTTP response
*/
UserSchema.methods.toJSON = function() {
  /* Everytime document is converted into object this method executed */
  var user = this;
  var userObject = user.toObject(); /* convert mongoose document into regular object */

  return _.pick(userObject, ['_id', 'email']); /* leaving off password, token property */
};

/*
 UserSchema.methods is going to be instance object
In this case, generateAuthToken is now going to be instance method
 */
UserSchema.methods.generateAuthToken = function () {
  /* Arrow function don't bind @this keyword
    But we need this keyword because @this contains its individual documents.
  */
  var user = this; // user.generateAuthToken, so @this points to user instance
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET /* this is server jwt secret and will move on to config file */).toString();

  user.tokens.push({ access, token }); /* update user property */

  return user.save().then(() => { /* save user into db and return auth token */
    return token; /* when return value inside Promise that value passes into next Promise success case function parameter */
  });
};

UserSchema.methods.removeToken = function (token) {
  var user = this;

  return user.update({
    $pull: { /* if token match with data then pull (remove) that token property*/
      tokens: { token }
    }
  });
};

/*
  findByToken make as User class static function, so any instance can use it
  */
UserSchema.statics.findByToken = function (token) {
  var User = this; /* because this is static method, this points to Model itself */
  var decoded;

  try {
    /* because .verify() throw an error when something goes wrong
      every error catch inside catch-clause
    */
    decoded = jwt.verify(token, process.env.JWT_SECRET);

  } catch (e) {
    // return new Promise((resolve, reject) => {
    //   reject();
    // });
    /* if there's some error reject is fired and in server catch block is executed */
    return Promise.reject();
  }

  /* return Promise to chaining with .then in Controller */
  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  var User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject(); /* .catch block is exe */
    }

    return new Promise((resolve, reject) => { /* should return Promise to chaining Promise */
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          reject();
        }
        if (result) {
          resolve(user);
        }
        else {
          reject();
        }
      });
    });
  }); /* chaining Promise by return Promise */
};

/*
  Mongoose middleware, in this case everytime before @save function is executed
  pre middleware is executed. In this case before save user password in db, hash it first.
*/
UserSchema.pre('save', function (next) {
  var user = this;
  var password = user.password;
  /* before going hashing process, should check whether password was modiefied
    There are some cases when password is not updated. (updated user info other than password or when user is new)
    In that case, this middleware must not execute.
  */
  if (user.isModified('password')) {
    /* if password is modified program should hash it */
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {

        }
        user.password = hash; /* override hashed password with plain password */
        next();
      })
    })
  }
  else {
    /* if not modified just pass */
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};
