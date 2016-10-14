var express = require('express'); //Require express for middleware use
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http); //IO is the server

var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

//BASICS
app.use(express.static(__dirname + "/served")); //Serve static files

app.get('/', function(req, res){
  res.sendFile('./title.html');
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
  
})

// MONGODB
var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  insertDocuments(db, function() {
    updateDocument(db, function() {
        db.close();
    });
  });
});

var insertDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

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
