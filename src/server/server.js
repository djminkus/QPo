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

http.listen(8080, function(){
  console.log('listening on *:8080');
});

//HANDLE USER LOGIN:
app.use(bodyParser.json())       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()) // to support URL-encoded bodies

mongoose.connect(url)
var db = mongoose.connection;
var User = (function(){ //get reference to the mongoose model: 'User'
  var userSchema = mongoose.Schema({
    _id: String,
    level: Number,
    rank: Number,
    exp: Number,
    type: String,
    campaignProgress: {
      easy: Array,
      medium: Array,
      hard: Array
    }
  })
  return mongoose.model('User', userSchema)
})()
app.post('/menu', function(req, res){
  var username = req.param('username')
  console.log('username "'+username+'" parsed from form')

  //check the database for a user with that name:
  db.on('error', console.error);
  db.once('open', function() {
    User.findOne({_id: username}, function(err, user){
      if (err) {console.log("The user search caused an error")}
      if (user === null) {
        console.log("No user by name %s found--creating new user", username)
        var newUser = new User({_id: username, level:0, rank:0, exp:0, type: 'human',
          campaignProgress: {easy:[false,false,false], medium:[false,false,false], hard:[false,false,false]}
        })
        //Add the new user to the database
        newUser.save(function (err, newUser) {
          if (err) return console.error(err);
          console.log("New user %s saved to database", username)
        })
      } else {
        console.log("User %s found.", username)
        //TODO: Attach the user's details to the response
      }
    })
    db.close()
  })

  db.once('close', function(){console.log("database closed.")})
  res.sendFile('./menu.html', {root: __dirname+"/served"})
});
