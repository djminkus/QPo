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
var db = mongoose.connection
db.on('error', console.error)
var User
db.once('open', function() {
  var userSchema = mongoose.Schema({
    username: String,
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
  // userSchema.statics.findOne = function(id, callback){
  //   return this.findOne({ _id: new RegExp(id, 'i') }, callback);
  // }
  User = mongoose.model('User', userSchema)

  // db.close()
})

app.post('/menu', function(req, res){ // Save new user or load existing one, and send that data back to the client.
  // console.log(req)
  var username = req.param('username')
  console.log('username "'+username+'" parsed from form')

  //check the database for a user with that name:
  User.findOne({username: username}, function(err, user){
    if (err) {console.log("The user search caused an error")}
    if (user === null) {
      console.log("No user by name %s found--creating new user", username)
      var newUser = new User({username: username, level:0, rank:0, exp:0, type: 'human',
        campaignProgress: {easy:[false,false,false], medium:[false,false,false], hard:[false,false,false]}
      })
      //Add the new user to the database
      newUser.save(function (err, newUser) {
        if (err) return console.error(err);
        console.log("New user %s saved to database", username)
        // console.log("newUser:")
        // console.log(newUser)
        res.json(newUser)
      })

    } else {
      console.log("User %s found.", username)
      // console.log(user)
      // console.dir(user)
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
    if (user === null) {
      console.log("No user by name %s found. That was unexpected.", username)
    } else {
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
