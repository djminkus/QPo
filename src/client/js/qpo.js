/** Q-PO : A lean action-strategy game designed for competitive and collaborative online multiplayer.

Q-Po is a competitive game that combines elements of real-time strategy games, top-down shooters,
  and turn-based strategy games, resulting in fast-paced, competitive gameplay that's easy to learn,
  but hard to master.

How to get familiar with the code:
  0. Open index.html in your browser window.
  1. Understand raphael.js basics.
  2. Look at qpo.setup() first.
  3. See menu.js

alpha must contain:
  [ x ]  better spawn system
  [  ]  Functional servers {test for reliability, have someone try to crack or flood them}
  [  ]  PVP ranking system {test for rewardingness and exploitability}
beta must feature:
  [ x ] Cool music
  [  ] Sound effects
  [  ] Even better gameplay (using feedback from alpha)
  [  ] More reliable servers (via code reviews/consults)
  [  ] A more rewarding ranking system (using feedback from alpha)

LONG-TERM TODO:
  See Issues/Feature Requests on Github:
    https://github.com/djminkus/QPO/issues
  [   ] Improve neural networks AI
  [   ] User login/profile system
  [ x ] Implement Ranking System
  [   ] Open beta and advertise
  [   ] Improve game based on beta feedback
  [   ] Release 1.0
  --- MAYBES
  [   ] Throw $$ tourney
  [   ] Implement Subscription System

Contents of this code: (updated June 2, 2015)
  VAR DECLARATIONS
  UNIT CONSTRUCTORS
  GUI ELEMENTS
  INCREMENT FUNCTIONS
    updateBlueAU() -- updates orange highlights on board and control panel
      (keyboard presses queue moves for the Active Unit)
    newTurn() -- starts a new turn, called every 3 seconds
    detectCollisions() -- detects collisions between game objects, called every 17 ms
  KEYDOWN HANDLER : detects and responds to keyboard input (arrows, spacebar, enter)
*/

qpo = new Object()

build_id = 'bahai'
console.log("RESET " + Date() + '. Build ID ' + build_id)
const WIDTH = 600
const HEIGHT = 750
var c = new Raphael("raphContainer", WIDTH, HEIGHT) //create the Raphael canvas

qpo = {
  "songURL": "./timekeeper-intro.mp3",

  // WEBSOCKET THINGS (NOT SOCKET.IO):
  // "socket" : new WebSocket('ws://q-po-5150.herokuapp.com/socket'), //this url will change
  "socketCodes" : {"bomb":0,"shoot":1,"moveLeft":2,"moveUp":3,"moveRight":4,"moveDown":5,"stay":6},

  // "socket" : io(),
  "lastMoveTime" : new Date().getTime(),
  "moveName" : null,
  "timeSinceLastMove" : null, //time since keyboard stroke was most recently processed as a move
  "cpIconsGens" : [85, 475, 20, 10, 40] //centers and radius -- for (leftmost) controlPanel icons
}

qpo.menuMusic = function(){
  if (!(qpo.menuSong)){ qpo.menuSong = new Audio(qpo.songURL); } //load song if it hasn't been loaded yet
  if (qpo.activeGame){ //stop game song and reset it
    qpo.activeGame.song.pause();
    qpo.activeGame.song.currentTime=0;
  }
  qpo.menuSong.currentTime = 0;
  //qpo.menuSong.volume = qpo.user.musicVol
  //qpo.menuSong.play();
  // if (qpo.playMusic) { // loop the menuSong every 1 minute and 48 seconds
  //   qpo.menuSongInterval = setInterval(function(){
  //     qpo.menuSong.currentTime = 0;
  //     qpo.menuSong.play();
      // console.log("playing menu song again.");
    // },113000);
  // }
}

qpo.setup = function(){ // set up global vars and stuff
  // SOCKET STUFF:
  // this.socket.onerror = function(error) {
  //    console.log('WebSocket Error: ' + error);
  // };
  // this.socket.onmessage = function(event) {
  //   var message = event.data;
  //   // console.log("ws says:" + message);
  // };

  // qpo.socketInit = (function() {
  //   var socket = new phoenix.Socket("ws://q-po-5150.herokuapp.com/socket", {params: {token: window.userToken}})
  //
  //   socket.connect()
  //   this.channel = socket.channel("game:lobby", {})
  //
  //   this.channel.join()
  //     .receive("ok", function(resp){ console.log("Joined successfully", resp) })
  //     .receive("error", function(resp){ console.log("Unable to join", resp) })
  // })(),

  // TOP-LEVEL SETTINGS:
  qpo.timeScale = 2/3; // Bigger means longer turns/slower gameplay; 1 is original 3-seconds-per-turn
  qpo.playMusic = true;
  qpo.deflashLength = 400
  qpo.flashLength = qpo.timeScale*3000-qpo.deflashLength
  qpo.waitTime = 10; // minimum ms between move submission
  qpo.unitStroke = 3;
  qpo.bombStroke = 3;
  qpo.iconStroke = 2;
  qpo.pinchAmount = 20; //pixels for pinch animaton
  qpo.SHOT_LENGTH = 20; //length of shot when unit.mtr = 50
  qpo.SHOT_WIDTH = 4; //width of shot when unit.mtr = 50
  qpo.SHOT_SPEED = 4; //in boxes per turn
  qpo.MAX_BIT_SIZE = 23;

  // (DNA): STATIC DICTS N ARRAYS
  qpo.spawnTimers = [null, 1,2,2,2,3,3,3,4]; //index is po
  qpo.keyCodes = { //pair keycodes with move strings
    81:"bomb", //q
    32:'shoot', //spacebar
    69:"shoot", //e
    65:"moveLeft", //a
    87:"moveUp", //w
    68:"moveRight", //d
    83:"moveDown", //s
    88:"stay", //x
    66:'bomb', //b
  }
  qpo.COLOR_DICT = { //define colors using hex
    "blue": "#0055ff",
    "red": "#e00000",
    "orange": "#ffbb66",
    "green": "#00bb55", // shot color
    "purple":"#bb00bb", // bomb/plasma color
    'light blue':'#5588ff', // antimatter color

    "background": "#000000", //black is 0
    "grey": "#bbbbbb",
    "foreground": "#ffffff" //white is f
  };
  qpo.colors = [qpo.COLOR_DICT.blue, qpo.COLOR_DICT.red, qpo.COLOR_DICT.orange,
    qpo.COLOR_DICT.green, qpo.COLOR_DICT.purple, qpo.COLOR_DICT.foreground
  ]
  qpo.moves = ["moveUp","moveDown","moveLeft","moveRight","shoot","bomb","stay"];
  qpo.dirMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };
  qpo.userExpLevels = new Array();
  for(var i=0; i<100; i++){qpo.userExpLevels[i] = 100 * Math.sqrt(i)}
  qpo.missions = new Array();

  // NEURAL STUFF:
  qpo.netsChanged = false;
  qpo.trainingMode = false;
  qpo.faster = 0.35; // how fast to go in training and testing modes
  (qpo.trainingMode) ? (qpo.timeScale=qpo.faster) : (false) ;
  qpo.trainingCounter = 0;
  qpo.batchCounter = 0;
  qpo.gamesToTrain = 30; // games per batch
  qpo.batchesToTrain = 3; // batches to train
  qpo.trainingData = new Array(); // store sessions (win/loss data)
  qpo.aiTypes = ["neural", "rigid" ,"random", 'null'];
  qpo.aiType = qpo.aiTypes[0]; // controls source of red's moves in singlePlayer
  qpo.trainerOpponent = qpo.aiTypes[2]; // controls source of blue's moves in training mode
  qpo.retrain = function(){ // get ready to train another batch.
    qpo.trainingCounter = 0;
    qpo.trainingMode = true;
  };
  // NEURAL TESTING STUFF:
  qpo.testingMode = false;
  (qpo.testingMode) ? (qpo.timeScale=qpo.faster) : (false) ;
  qpo.testingCounter = 0; // how many games have been tested.
  // batchCounter is set to 0 above in training part
  qpo.gamesToTest = 5; // games per batch
  qpo.batchesToTest = 10; // batches to test
  qpo.testingData = new Array(); // store sessions (win/loss data)
  qpo.aiTypes = ["neural", "rigid" ,"random", 'null'];
  qpo.aiType = qpo.aiTypes[0]; // controls source of red's moves in singlePlayer
  qpo.trainerOpponent = qpo.aiTypes[2]; // controls source of blue's moves in training mode
  qpo.retest = function(){ // get ready to test another batch.
    qpo.testingCounter = 0;
    qpo.testingMode = true;
    console.log("Ali's epsilon: " +qpo.ali.nn.epsilon)
    console.log("Ali's age: " + qpo.ali.nn.age)
    console.log("Ali remembers "+ qpo.ali.nn.experience.length + " experiences")
    // qpo.activeGame = new qpo.Game({
    //   'q':8,
    //   'po':4,
    //   'type':'testing',
    //   'ppt':2,
    //   'bluePlayers': [qpo.aliP, qpo.bryanP],
    //   'redPlayers':[new qpo.Player(null, 'Rigid 1', qpo.testOpponent, 'red', 0),
    //                 new qpo.Player(null, 'Rigid 2', qpo.testOpponent, 'red', 1)]
    // });
    qpo.activeGame = new qpo.Game({
      'q':6,
      'po':2,
      'type':'testing',
      'ppt':1,
      'bluePlayers': [qpo.aliP],
      'redPlayers':[new qpo.Player(null, qpo.testOpponentName, qpo.testOpponent, 'red', 0)]
    })
    qpo.activeSession = new session('test')
    // 1/1/21 : Moving score totaling to batch.js
    // var blueTot = 0
    // var redTot = 0
    // gar = qpo.testingData[qpo.batchCounter-1].games // games Array
    // for (var i=0; i<gar.length; i++){
    //   redTot += gar[i].redScore
    //   blueTot += gar[i].blueScore;
    // }
    // console.log('Total red score for that batch: ' + redTot)
    // console.log('Total blue score for that batch: ' + blueTot)
  };
  // qpo.multiBatchData = new Array(); // Store data about multiple batches here.

  //MISC (ETC + DYNAMIC/UTILITY ARRAYS)
  qpo.gui = c.set(); // Should contain only elements relevant to the current screen.
  qpo.shots = [];
  qpo.bombs = [];
  qpo.blueActiveUnit = 0;
  qpo.board = {};
  playerColor = "blue"; // for now
  opponentColor = "red";
  qpo.playerTeam = "blue"
  qpo.otherTeam = "red"
  qpo.glows = c.set(); //separate from GUI for opacity reasons
  qpo.capitalize = function(str){
    console.log(str)
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  (function(){ //SET UP DIMENSIONS AND COORDINATES:
    qpo.guiCoords = { // cp height, gameBoard wall locations, gamePanel vs debugPanel
      "cp" : {
        "height" : 100,
      },
      "gameBoard" : {
        "lw" : 25,
        "topWall" : 75,
        "bottomWall" : 75+350
        // 'rightWall' : 25+350
      },
      "gamePanel" : {
        "width" : 600,
        "height" : 600
      },
      "turnTimer" : {
        "x" : 450,
        "y" : 250,
        "r" : 50
      }
    };
    qpo.guiDimens = { //width of panels, square size, # columns, # rows
      "gpWidth" : 600, //game panel width
      "gpHeight" : 600, //game panel height
      "tpWidth" : 300, //tut panel width
      "tpHeight": 200, //tut panel height
      "squareSize" : 50,
      "columns" : 7,
      "rows" : 7,
      "CROSS_SIZE": 7
    }
    qpo.guiCoords.gameBoard.width = qpo.guiDimens.columns * qpo.guiDimens.squareSize,
    qpo.guiCoords.gameBoard.height = qpo.guiDimens.rows * qpo.guiDimens.squareSize;
  })();

  qpo.bombSize = 2*qpo.guiDimens.squareSize;

  //MAKE MUSIC (or don't)
  (qpo.playMusic) ? (qpo.menuMusic()) : (false);

  //DEFINE SOME NICE FUNCTIONS...
  qpo.add = function(a,b){ return (a+b); }
  qpo.findSlot = function(array){ //find the first empty slot in an array
    var slot = 0;
    while(slot < array.length){
      if(!array[slot]){ break; }
      slot += 1;
    }
    return slot;
  }
  qpo.rotatePath = function(path, dir){ //pass in a Raphael "path" object and return a rotated version of it
    //Used for arrows that are drawn pointing up.
    var pathStr = path.attr('path');
    var matrix = Raphael.matrix();
    switch(dir){ //make the right matrix
      case 'left':
        matrix.rotate(90); //90 deg cw, 3 times.
      case 'down':
        matrix.rotate(90); //again (no break from switch)
      case 'right':
        matrix.rotate(90); //again
      case 'up':
        break;
      default:
        console.log('this was unexpected');
    }
    var transString = matrix.toTransformString();
    var old = pathStr;
    pathStr = Raphael.transformPath(pathStr, transString);
    path.attr({'path':pathStr});
  }
  qpo.blink = function(raph, time){ //make something's opacity go to 0, then come back to 1
    raph.show();
    var anim1 = Raphael.animation({'opacity':0}, (time || 1000), '<', function(){raph.animate(anim2)});
    var anim2 = Raphael.animation({'opacity':1}, (time || 1000), '>', function(){raph.animate(anim1)});
    raph.animate(anim1);
  }
  qpo.fadeOut = function(set, extra, time){ //fade out a Raph set and do an extra function after it fades
    var set = set
    var extra = extra || function(){}
    var TIME = time || 300 //ms
    set.attr({'opacity':1}) //
    var anim = Raphael.animation({'opacity':0}, TIME)
    set.animate(anim)
    setTimeout(function(){ //after delay, remove set and do extra()
      set.remove();
      extra();
    }.bind(set), TIME);
  };
  qpo.fadeIn = function(set, time, extra, excluded){ //fade in a Raph set and do something after it's been faded in
    var TIME = time || 500; //ms
    var func = extra || function(){};
    if(excluded){var check=set.exclude(excluded); console.log(excluded, check)}
    set.attr({'opacity':0});
    set.show();
    var anim = Raphael.animation({'opacity':1}, TIME);
    set.animate(anim);
    setTimeout(func, TIME);
  };
  qpo.fadeOutGlow = function(glow, extra, time){
    var TIME = time || 300; //ms
    var func = extra || function(){;};
    var set = glow;
    var anim = Raphael.animation({'opacity':0}, TIME);
    set.animate(anim);
    setTimeout(function(){ //after delay, remove set and do extra()
      set.remove();
      func();
    }.bind(set), TIME);
  }
  qpo.fadeInGlow = function(glow, extra, time){
    var TIME = time || 500; //ms
    var func = extra || function(){};
    var opacity = glow.items[0][0].attr('opacity');
    glow.attr({'opacity':0});
    glow.animate({'opacity':opacity}, TIME);
    setTimeout(func, TIME);
  }
  qpo.cross = function(x,y){ //draw a little crosshair/plus-symbol thing centered on x,y
    var set = c.set();
    var hcs = qpo.guiDimens.CROSS_SIZE/2 ; //half cross size
    set.push(c.path('M' + (x-hcs) + ',' + y + 'L' + (x+hcs) + "," + y)); //vert section
    set.push(c.path('M' + x + ',' + (y-hcs) + 'L' + x + "," + (y+hcs))); //vert section
    set.attr({"stroke-width":2, 'stroke':qpo.COLOR_DICT['foreground']});
    return set;
  }
  qpo.arrow = function(x,y,color,dir){ //draw an arrow (centered at x,y) pointing in direction dir
    //x,y are centers, not corners
    //dir is direction
    var d = { //dimensions
      'l': 10, //length (half of arrow's body)
      't': 8, //tips
      's': 1, //scaling -- previously tied to qpo.activeGame.scaling, removed to fix menu icons bug
      'q' : .8 //ratio between tip's x and y dimens
    }
    //Make the arrow
    var pathStr = 'm-' + d.t*d.q + ',0' //+ d.t/Math.sqrt(2)
      + 'l'+d.t*d.q+',-'+d.t
      + 'l'+d.t*d.q+','+d.t;
    var atts = {'stroke':color,'stroke-width': 3, 'stroke-linecap':'round'};
    var arrow = c.path(pathStr).attr(atts); //make the Raph el
    // console.log('initial path: ' + pathStr)

    //Scale it up:
    pathStr = Raphael.transformPath(pathStr, 's'+d.s); //scale the arrow's path string
    // console.log('path after scaling: ' + pathStr)

    arrow.attr({'path':pathStr}); //remake the arrow with the new scaled path

    //rotate it:
    qpo.rotatePath(arrow, dir);
    pathStr = arrow.attr('path'); //remake the arrow with the new translated path

    // console.log('path after rotating: ' + pathStr);

    pathStr = Raphael.transformPath(pathStr, 't'+x+','+y);
    arrow.attr({'path':pathStr}); //remake the arrow with the new translated path
    // console.log('path after translating: ' + pathStr);

    return arrow;
  }
  qpo.pinch = function(el, stroke){ //takes in raph el, returns a set of orange lines pinching in on it
    var strk = stroke || qpo.unitStroke;
    var time = 50;
    var box = el.getBBox();
    var set = c.set();
    var top = c.path('M'+box.x+','+box.y+' L'+box.x2+','+box.y).data('which','top');
    var right = c.path('M'+box.x2+','+box.y+' L'+box.x2+','+box.y2).data('which','right');
    var bottom = c.path('M'+box.x+','+box.y2+' L'+box.x2+','+box.y2).data('which','bottom');
    var left = c.path('M'+box.x+','+box.y+' L'+box.x+','+box.y2).data('which','left');
    set.push(top, right, bottom, left);
    set.attr({'stroke':qpo.COLOR_DICT["orange"], 'stroke-width':strk});
    set.forEach(function(each){ // each is Raph element
      var box = each.getBBox();
      switch(each.data('which')){
        case 'top': {
          each.animate({
            "0%": {'transform':'t'+'0,-'+qpo.pinchAmount},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'right': {
          each.animate({
            "0%": {'transform':'t'+qpo.pinchAmount+',0'},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'bottom': {
          each.animate({
            "0%": {'transform':'t'+'0,'+qpo.pinchAmount},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
        case 'left': {
          each.animate({
            "0%": {'transform':'t-'+qpo.pinchAmount+',0'},
            "100%": {'transform':'', 'opacity':0.3}
          }, time)
          break;
        }
      }
    })
    return set;
  }
  qpo.ignore = function(time){
    qpo.ignoreInput = true
    setTimeout(function(){qpo.ignoreInput=false},time)
  }
  qpo.shrinkIn = function(raphs, time){
    var TIME = time || 200
    raphs.scale(3)
    raphs.animate({'transform':'s1'}, TIME, '<')
  }
  qpo.shrinkOut = function(raphs, time){
    var TIME = time || 200
    raphs.scale(3)
    raphs.animate({'transform':'s1'}, TIME, '<')
  }
  qpo.centeredSquare = function(paper, cx, cy, s, atts){
    return paper.rect(cx-s/2, cy-s/2, s,s).attr(atts)
  }
  qpo.triangle=function(cx, cy, s, strokeWidth, pointUp, color){
    // cx, cy are center-x, center-y
    // s is side length (?)
    if (color===undefined){color = qpo.COLOR_DICT['foreground']}
    var DY = .289 * s
    var Z = .577 * s
    var V1X = cx - s/2
    var V1Y = cy - DY
    var V2X = cx + s/2
    var V2Y = V1Y
    var V3X = cx
    var V3Y = cy + Z
    var tri = c.path("M"+V1X+","+V1Y+"L"+V2X+","+V2Y+"L"+V3X+","+V3Y+"z").attr({'stroke':color, 'stroke-width':strokeWidth})
    if (pointUp) { tri.attr({'transform':'r180'})}
    return tri
  }

  //TITLE SCREEN STUFF: (previously in menus.js)
  qpo.font = 'Orbitron'
  qpo.fontString = " '" + qpo.font + "',sans-serif"
  switch(qpo.font){ //for easy font switching
    case 'Righteous':{
      WebFontConfig = { google: { families: [ 'Righteous::latin' ] } };
      break;
    }
    case 'Poppins':{
      WebFontConfig = { google: { families: [ 'Poppins:400,300,500,600,700:latin' ] } };
      break;
    }
    case 'Oxygen':{
      WebFontConfig = { google: { families: [ 'Oxygen:300,400,700:latin' ] } };
      break;
    }
    case 'Varela':{
      WebFontConfig = { google: { families: [ 'Varela+Round::latin' ] } };
      break;
    }
    case 'Questrial':{
      WebFontConfig = { google: { families: [ 'Questrial::latin' ] } };
      break;
    }
    case 'Orbitron':{
      WebFontConfig = { google: { families: [ 'Orbitron:400,500,700,900:latin' ] } };
      break;
    }
    case 'Open Sans':{
      WebFontConfig = { google: { families: [ 'Open+Sans:300,400:latin' ] } };
      break;
    }
  }
  (function() { //inject the Google webfont script
    var wf = document.createElement('script');
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
  })();
  qpo.activeMenuOptAtts = {'fill':qpo.COLOR_DICT['orange'], 'opacity':1}
  qpo.inactiveMenuOptAtts = {'fill':'grey', 'opacity':1}
  qpo.inactiveCampaignMenuOptAtts = {'fill':'white', 'opacity':1}

  c.customAttributes.qpoText = function(size, fill){ //style text white with Open Sans family and "size" font-size.
    return {
      "font-size": size,
      "fill": (fill || "white"),
      "font-family": qpo.fontString
      // "font-family":"'Poppins',sans-serif"
      // "font-family":"'Oxygen',sans-serif"
      // "font-family":"'Varela Round',sans-serif"
      // "font-family":"'Questrial',sans-serif"
      // "font-family":"'Orbitron',sans-serif"
      // "font-family":"'Open Sans',sans-serif"
      // "font-family":"sans-serif"
    };
  }
  qpo.xtext = function(x, y, str, size, color){ //make a Raphael text el with its left end at x and centered vertically on y
    var size = size || 10;
    var color = color || qpo.COLOR_DICT['foreground'];
    var el = c.text(x,y,str).attr({qpoText:[size, color]});
    el.attr({'x':el.getBBox().x2});
    // el.attr({'x':el.getBBox().x2, 'y':el.getBBox().y2}); //for y-adjusted text
    return el;
  }

  qpo.zerosGrid = function(cols, rows){
    var arr = new Array()
    for (var i=0; i<cols; i++){
      arr.push(new Array())
      for (var j=0; j<rows; j++){
        arr[i][j]=0
      }
    }
    return arr
  }
  qpo.sumGrids = function(arr1, arr2){
    //assumes two 2-D arrays (nested arrays) with same dimensions as parameters.
    var result = new Array()
    for (var i=0; i<arr1.length; i++){
      result[i] = new Array()
      for (var j=0; j<arr1[0].length; j++){
        result[i][j] = arr1[i][j] + arr2[i][j]
      }
    }
    return result
  }
  qpo.showGrid = function(grid){
    var gridContents = c.set()
    for (var i=0; i<qpo.board.cols; i++){
      for (var j=0; j<qpo.board.rows; j++) {
        gridContents.push(c.text(qpo.board.lw + qpo.guiDimens.squareSize*(.5+i), qpo.board.tw + qpo.guiDimens.squareSize*(.5+j), grid[i][j]).attr({qpoText:[20]}))
      }
    }
    debugger;
    gridContents.remove()
  }

}();

//FUNCTIONS THAT CREATE RAPH ELEMENTS
qpo.Board = function(cols, rows, x, y, m){ //Board class constructor
  this.all = c.set()

  this.mtr = m || qpo.guiDimens.squareSize //mtr for meter, or unit size (in pixels)--the length quantum of q-po.
  qpo.guiDimens.squareSize = this.mtr //make sure they agree

  this.rows = qpo.guiDimens.rows = rows
  this.cols = qpo.guiDimens.columns = cols

  this.width = qpo.guiCoords.gameBoard.width = cols * this.mtr
  this.height = qpo.guiCoords.gameBoard.height = rows * this.mtr

  this.lw = x || qpo.guiCoords.gameBoard.leftWall
  this.tw = y || qpo.guiCoords.gameBoard.topWall
  this.rw = this.lw + this.width
  this.bw = this.tw + this.height
  this.centerX = this.lw + this.width/2
  this.centerY = this.tw + this.height/2

  this.notify = function(str, color){
    var color = color || qpo.COLOR_DICT['foreground']
    var notification = c.text(this.centerX, this.centerY, str).attr({qpoText:[72, color]})
    qpo.gui.push(notification)
    var time = 2000
    notification.animate({'opacity':0}, 2000)
    setTimeout(function(){notification.remove()}.bind(this), 2000)
  }

  var vo = 20 //vertical offset (for zs)
  var ho = 20 //horizontal offset

  this.background = c.rect(this.lw-ho, this.tw-5, this.width+ho*2, this.height+10)
    .attr({'fill':qpo.COLOR_DICT['background'], 'stroke-width':0});
  this.all.push(this.background)

  this.surface = c.rect(this.lw, this.tw, this.width, this.height).attr({ //the white flash
    'fill':qpo.COLOR_DICT['foreground'],
    'stroke-width':0,
    'opacity':0
  });
  this.all.push(this.surface)
  if(qpo.mode == 'menu'){this.surface.attr({'transform':'t-1000,-1000'})}

  var x1 = 20 //curve x adjuster/anchor
  var x2 = 40 //curve x endpoint
  var y1 = 40 //curve y adjuster/anchor
  var y2 = 40 //curve y endpoint
  this.chargerHeight = this.height - 2*y2
  this.leftCharger = c.path('M'+(this.lw-x2)+','+(this.tw+y2)+'l0,'+this.chargerHeight)
  this.rightCharger = c.path('M'+(this.rw+x2)+','+(this.tw+y2)+'l0,'+this.chargerHeight)
  this.chargers = c.set(this.leftCharger, this.rightCharger).attr({'stroke': qpo.COLOR_DICT['foreground'], 'opacity':0})
  this.all.push(this.chargers)

  // this.tlc = c.path('M'+this.lw+','+this.tw+'s-'+x1+','+y1+',-'+x2+','+y2) //top left curve
  // this.blc = c.path('M'+this.lw+','+this.bw+'s-'+x1+',-'+y1+',-'+x2+',-'+y2) //bottom left curve
  // this.trc = c.path('M'+this.rw+','+this.tw+'s'+x1+','+y1+','+x2+','+y2) //top left curve
  // this.brc = c.path('M'+this.rw+','+this.bw+'s'+x1+',-'+y1+','+x2+',-'+y2) //bottom left curve
  this.tlc = c.path('M'+this.lw+','+this.tw+'l-'+x2+','+y2) //top left curve
  this.blc = c.path('M'+this.lw+','+this.bw+'l-'+x2+',-'+y2) //bottom left curve
  this.trc = c.path('M'+this.rw+','+this.tw+'l'+x2+','+y2) //top left curve
  this.brc = c.path('M'+this.rw+','+this.bw+'l'+x2+',-'+y2) //bottom left curve
  this.curves = c.set(this.tlc, this.blc, this.trc, this.brc).attr({'stroke':qpo.COLOR_DICT['foreground'], 'stroke-width':2})
  this.all.push(this.curves)

  // this.leftZ = c.path('M'+this.lw+','+this.tw+  'l-'+ho+','+vo+  'v'+(this.height-2*vo)+'l'+ho+','+vo+'z')
  // this.rightZ = c.path('M'+this.rw+','+this.tw+  'l'+ho+','+vo+  'v'+(this.height-2*vo)+'l-'+ho+','+vo+'z')
  // this.zs = c.set(this.leftZ, this.rightZ).attr({'stroke':qpo.COLOR_DICT['foreground'],
  //   'fill': qpo.COLOR_DICT['foreground'], 'opacity':0});
  // this.all.push(this.zs);

  // var leftWall = c.path('M'+this.lw+','+(this.tw-1) + 'Q'+this.lw1+','+this.vm+','+this.lw+','+(this.bw+1));
  // var rightWall = c.path('M'+this.rw+','+(this.tw-1) + 'Q'+this.rw1+','+this.vm+','+this.rw+','+(this.bw+1));
  this.leftWall = c.path('M'+this.lw+','+(this.tw-1) + 'V'+(this.bw+1))
  this.rightWall = c.path('M'+this.rw+','+(this.tw-1) + 'V'+(this.bw+1))
  this.sideWalls = c.set(this.leftWall, this.rightWall)
      .attr({'stroke-width':1, 'stroke':qpo.COLOR_DICT['foreground'], 'opacity':0.6})
      // .transform('t0,-1000');
  this.all.push(this.sideWalls)
  this.moveWalls = function(){
    var amt = 20;
    var easing = 'bounce';
    var lwAnim = Raphael.animation({
      '0%'  : {'transform' : ''},
      '50%' : {'transform' : 't-'+amt+',0'},
      '100%': {'transform' : ''}
    }, 3000*qpo.timeScale, easing) //left wall animation
    var rwAnim = Raphael.animation({
      '0%'  : {'transform' : ''},
      '50%' : {'transform' : 't'+amt+',0'},
      '100%': {'transform' : ''}
    }, 3000*qpo.timeScale, easing)
    this.leftWall.animate(lwAnim);
    this.rightWall.animate(rwAnim);
  }

  this.blueGoal = c.path('M'+this.lw+','+(this.tw-3) + 'H'+this.rw).attr({'stroke':qpo.COLOR_DICT['blue']})
  this.redGoal = c.path('M'+this.lw +','+(this.bw+3) + 'H'+this.rw).attr({'stroke':qpo.COLOR_DICT['red']})
  this.goalLines = c.set().push(this.blueGoal, this.redGoal).attr({'stroke-width':3, 'opacity':1})
  this.all.push(this.goalLines)
  // sideWalls.toFront();

  var blueGlow = this.blueGoal.glow({'color':qpo.COLOR_DICT['blue']})
  var redGlow = this.redGoal.glow({'color':qpo.COLOR_DICT['red']})
  qpo.glows = c.set(blueGlow, redGlow).hide() //the raphael glow sets

  this.outline = c.set(this.sideWalls, this.goalLines)

  var dotSize = 2
  this.dots = c.set()
  for (var i=1; i<cols; i++) { //create the grid dots
    for (var j=1; j<rows; j++){
      var xCoord = this.lw + (i*this.mtr);
      var yCoord = this.tw + (j*this.mtr);
      var newDot = c.circle(xCoord, yCoord, dotSize);
      this.dots.push(newDot);
    }
  }
  this.dots.attr({'fill':qpo.COLOR_DICT['foreground'], 'stroke-width':0, 'opacity':0})
  this.all.push(this.dots)

  this.mains = c.set().push(this.goalLines, this.sideWalls, this.curves)

  this.lowOpacity = 0.3

  //ANIMATION FOR GAME BOARD CREATION:
  if(qpo.mode=='game'){
    // sideWalls.transform('t0,-900');
    // goalLines.transform('t-700,0');
    var ANIM_TIME = 1500
    this.all.scale(.01, .01, this.lw+this.width/2, this.tw+this.height/2)
    this.all.attr({'opacity':0})
    this.mains.animate({'opacity':1}, ANIM_TIME)
    this.all.animate({'transform':''}, ANIM_TIME, '<', function(){
      // qpo.fadeIn(this.dots, 1000);
      this.dots.animate({'opacity': this.lowOpacity}, 1000)
      setTimeout(function(){qpo.glows.show()}, 1000);
    }.bind(this));
  }
  else{ qpo.glows.show() }
  qpo.gui.push(this.all)

  this.flash = function(first, last){
    if(!first) { //Flash (and deflash) the surface, unless it's the start of the game
      this.surface.animate({
        '0%'  :{'opacity' : 0},
        '20%' :{'opacity' : 1},
        '100%':{'opacity' : 0}
      }, qpo.deflashLength)
    }
    if(!last) { //Start "charging" the board again, unless it's the end of the game
      qpo.flashTimeout = setTimeout(function(){ //"charging" animation: after the flash/deflash, start charging back up
        this.dots.animate({'opacity':1}, qpo.flashLength, '<', function(){
          this.dots.attr({'opacity': this.lowOpacity})
        }.bind(this))

        //SCALING TRACE:
        this.leftCharger.animate({'transform':'t'+x2+',0s'+(this.height/this.chargerHeight), 'opacity':1, 'stroke-width':3},
          qpo.flashLength, '<', function(){ //reset the transform
            this.leftCharger.attr({'transform':'', 'opacity':0.15, 'stroke-width':1})
          }.bind(this)
        )
        this.rightCharger.animate({'transform':'t-'+x2+',0s'+(this.height/this.chargerHeight), 'opacity':1, 'stroke-width':3},
          qpo.flashLength, '<', function(){ //reset the transform
            this.rightCharger.attr({'transform':'', 'opacity':0.15, 'stroke-width':1})
          }.bind(this)
        )

        //LINEAR TRACE, NO SCALING: (old)
        // this.leftCharger.animate({'transform':('t'+x2+',-'+y2), 'opacity':1}, qpo.flashLength, '<', function(){ //reset the transform
        //   this.leftCharger.attr({'transform':'', 'opacity':0.1})
        // }.bind(this))
        // this.rightCharger.animate({'transform':('t-'+x2+',-'+y2), 'opacity':1}, qpo.flashLength, '<', function(){ //reset the transform
        //   this.rightCharger.attr({'transform':'', 'opacity':0.1})
        // }.bind(this))

        //CURVED TRACE (doesn't work.):
        // this.leftCharger.animate({'transform':('...t0,-'+y2), 'opacity':1}, qpo.flashLength, '<', function(){ //reset the transform
        //   this.leftCharger.attr({'transform':'', 'opacity':0.1})
        // }.bind(this))
        // this.rightCharger.animate({'transform':('...t0,-'+y2), 'opacity':1}, qpo.flashLength, '<', function(){ //reset the transform
        //   this.rightCharger.attr({'transform':'', 'opacity':0.1})
        // }.bind(this))
        // this.leftCharger.animate({'transform':('...t'+x2+',0')}, qpo.flashLength)
        // this.rightCharger.animate({'transform':('...t-'+x2+',0')}, qpo.flashLength)
      }.bind(this), qpo.deflashLength)

      // OLDER CHARGING ANIMATION:
      // this.zs.attr({'opacity':0});
      // this.zs.animate({ //make side 'charge up' (with a low-resolution stab at keyframes for now)
      //   '0%'   : {'opacity':0},
      //   '90%'  : {'opacity':.7},
      //   '95%'  : {'opacity':.8},
      //   '98%'  : {'opacity':.9},
      //   '100%' : {'opacity' : 1}
      // }, qpo.flashLength)
      }
   }

  // Establish static spawn zones for each team:
  this.redZone = qpo.zerosGrid(this.cols, this.rows)
  this.blueZone = qpo.zerosGrid(this.cols, this.rows)
  for (var i=0; i<Math.floor(this.rows/2); i++){ //10 demerits in enemy zones
    for (var j=0; j<this.cols; j++){
      this.redZone[j][i] += 10
      this.blueZone[j][this.rows-1-i] += 10
    }
  }
  if (this.rows%2 == 1){ //block middle row if q is odd
    for (var i=0; i<this.cols; i++) {
      this.redZone[i][Math.floor(this.rows/2)] += 10
      this.blueZone[i][Math.floor(this.rows/2)] += 10
    }
  }

  this.state = new Array() //qpo.board.state tells us where all the shots and bombs will be at the next turn tick
  for(var i=0; i<this.rows; i++){ this.state.push(new Array()) }

  this.updateState = function(){ //scan all bombs and shots and update the board's state grid accordingly
    // The result represents the state of the board at the beginning of the next turn.
    this.state = qpo.zerosGrid(this.cols, this.rows)
    var bomb, shot, amt
    for(var i=0; i<qpo.bombs.length; i++){ //adjust for bombs
      bomb = qpo.bombs[i]
      if (bomb.timer > -1){ // Exploded bombs (timer = -1) will be gone by next tick so don't scan them
        amt = (bomb.team=='blue' ? (3) : (12))
        this.state[ bomb.x ][ bomb.y ] = amt + 3*bomb.timer
      }
    }
    for(var i=0; i<qpo.shots.length; i++){ //scan shots
      shot = qpo.shots[i]
      amt = (shot.data('team')=='blue' ? (1) : (2))
      this.state[ shot.data('xLoc') ][ shot.data('yLoc') ] += amt
    }
    // qpo.showGrid(this.state)
  }
  this.findDemerits = function(team){ //return a demerits grid based on bombs, shots, and units
    var dir
    var result = qpo.zerosGrid(this.cols, this.rows)
    if (team == 'blue') { result = qpo.sumGrids(this.blueZone, result) }
    else { result = qpo.sumGrids(this.redZone, result) }

    // qpo.showGrid(result)
    for (var i=0; i<this.cols; i++){ //Look at each grid square and adjust the demerits grid accordingly
      for (var j=0; j<this.rows; j++){
        dir = 0 //reset dir

        // SHOT SECTION
        // Make dir +1 if the shot is moving down, and -1 if the shot is moving up:
        if (this.state[i][j]%3 == 2){dir = -1}
        else if (this.state[i][j]%3 == 1){dir = 1}
        // At this point, if dir is not 0, it means there is a shot in the space.
        if (dir != 0) { //5 demerits to spaces in the way of the shot
          for (var k=0; k<5; k++){
            try {result[i][j + k*dir] += 5}
            catch(e){console.log('shot near wall')} //might throw error if near walls
          }
        }

        // BOMB SECTION
        dir=0 //reset dir to 0
        // Make dir +1 if the bomb is moving down, and -1 if the bomb is moving up:
        if (2 < this.state[i][j] && this.state[i][j] < 6){ //Bomb will explode in this space. Add 5 demerits to the space and each adjacent space.
          for (var k = -1; k<2; k++){
            for (var l = -1; l<2; l++){
              try {result[i+k][j+l] += 5 }
              catch(e){ //might throw error if near walls
                // console.log('exploding bomb near wall')
              }
            }
          }
        }
        else if (5 < this.state[i][j] && this.state[i][j] < 12){dir=1}
        else if (11 < this.state[i][j] && this.state[i][j] < 18){dir=-1}
        // At this point, if dir is not 0, it means there is a bomb in the space.
        if (dir != 0) { //5 demerits to the bomb's space and the one it will move into.
          try { //might throw error if near walls
            result[i][j] += 5
            result[i][j + dir] += 5
          }
          catch(e){console.log('moving bomb near wall')}
        }
      }
    }
    // qpo.showGrid(result)

    var unit
    for (var i=0; i<qpo.units.length; i++){ //add 5 demerits wherever units are
      unit = qpo.units[i]
      if(unit.alive || unit.spawnReady){ result[unit.x][unit.y] += 5 }
    }
    // qpo.showGrid(result)
    return result
  }

  return this //return the constructed Board object
}

qpo.makeUnits = function(){ //called at the start of each game (from startGame)
  //  Place U units randomly but symmetrically on an NxM board (N columns, M rows)
  //  Remember that rows and columns are zero-indexed.
  //  Also, blue is on top, red on bottom.
  //    0. Board must be at least 3x3.
  //    1. If board has a center panel (M and N are odd), don't place units there. (Column N/2, Row M/2.)
  //    2. NxM/2 spaces are available per team. (NXM/2-1 if both are odd.) Choose U random, mutually-exclusive
  //         spaces from these possiblities, and place units there.
  //    3. Don't place units in such a way that two opposing units spawn touching each other.

  var gridXs = [] // the column numbers of each blue unit to be placed
  var gridYs = [] // the row numbers of each blue unit to be placed

  qpo.units = new Array(); //all Units (red and blue);
  var chooseSpots = function(unitsChosen){
    //CHOOSE A ROW.
    var row, column, badSpawn;
    badSpawn = true;
    while(badSpawn){ //find a suitable row and column for the spawn.
      if (qpo.guiDimens.rows % 2 == 0){ //If even # of rows, choose row from 0 to (M/2 - 1).
        row = Math.floor((Math.random() * (qpo.guiDimens.rows/2 - 1) ));
      }
      else { //  If odd # of rows, choose row from 0 to (M-1)/2.
        row = Math.floor((Math.random() * (qpo.guiDimens.rows-1)/2));
      }
      //CHOOSE A COLUMN. //THEN, FIND OUT IF CHOSEN ROW WAS MIDDLE OR NOT.
      if (row == qpo.guiDimens.rows/2){ //If so, choose from the first half of columns, excluding the middle if odd num of columns.
        if (qpo.guiDimens.columns%2 == 0){ //if even num of columns, choose column from 0 to N/2-1.
          column = Math.floor((Math.random() * (qpo.guiDimens.columns/2 - 1) ));
        } else { //if odd num of cols, choose column from 0 to N/2 - .5
          row = Math.floor((Math.random() * (Math.floor(qpo.guiDimens.rows/2))));
        }
      } else { //If not, choose from all columns.
        column = Math.floor((Math.random()*qpo.guiDimens.columns));
      }
      for (var j=0; j<unitsChosen; j++){ //set badSpawn to false if the spawn is fine.
        if(!([row,column] == [gridYs[j],gridXs[j]])){
          badSpawn = false;
        } else { // set badSpawn and break out of this if the spawn overlaps.
          badSpawn = true;
          break;
        }
      }
      badSpawn = false;
    }

    gridYs.push(row);
    gridXs.push(column);
  };

  for (var i=0; i<qpo.activeGame.ppt; i++) { //for each player, create a squad and assign it to that player
    var newBlueUnits = new Array();
    var newRedUnits = new Array();
    for (var j=0; j<qpo.activeGame.unitsPerPlayer; j++){ //create some units for each squad.
      var newUnitNum = i*qpo.activeGame.unitsPerPlayer+j
      chooseSpots(newUnitNum) //choose initial spawn locations

      var newBlueUnit = new qpo.Unit('blue', gridXs[newUnitNum], gridYs[newUnitNum], newUnitNum,
        qpo.blue.players[i], (i==qpo.user.player.num && 'blue'==qpo.user.player.team) )
      newBlueUnits.push(newBlueUnit)
      qpo.blue.addUnit(newBlueUnit)
      newBlueUnit.phys.attr({'opacity':0})
      qpo.fadeIn(newBlueUnit.phys, 1000);
      qpo.units.push(newBlueUnit)

      var newRedUnit = new qpo.Unit('red', qpo.guiDimens.columns-1-gridXs[newUnitNum], qpo.guiDimens.rows-1-gridYs[newUnitNum], newUnitNum,
        qpo.red.players[i], (i==qpo.user.player.num && 'red'==qpo.user.player.team) )
      newRedUnits.push(newRedUnit)
      qpo.red.addUnit(newRedUnit)
      newRedUnit.phys.attr({'opacity':0})
      qpo.fadeIn(newRedUnit.phys, 1000)
      qpo.units.push(newRedUnit)
    }
    qpo.blue.players[i].makeSquad(newBlueUnits)
    qpo.red.players[i].makeSquad(newRedUnits)

    // console.log(playerNum, qpo.user.player.num)
    // if(qpo.user.player.num == playerNum){ // Some new units will belong to the user. Highlight them in sequence
    //   setTimeout(function(){
    //     console.log('activating unit '+newBlueUnit.num)
    //     if(qpo.user.player.team=='blue'){newBlueUnit.activate(); }
    //     else { newRedUnit.activate(); }
    //   }.bind(this), 3000 + (i%qpo.activeGame.unitsPerPlayer)*(1500/qpo.activeGame.unitsPerPlayer))
    //
    //   (function(ind){ // Highlight this unit on a schedule (closure for loop scope)
    //     setTimeout(function(){ //de-highlight old one, highlight new one
    //       console.log('activating unit '+newBlueUnit.num)
    //       if(qpo.user.player.team=='blue'){newBlueUnit.activate(); }
    //       else { newRedUnit.activate(); }
    //     }.bind(this), 3000 + (i%qpo.activeGame.unitsPerPlayer)*(1500/qpo.activeGame.unitsPerPlayer));
    //   })(i);
    // }
  }
}

qpo.Scoreboard = function(yAdj, initialClockValue){ //draw the scoreboard and push to gui
  this.redScore = 0;
  this.blueScore = 0;
  this.gameClock = initialClockValue;
  var y = this.y = 30;
  var xOff = 100;

  this.redScoreText = c.text(300-xOff, y+yAdj, "0").attr({qpoText: [25, qpo.COLOR_DICT["red"]]});
  this.redSection = c.set().push(this.redScoreText);

  this.gameClockText = c.text(300, y+yAdj, new String(this.gameClock)).attr({qpoText: [40, qpo.COLOR_DICT['foreground']]});

  this.blueScoreText = c.text(300+xOff, y+yAdj, "0").attr({qpoText: [25, qpo.COLOR_DICT["blue"]]});
  this.blueSection = c.set().push(this.blueScoreText);

  this.update = function(){ //update display from qpo.red.points and qpo.blue.points.
    this.redScore = qpo.red.points
    this.blueScore = qpo.blue.points
    this.gameClock = qpo.activeGame.turns - qpo.activeGame.turnNumber
    this.redScoreText.attr({'text':qpo.red.points});
    this.gameClockText.attr({'text':qpo.activeGame.turns - qpo.activeGame.turnNumber});
    this.blueScoreText.attr({'text':qpo.blue.points});
  }

  this.all = c.set().push(this.redSection, this.gameClockText, this.blueSection).attr({'opacity':0});

  this.gameEnd = function(){ //move text down and enlarge, hide clock, make bits
    qpo.fadeOut(this.gameClockText, function(){
      this.all.animate({'transform':('t0,50'+'s3')}, 500, '<')
      if (this.redScore + this.blueScore == 0) { var redPortion = .5 } //in case total is 0
      else { var redPortion = this.redScore / (this.redScore+this.blueScore) }
      qpo.passer = redPortion * c.width
      // redPortion = .4 //for testing
      // var bluePortion = 1-redPortion
      // qpo.menus['match complete'].doodad = new qpo.Bits2(redPortion*c.width, true)
      // qpo.makeBits(0,0, redPortion*c.width, c.height, [qpo.COLOR_DICT['red']], Math.floor(47*redPortion))
      // qpo.makeBits(redPortion*c.width, 0, bluePortion*c.width, c.height, [qpo.COLOR_DICT['blue']], Math.floor(47*bluePortion))
      this.all.toFront()
    }.bind(this), 2000)
  }

  setTimeout(function(){qpo.fadeIn(this.all, 1500);}.bind(this), 1500);
  qpo.gui.push(this.all);
  return this;
};

qpo.MobileControls = function(){
  this.all = c.set(); // Create Raph set

  // Make arrows and stay commands:
  var OFFSET = 50
  var MOBILE_Y = HEIGHT - 100
  var SQ_S = 47 //square size
  var SQ_ATTS= {'stroke':'white', 'stroke-width':'3'} //square attributes

  this.left = qpo.arrow(WIDTH/2 - OFFSET, MOBILE_Y, 'white','left')
  this.up = qpo.arrow(WIDTH/2, MOBILE_Y - OFFSET, 'white','up')
  this.right = qpo.arrow(WIDTH/2 + OFFSET, MOBILE_Y, 'white','right')
  this.down = qpo.arrow(WIDTH/2, MOBILE_Y + OFFSET, 'white','down')
  this.stay = c.circle(WIDTH/2, MOBILE_Y, 10).attr({'stroke':'white'})

  this.left.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveLeft');}
  })
  this.up.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveUp');}
  })
  this.right.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveRight');}
  })
  this.down.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveDown');}
  })
  this.stay.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('stay');}
  })

  this.all.push(this.left, this.up, this.right, this.down, this.stay)

  // Add squares for tapping convenience
  this.leftSq = c.rect(WIDTH/2 - OFFSET - SQ_S/2, MOBILE_Y - SQ_S/2, SQ_S, SQ_S)
  this.leftSq.attr(SQ_ATTS)
  this.leftSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveLeft');}
  })
  this.upSq = c.rect(WIDTH/2 - SQ_S/2, MOBILE_Y - OFFSET - SQ_S/2, SQ_S, SQ_S)
  this.upSq.attr(SQ_ATTS)
  this.upSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveUp');}
  })
  this.rightSq = c.rect(WIDTH/2 + OFFSET - SQ_S/2, MOBILE_Y - SQ_S/2, SQ_S, SQ_S)
  this.rightSq.attr(SQ_ATTS)
  this.rightSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveRight');}
  })
  this.downSq = c.rect(WIDTH/2 - SQ_S/2, MOBILE_Y + OFFSET - SQ_S/2, SQ_S, SQ_S)
  this.downSq.attr(SQ_ATTS)
  this.downSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('moveDown');}
  })
  this.staySq = c.rect(WIDTH/2 - SQ_S/2, MOBILE_Y - SQ_S/2, SQ_S, SQ_S)
  this.staySq.attr(SQ_ATTS)
  this.staySq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('stay');}
  })
  this.all.push(this.leftSq, this.upSq, this.rightSq, this.downSq, this.staySq)

  // Make shoot and bomb commands:
  this.shoot = c.text(WIDTH/2 + 150, MOBILE_Y - OFFSET, 'shoot').attr({'qpoText':[20, qpo.COLOR_DICT['green']]})
  this.bomb = c.text(WIDTH/2 - 150, MOBILE_Y - OFFSET, 'bomb').attr({'qpoText':[20, qpo.COLOR_DICT['purple']]})

  this.shoot.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('shoot');}
  })
  this.bomb.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('bomb');}
  })

  this.all.push(this.shoot, this.bomb)

  // Add rects for tapping convenience:
  this.shootSq = c.rect(WIDTH/2 + 150 - SQ_S, MOBILE_Y - OFFSET - SQ_S/2, SQ_S * 2, SQ_S)
  this.shootSq.attr(SQ_ATTS)
  this.shootSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('shoot');}
  })
  this.bombSq = c.rect(WIDTH/2 - 150 - 4/5 * SQ_S, MOBILE_Y - OFFSET - SQ_S/2, SQ_S * 8/5, SQ_S)
  this.bombSq.attr(SQ_ATTS)
  this.bombSq.click(function(){
    if(qpo.user.activeUnit != null){qpo.user.activeUnit.order('bomb');}
  })
  this.all.push(this.shootSq, this.bombSq)

  qpo.gui.push(this.all)
  return this.all
}

//INCREMENT FUNCTIONS (no new Raph elements created)
qpo.detectCollisions = function(ts){ //ts is teamSize, aka po
  // called every 10 ms once game has begun
  var splicers = []; //used for destroying references to shots once they're gone
  // OUTLINE:
  // for each shot, check for collisions with units and bombs
  // for each bomb, check for collisions with bombs and units
  // for each unit, check for collisions with units on the other team
  // TODO (MAYBE): shots --> shots
  for (var i=0; i<qpo.shots.length; i++) { //iterate over shots
    var shot = qpo.shots[i]
    var shotBox = shot.getBBox();
    var sBOS = shotBox.y2;
    var nBOS = shotBox.y;
    var eBOS = shotBox.x2;
    var wBOS = shotBox.x;
    //CHECK FOR COLLISION WITH WALL:
    if (sBOS>qpo.board.bw || nBOS<qpo.board.tw){
      qpo.shots[i].hide(); //make the shot disappear
      qpo.shots[i].data("hidden",true);
      splicers.push(i);
    }
    //CHECK FOR COLLISION WITH ANOTHER OBJECT:
    for (var j=0; j<qpo.units.length; j++) { //iterate over units within shots
      /*
      When a shot and a unit collide,
      hide both the shot and the unit from the board,
      tell them they're hidden (Element.data("hidden",true))
      and remove them from their respective arrays
      */
      var unit = qpo.units[j]
      var unitBox = unit.phys.getBBox();

      var nBOU = unitBox.y;
      var wBOU = unitBox.x;
      var sBOU = unitBox.y2;
      var eBOU = unitBox.x2;

      if( (( nBOU < nBOS && nBOS < sBOU ) || //vertical overlap
          ( nBOU < sBOS && sBOS < sBOU )) &&
          (( wBOU < wBOS && wBOS < eBOU ) || //horizontal overlap
          ( wBOU < eBOS && eBOS < eBOU )) &&
          // (shot.data("hidden") != true) &&
          (shot.removed != true) && //shot has not already been "removed"
          (unit.alive)) {
        // shot.hide() //prevents double-collision glitch... not
        // shot.data("hidden", true) //prevents double-collision glitch...not
        switch(unit.coating.data('type')){ //kill unit or remove coating
          case 'none' : {
            try { //kill the unit and do reward logic
              unit.kill()
              if (unit.team == shot.data('team')) { //punish it for killing its own team
                qpo[shot.data('team')].units[shot.data('unitNum')].player.rewardQueue.push(-1)
                // console.log('I think a ' + unit.team + ' unit shot its own team')
              } else { //reward it for killing the other team
                qpo[shot.data('team')].units[shot.data('unitNum')].kills++
                qpo[shot.data('team')].units[shot.data('unitNum')].player.rewardQueue.push(1)
              }
            }
            catch(e) {
              console.log(e)
              console.log(shot)
              console.log(shot.data('team'))
              console.log(qpo[shot.data('team')])
              console.log(shot.data('unitNum'))
            }
            break
          }
          case 'shield':
          case 'plasma':
          case 'antimatter': { unit.applyCoating('none'); break;}
          default: {console.log('SOMETHING WEIRD HAPPENED')}
        }
        shot.remove()
        splicers.push(i)
      }
    }//end iterating over units within shots
    if (qpo.bombs.length > 0){ //iterate over bombs within shots (if bombs exist)
      for (var j=0; j<qpo.bombs.length; j++) {
        if(qpo.bombs[j]){
          //   When a shot hits an unexploded bomb,
          // explode the bomb and get rid of the shot
          var bBox = qpo.bombs[j].phys.getBBox();
          var nBOB = bBox.y;
          var wBOB = bBox.x;
          var sBOB = bBox.y2;
          var eBOB = bBox.x2;

          if( (( nBOB < nBOS && nBOS < sBOB ) || //vertical overlap
                ( nBOB < sBOS && sBOS < sBOB )) &&
                (( wBOB < wBOS && wBOS < eBOB ) || //horizontal overlap
                ( wBOB < eBOS && eBOS < eBOB )) &&
                !(qpo.shots[i].data("hidden")) &&
                !(qpo.bombs[j].exploded)) {
            // console.log("bomb " + j + " hit shot " +i);
            // qpo.shots[i].hide(); //make the shot disappear
            qpo.shots[i].remove()
            qpo.bombs[j].explode()
            // qpo.shots[i].data("hidden",true)
            splicers.push(i)
          }
        }
      } //end iterating over bombs within shots
    }
  } //end iterating over shots

  if (qpo.bombs.length > 0){ //iterate over bombs (after checking if "bombs" exists)
    for (var i=0; i<qpo.bombs.length; i++) { //iterate over bombs
      if (qpo.bombs[i]){ //check if a bomb exists at index i
        var bombBox = qpo.bombs[i].phys.getBBox();
        var sBOB = bombBox.y2;
        var nBOB = bombBox.y;
        var eBOB = bombBox.x2;
        var wBOB = bombBox.x;

        if ( !(qpo.bombs[i].exploded) && (sBOB>qpo.board.bw || nBOB<qpo.board.tw)){ qpo.bombs[i].explode(); }
        for (var j=0; j<qpo.units.length; j++) { //iterate over units within bombs

          // When a bomb and a unit collide, kill the unit
          //   and check if the bomb is exploded. If the bomb
          //   is not exploded, explode it.

          var unitBox = qpo.units[j].phys.getBBox()
          var nBOU = unitBox.y;
          var wBOU = unitBox.x;
          var sBOU = unitBox.y2;
          var eBOU = unitBox.x2;

          if( (( nBOU < nBOB && nBOB < sBOU ) || //vertical overlap
              ( nBOU < sBOB && sBOB < sBOU ) ||
              ( nBOB < nBOU && nBOU < sBOB ) || //vertical overlap
              ( nBOB < sBOU && sBOU < sBOB )) &&
              (( wBOU < wBOB && wBOB < eBOU ) || //horizontal overlap
              ( wBOU < eBOB && eBOB < eBOU ) ||
              ( wBOB < wBOU && wBOU < eBOB ) ||
              ( wBOB < eBOU && eBOU < eBOB )) &&
              (qpo.units[j].alive)) {
            qpo.units[j].kill();
            if (qpo.units[j].team == qpo.bombs[i].unit.team) { //punish it for bombing its own team
              qpo.bombs[i].unit.player.rewardQueue.push(-1)
            } else { //reward it for bombing the other team
              qpo.bombs[i].unit.player.rewardQueue.push(1)
            }
            if ( !(qpo.bombs[i].exploded)){ qpo.bombs[i].explode(); }
          }
        }//end iterating over units within bombs
        for (var j=0; j<qpo.bombs.length; j++) { //iterate over bombs within bombs
          if(qpo.bombs[j]){
            // When a bomb hits an unexploded bomb,
            // explode the bomb and get rid of the shot
            var bombBox2 = qpo.bombs[j].phys.getBBox();
            var nBOB2 = bombBox2.y;
            var wBOB2 = bombBox2.x;
            var sBOB2 = bombBox2.y + bombBox2.height;
            var eBOB2 = bombBox2.x + bombBox2.width;

            if( !(i==j) && //make sure we're really looking at 2 bombs.
                  (( nBOB2 <= nBOB && nBOB <= sBOB2 ) || //vertical overlap
                  ( nBOB2 <= sBOB && sBOB <= sBOB2 )) &&
                  (( wBOB2 <= wBOB && wBOB <= eBOB2 ) || //horizontal overlap
                  ( wBOB2 <= eBOB && eBOB <= eBOB2 )) &&
                  (!(qpo.bombs[i].exploded) || // make sure at least one is not-exploded
                  !(qpo.bombs[j].exploded))) {
              //explode any un-exploded ones:
              //console.log("bomb " + i + "hit bomb " + j);
              if (!(qpo.bombs[i].exploded)) {qpo.bombs[i].explode()}
              if (!(qpo.bombs[j].exploded)) {qpo.bombs[j].explode()}
            }

          } //end chekcing if bomb at index j exists
        } //end iterating over bombs within bombs
      } //end checking of bomb at index i exists
    }//end iterating over bombs
  } //end iterating over bombs after checking if bombs exists

  //CHECK FOR COLLISIONS BETWEEN UNITS:
  for (var i=0; i<ts; i++){ //iterate over blue team of units
    var bu = qpo.blue.units[i]
    if(bu.alive){ //wall detection blue, and collisions with red units
      var bbox = bu.phys.getBBox()
      var nBOU = bbox.y + 1
      var wBOU = bbox.x + 1
      var sBOU = nBOU + qpo.guiDimens.squareSize - 2
      var eBOU = wBOU + qpo.guiDimens.squareSize - 2

      for (var j=0; j<ts; j++) { //iterate over red team of units
        var ru = qpo.red.units[j]
        if (ru.alive){
          var rbox = ru.phys.getBBox()
          var nBOU2 = rbox.y + 1
          var wBOU2 = rbox.x + 1
          var sBOU2 = nBOU2 + qpo.guiDimens.squareSize - 2
          var eBOU2 = wBOU2 + qpo.guiDimens.squareSize - 2

          if( (( nBOU <= nBOU2 && nBOU2 <= sBOU ) || //vertical overlap
              ( nBOU <= sBOU2 && sBOU2 <= sBOU ) ||
              ( nBOU2 <= nBOU && nBOU <= sBOU2 ) || //vertical overlap
              ( nBOU2 <= sBOU && sBOU <= sBOU2 )) &&
              (( wBOU <= wBOU2 && wBOU2 <= eBOU ) || //horizontal overlap
              ( wBOU <= eBOU2 && eBOU2 <= eBOU ) ||
              ( wBOU2 <= wBOU && wBOU <= eBOU2 ) ||
              ( wBOU2 <= eBOU && eBOU <= eBOU2 )) ) {
            var redCoat = ru.coating.data('type')
            var blueCoat = bu.coating.data('type')
            if (redCoat=='plasma' && blueCoat != 'plasma'){ bu.kill(); ru.applyCoating('none') }
            else if (blueCoat=='plasma' && redCoat != 'plasma') { ru.kill(); bu.applyCoating('none') }
            else { bu.kill(); ru.kill() }
          }
        }
      }//end iterating over red units
    }
  } //end iterating over blue units

  while (splicers.length > 0) { // Splice collided shots out of the 'shots' array.
    //The 'splicers' array contains the indices of shots to be removed from the 'shots' array.
    qpo.shots.splice(splicers[0], 1); //remove desired shot from 'shots' array.
    splicers.shift(); //remove first element of 'splicers' array.
    for (var i=0; i<splicers.length; i++){ splicers[i] -= 1; } //decrement all other indices.
  }
}

qpo.sendMoveToServer = function(json){
  // console.log(eval("new Date().getTime()"));
  qpo.timeSinceLastMove = ( eval("new Date().getTime()") - qpo.lastMoveTime )
  // mlog("qpo.timeSinceLastMove");
  if (qpo.timeSinceLastMove > qpo.waitTime){ //if they've waited at least 100 ms:
    qpo.socket.send(JSON.stringify(json))
    qpo.lastMoveTime = eval("new Date().getTime()")
  } else { //otherwise, tell them they're sending msgs too fast
    console.log("slow your roll, Mr. Jones")
  }
}

//LISTEN FOR INPUT
$(window).keydown(function(event){
  // switch(event.keyCode){ //prevent defaults for backspace/delete, spacebar, and enter
  //   case 8: //backspace/delete
  //   case 32: //spacebar
  //   case 13: //enter
  //     event.preventDefault();
  //     break;
  //   default:
  //     break;
  // }
  if(qpo.ignoreInput){return;}
  switch(qpo.mode){ //do the right thing based on what type of screen the user is in (menu, game, tutorial, etc)
    case "menu":
      switch(event.keyCode){
        case 8: // backspace/delete: return to the previous menu
          event.preventDefault();
          if (qpo.activeMenu != "title") {qpo.menus[qpo.activeMenu].up();}
          break;
        case 32: // spacebar (fall through to enter/return)
        case 13: // enter/return
          try {qpo.menus[qpo.activeMenu].cl.selectedItem.action();}
          catch(err){;} //do nothing if there is no activeButton
          if(qpo.activeMenu == "title"){qpo.titleScreen.close()}
          break;
        case 87: //w
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        case 83: //s
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        case 65: {  //a
          if (qpo.activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.minus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 68: {  //d
          if (qpo.activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.plus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 37: {  //left arrow
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.minus(); }
            catch(err) { ; }
          }
          break;
        }
        case 38: {  //up arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        }
        case 39: { //right arrow
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.plus(); }
            catch(err) { ; }
          }
          break;
        }
        case 40: { //down arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        }
        default:
          break;
      }
      break;
    case "game":
      try { //try to respond to the keypress appropriately
        switch(event.keyCode){
          case 81:
          case 69:
          case 65:
          case 87:
          case 68:
          case 83:
          case 32:
          case 66:
          case 88: //order detected (qweasdx/spacebar)
            var moveStr = qpo.keyCodes[event.keyCode];
            if(qpo.user.activeUnit != null){qpo.user.activeUnit.order(moveStr);}
            break;
          case 37:
          case 38:
          case 39:
          case 40: //up/left/right/down arrows (move highlight)
            if(!qpo.gameEnding){ qpo.user.activeUnit.search(qpo.dirMap[event.keyCode]); }
            break;
          default: //some other key detected (invalid)
            //left = 37
            // up = 38
            // right = 39
            // down = 40
            "some other key";
            // tab = 9
            break;
        }
      }
      catch(err){ ; } //legacy: probably because qpo.blue.units[-1] doesn't exist. do nothing.
      break;
    case "tut":
      switch(event.keyCode){
        case 13: //enter
          qpo.tut.tutFuncs.enter();
          break;
        case 69: //"e"
          qpo.tut.tutFuncs.ekey();
          break;
        case 8: // backspace
          c.clear();
          qpo.menus.main = new qpo.makeMainMenu();
          break;
        default:
          break;
      }
      break;
    case "other":
      break;
    default:
      ;
  }
});
