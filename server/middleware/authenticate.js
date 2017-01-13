var {User} = require('../models/user');

var authenticate = (req, res, next) => {
  /* middleware take 3 parameters including @next
    the actual router is never gonna call until @next is fired
  */
  var token = req.header('x-auth'); /* get auth token from header */

  User.findByToken(token).then((user) => {
    if (!user) {
      /* this case happen when token is valid but for some reason there's no matching user */
      return Promise.reject(); /* catch block is going to be fired */
    }

    // res.send(user);
    req.user = user; /* now we can use @user data in the router */
    req.token = token;
    next(); /* go to actual router */
  }).catch((e) => {
    res.status(401).send();
  });
};

module.exports = {authenticate};
