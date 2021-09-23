var express = require('express') //Require express for middleware use
const app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http) //IO is the server

var bodyParser = require('body-parser')

var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var mongoose = require('mongoose')
mongoose.set('debug', true)

var url = 'mongodb://localhost:27017/test'

//BASICS
app.use(express.static(__dirname + "/served")) //Serve static files

app.get('/', function(req, res){
  res.sendFile('./index.html');
});

io.on('connection', function(socket){
  // socket.on('chat message', function(msg){
    // io.emit('chat message', msg);
  // });
  console.log("A user connected: ", socket.id)
});

http.listen(8080, function(){console.log('listening on *:8080');});

//HANDLE USER LOGIN:
app.use(bodyParser.json({limit: '300mb', extended:true}))       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ limit: '300mb', extended: true, parameterLimit: 50000000 })) // to support URL-encoded bodies

mongoose.connect(url)
var db = mongoose.connection
db.on('error', console.error)
var User, Neural
db.once('open', function() { // define Schemas and create models
  var userSchema = mongoose.Schema({
    username: String,
    level: Number,
    onePoRank: Number,
    twoPoRank: Number,
    type: String,
    tutDone: Boolean,
    elo: Number
  })

  // userSchema.statics.findOne = function(id, callback){
  //   return this.findOne({ _id: new RegExp(id, 'i') }, callback);
  // }

  User = mongoose.model('User', userSchema);

  var neuralSchema = mongoose.Schema({
    name: String,
    age: Number,
    //opts: Object,
    value_net: Object,
    experience: Array
  })

  Neural = mongoose.model('Neural', neuralSchema);

  var abstractSchema = mongoose.Schema({
    str: String,
    num: Number,
    obj: Object,
    arr: Array,
    bool: Boolean
  })

  Abstract = mongoose.model('Abstract', abstractSchema);
  // db.close()
})

app.post('/menu', function(req, res){ // Save new user or load existing one, and send that data back to the client.
  var username = req.param('username')
  console.log('username "'+username+'" parsed from form')

  //check the database for a user with that name:
  User.findOne({username: username}, function(err, user){
    if (err) {console.log("The user search caused an error")}
    if (user === null) { //create new user
      console.log("No user by name %s found--creating new user", username)
      var newUser = new User({username: username, level:0, onePoRank:0, twoPoRank: 0, type: 'human'})
      newUser.save(function (err, newUser) { //Add the new user to the database
        if (err) return console.error(err);
        console.log("New user %s saved to database", username)
        res.json(newUser)
      })
    }
    else { //User was found in the database
      console.log("User %s found.", username)
      res.json(user)
    }
  })

  db.once('close', function(){console.log("database closed.")})
  // res.sendFile('./menu.html', {root: __dirname+"/served"})
});

app.post('/user', function(req, res){ // Update the user in the database:
  var what = req.param('what')
  var username = req.param('user').username
  // var username = req.param('username')
  // console.log('username "'+username+'" parsed from form')

  User.findOne({username: username}, function(err, user){
    if (err) {console.log("The user search caused an error")}
    if (user === null) { console.log("No user by name %s found. That was unexpected.", username) }
    else {
      console.log("User %s found. Updating.", username)
      user[what] = req.param('user')[what]
      user.save(function(err) {
        if (err) throw err
        console.log('User successfully updated!')
      });
    }
  })

  res.json({'a':0}) //just to prevent an empty response error
});

app.post('/neuralSend', function(req, res){ // Client is sending. Update the neural in the database:
  var name = req.param('name');
  //var nn = req.param('nn')
  var age = req.param('age');
  var value_net = req.param('value_net');
  var experience = req.param('experience');

  Neural.findOne({name: name}, function(err, neural){
    if (err) {console.log("The neural search caused an error")}
    if (neural === null) { //no match found, create new entry in database
      console.log("No neural by name %s found. Creating new one.", name)
      var newNeural = new Neural({name: name, value_net: value_net})
      newNeural.save(function (err, newNeural) { //Add the new user to the database
        if (err) return console.error(err);
        console.log("New neural %s saved to database", name)
        // res.json(newUser)
      })
    }
    else { // Match found, update the entry
      console.log("Neural %s found. Updating.", name)
      neural['name'] = req.param('name')
      // neural[nn] = req.param('nn')
      neural['value_net'] = req.param('value_net');
      console.log('updated value net, updating experience...');
      neural['experience'] = req.param('experience');
      neural['age'] = req.param('age');

      neural.save(function(err) {
        if (err) throw err
        console.log('Neural successfully updated!')
      });
    }
  })

  res.json({'a':0}) //just to prevent an empty response error
});

app.post('/neuralGet', function(req, res){ // Client wants to get a neural net from the database:
  var name = req.param('name')
  // console.log('neural name "'+name+'" parsed from request')

  //check the database for a user with that name:
  Neural.findOne({name: name}, function(err, neural){
    if (err) {console.log("The neural search caused an error")}
    if (neural === null) { console.log("No neural by name %s found", name) }
    else { //Neural was found in the database. Send it.
      console.log("Neural %s found. Sending to client.", name)
      res.json(neural)
    }
  })

  db.once('close', function(){console.log("database closed.")})
})

app.post('/email', function(req,res){
  var email = 'djminkus@gmail.com';
  res.json({'email':email});
})
