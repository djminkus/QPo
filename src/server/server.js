var express = require('express'); //Require express for middleware use
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http); //IO is the server

var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var mongoose = require('mongoose');

//BASICS
app.use(express.static(__dirname + "/served")); //Serve static files

app.get('/', function(req, res){
  res.sendFile('./index.html');
});

io.on('connection', function(socket){
  // socket.on('chat message', function(msg){
    // io.emit('chat message', msg);
  // });
  console.log("A user connected: ", socket.id);
});

http.listen(8080, function(){
  console.log('listening on *:8080');
});

//HANDLE USER LOGIN:
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies

app.post('/menu',function(req, res){
  var username = req.param('username');
  console.log('username "'+username+'" parsed from form');
  //check the database for a user with that name:
  MongoClient.connect(url, function(err,db) {
    assert.equal(null,err);
    console.log("Connected correctly to Mongo");
    var collection = db.collection('documents');

    //Check for an existing user with id username
      // If that username exists, send its data back to the client to be rendered.
      // Else, create a new user by that name.

    var user = collection.findOne({_id: username})
    // console.log(user)
    if(user){ //send user profile back to client
      console.log(user);
    } else {
      makeUser(db, username, function(){
        console.log("user " + username + " made")
        db.close()
      })
    }

    // getUser(db, username, function(){
    //   //TODO: grab the user's info and return it to the client for rendering
    //   console.log("user " + username + " gotten")
    //   db.close()
    // })

  })
  res.sendFile('./menu.html', {root: __dirname+"/served"})
})

var makeUser = function(db, username, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insert({"username" : username}, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted user" + username + "into the collection");
    callback(result);
  });
}

var getUser = function(db, username, callback){
  var collection = db.collection('documents');
  // Find some documents
  collection.find({'username' : username}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

// MONGODB
var url = 'mongodb://localhost:27017/test';
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   console.log("Connected correctly to server.");
//   insertDocuments(db, function() {
//     updateDocument(db, function() {
//         db.close();
//     });
//   });
// });



// var insertDocuments = function(db, callback) {
//   // Get the documents collection
//   var collection = db.collection('documents');
//   // Insert some documents
//   collection.insertMany([
//     {a : 1}, {a : 2}, {a : 3}
//   ], function(err, result) {
//     assert.equal(err, null);
//     assert.equal(3, result.result.n);
//     assert.equal(3, result.ops.length);
//     console.log("Inserted 3 documents into the collection");
//     callback(result);
//   });
// }



// var findDocuments = function(db, callback) {
//   // Get the documents collection
//   var collection = db.collection('documents');
//   // Find some documents
//   collection.find({}).toArray(function(err, docs) {
//     assert.equal(err, null);
//     console.log("Found the following records");
//     console.log(docs)
//     callback(docs);
//   });
// }

var updateDocument = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a : 2 }
    , { $set: { b : 1 } }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Updated the document with the field a equal to 2");
    callback(result);
  });
}
