const MongoClient = require('mongodb').MongoClient;

/*
  mongodb protocol: mongodb://

  err: error
  db: actual db object, with this we can do insert, delete and so on.
*/
MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
  if (err) {
    /* return statement just preventing program from exeucte next line of code */
    return console.log('Unable to connect to MongoDB server.');
  }
  console.log('Connected to MongoDB server');

  db.collection('Todos').insertOne({
    text: 'Something to do',
    completed: false
  }, (err, result) => {
    if (err) {
      return console.log('Unable to insert todo', err);
    }

    console.log(result.ops[0]._id.getTimestamp());
  });
  // db.collection('Users').insertOne({
  //   name: 'JooHyung',
  //   age: 21,
  //   location: 'Kor'
  // }, (err, result) => {
  //   if (err) {
  //     return console.log(err);
  //   }
  //
  //   console.log(JSON.stringify(result.ops, undefined, 2));
  // });

  db.close();
});
