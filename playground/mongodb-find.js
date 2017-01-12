const {MongoClient, ObjectID} = require('mongodb');

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

  /*
    find return mongodb cursor. This pointer is not the document itself,
    but the pointers pointing to its document.
    And cursor provides tons of method, one of them will return the document

    toArray() makes documents to array and return Promise
  */
  // db.collection('Todos').find({
  //   _id: ObjectID("5876849f0eb91d6b90322392")
  // }).toArray().then((docs) => {
  //   console.log('Todos');
  //   console.log(JSON.stringify(docs, undefined, 2));
  // }, (err) => {
  //   console.log('Unable to fetch todos', err);
  // });
  db.collection('Todos').find().count().then((count) => {
    console.log(`Todos count: ${count}`);
  }, (err) => {
    console.log('Unable to fetch todos', err);
  });


  //db.close();
});
