qpo.Game = function(args){ //"Game" class.
  //{q, po, type, turns, ppt, customScript}
  qpo.mode = 'game'

  //Grab the arguments (and fill in missing ones with default values):
  this.q = args.q || 7 // Number of rows, columns on the board
  this.po = args.po || 3 // Number of units on each team
  this.type = args.type || 'single' //What kind of game is this? (tutorial, single, multi, campaign)
  this.turns = (args.turns || 50) //How many turns does this game consist of?
  this.ppt = args.ppt || 1 //players per team
  this.customScript = args.customScript || function(){}
  this.teams = { //instantiate red and blue teams
    'red': new qpo.Team({'color':'red', 'players': args.redPlayers}),
    'blue': new qpo.Team({'color':'blue', 'players': args.bluePlayers})
  }

  // Do some things with the args:
  qpo.red = this.teams.red //convenient pointer
  qpo.blue = this.teams.blue //convenient pointer

  this.scoreToWin = 10*this.po
  this.unitsPerPlayer = this.po/this.ppt

  qpo.currentSettings = {'q':this.q, 'po': this.po, 'type':this.type,
    'turns':this.turns, 'ppt': this.ppt, 'customScript':this.customScript}

  qpo.guiDimens.squareSize = 350/this.q   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize
  this.scaling = qpo.guiDimens.squareSize/50 // Visual scaling

  for(var i=0; i<this.ppt; i++){ //fill empty player slots with computer players (of type 'random', for now)
    if(typeof qpo.red.players[i] != 'object'){qpo.red.players[i] = new qpo.Player(null, 'Randy '+i, 'random', 'red', i)}
    if(typeof qpo.blue.players[i] != 'object'){qpo.blue.players[i] = new qpo.Player(null, 'Blandy '+i, 'random', 'blue', i)}
  }
  qpo.user.minUnit = qpo.user.player.num   * this.po
  qpo.user.maxUnit =(qpo.user.player.num+1)* this.po - 1

  //other misc. setup:
  this.turnNumber = 0 //How far through this game are we?
  this.isEnding = false
  this.upcomingSpawns = new Array()
  this.gui = c.set()

  this.record = { //All data needed to recreate this game. (not complete)
    "q": this.q,
    "po" : this.po,
    "unitSpawns": (new Array()), //initial spawns of units
    "redMoves": (new Array()), //
    "blueMoves": (new Array()), //
  };

  //Define some methods:
  this.drawGUI = function(xAdj, yAdj){ //create the board and scoreboard
    var xAdj = xAdj || 0
    var yAdj = yAdj || 0
    qpo.board = this.board = new qpo.Board(this.q, this.q, 125+xAdj, 90+yAdj) // make the board (with animation if game starting)
    qpo.scoreboard = new qpo.Scoreboard(yAdj, this.turns)
  }

  this.prevState = []
  this.state = []
  this.getState = function(){ // Returns an array to be stored and passed to the neural network.
    var arr = new Array() // Will contain 216 entries for 4-po game.
    //  We'll format the array properly later. Let's start with the raw values.
    for (var i=0; i<this.po; i++){
      // 16 qpo-grid coords of units (4 per po--red/blue x/y):
      if(qpo.blue.units[i].alive){ //0-7: blue x,y
        arr[2*i] = qpo.blue.units[i].x //values from 0 to (q-1)
        arr[2*i + 1] = qpo.blue.units[i].y //principle: keep coords of same obj together
      }
      else { // -1 if dead
        arr[2*i] = -1
        arr[2*i + 1] = -1
      }
      if(qpo.red.units[i].alive){ //8-15: red x,y
        arr[2*qpo.activeGame.po + 2*i] = qpo.red.units[i].x
        arr[2*qpo.activeGame.po + 2*i + 1] = qpo.red.units[i].y
      }
      else { // -1 if dead
        arr[2*qpo.activeGame.po + 2*i] = -1
        arr[2*qpo.activeGame.po + 2*i + 1] = -1
      }

      var zero23 //  var that will range from 0-23.
      var one70 // var that will range from 0-70, in threes.
      for (var j=0; j<6; j++){ //16-87: shots x,y, directionality
        //Get x/y coords and directionality of shot for all 24 (3*2*po) possible
        // shots, resulting in 72 (3*3*2*po) new additions
        //2 teams per po, 3 shots per team
        zero23 = (i+1) * (j+1) - 1
        one70 = (zero23*3 + 1)
        if(qpo.shots[zero23]) { //if shot exists, load real values
          //2 things per shot.
          arr[15 + one70] = qpo.shots[zero23].x
          arr[15 + one70 + 1] = qpo.shots[zero23].y
          if (qpo.shots[zero23].data("team")=="blue"){ arr[15 + one70 + 2] = 0.5 }
          else { arr[15 + one70 + 2] = -0.5 }
        }
        else { // load -1,-1,0 if shot doesn't exist
          arr[15 + one70] = -1
          arr[15 + one70 + 1] = -1
          arr[15 + one70 + 2] = 0
        }
      }

      var zero31 //  var that will range from 0-31.
      var one125 // var that will range from 1-125, in fours.
      for (var j=0; j<8; j++){ //88-215: bombs x,y,dir,timer
        //Get x/y coords, direction, and timer of bomb for all 32 (4*2*po) possible
        // bombs, resulting in 128 (4*4*2*po) new additions
        // (2 teams per po, 4 bombs per team, 4 values per bomb)
        zero31 = (i+1) * (j+1) - 1
        one125 = (zero31*4+1)
        if(qpo.bombs[zero31]) { //if shot exists, load real values
          //2 things per shot.
          arr[15 + 72 + one125] = qpo.bombs[zero31].phys.attr('x')
          arr[15 + 72 + one125 + 1] = qpo.bombs[zero31].phys.attr('y')
          if (qpo.bombs[zero31].team == "blue"){ arr[15 + 72 + one125 + 2] = 0.5 }
          else { arr[15 + 72 + one125 + 2] = -0.5 }
          arr[15 + 72 + one125 + 3] = qpo.bombs[zero31].timer
        }
        else { // load -1,-1,0,-1 if shot doesn't exist
          arr[15 + 72 + one125] = -1
          arr[15 + 72 + one125 + 1] = -1
          arr[15 + 72 + one125 + 2] = 0
          arr[15 + 72 + one125 + 3] = -1
        }
      }
    }
    arr[216] = Date.now()
    return arr
  };

  this.start = function(){
    // Draw the board, clear the arrays, place the units and start the game
    if(qpo.playMusic == true){ // stop menu song and play game song. (implement when game song acquired)
      try { this.song.remove() } //try removing the previously existing song
      catch(err) { ; } //if error is thrown, probably doesn't exist, do nothing
      //MAKE MUSIC:
      // qpo.menuSong.pause();
      // qpo.menuSong.currentTime = 0;
      // this.song = song;
      // this.song.play();
      // console.log("playing game music...");
    }
    qpo.mode = 'game'
    qpo.units = new Array()
    qpo.shots = new Array()
    qpo.bombs = new Array()

    this.drawGUI(this.xAdj, this.yAdj)
    setTimeout(function(){ // After 1500 ms, make the units and capture initial state
      qpo.makeUnits() // puts the units on the board (with 1000 ms fade-in)
      this.state = this.getState()
    }.bind(this), 1500)

    setTimeout(function(){qpo.board.notify('3')}, 3000)
    setTimeout(function(){qpo.board.notify('2')}, 4500)
    setTimeout(function(){qpo.board.notify('1')}, 6000)
    // setTimeout(function(){qpo.board.notify('Go')}, 3000)

    setTimeout(function(){ // After 6000 ms, activate user's first unit in prep for game and flash it three times
      qpo.user.player.squad.list[0].activate()
      setTimeout(function(){qpo.blue.units[0].deactivate()}, 100)
      setTimeout(function(){qpo.blue.units[0].activate()},   200)
      setTimeout(function(){qpo.blue.units[0].deactivate()}, 300)
      setTimeout(function(){qpo.blue.units[0].activate()},   400)
    }.bind(this), 6000)

    setTimeout(function(){ //After 7500 ms, start the game in earnest: Set up the newTurn interval, and the collision detection
      qpo.turnStarter = setInterval(this.newTurn.bind(this), 3000*qpo.timeScale)
      this.board.flash(true)
      // setTimeout(function(){this.board.flash()}.bind(this), 3000*qpo.timeScale-qpo.flashLengths.flash);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50)
    }.bind(this), 7500)

    console.log('NEW GAME')
  }
  this.newTurn = function(){ //Generate and execute moves. End the game, if the turn limit has been reached.
    this.turnNumber++
    qpo.scoreboard.update()
    switch(this.turns-this.turnNumber){ //on special turns, notify.
      case 10:{this.board.notify('10'); break;}
      case 5:{this.board.notify('5', qpo.COLOR_DICT['orange']); break;}
      case 3:{this.board.notify('3', qpo.COLOR_DICT['red']); break;}
      case 2:{this.board.notify('2', qpo.COLOR_DICT['red']); break;}
      case 1:{this.board.notify('1', qpo.COLOR_DICT['red']); break;}
    }

    qpo.moment = new Date()

    //// AI REWARD SECTION
    // Record reward events that happened this turn:
    qpo.sixty.list[qpo.sixty.cursor] = qpo.redRewardQueue.reduce(qpo.add, 0)
    qpo.sixty.cursor = (qpo.sixty.cursor == 59) ? 0 : (qpo.sixty.cursor + 1) //cycle the cursor
    qpo.redRewardQueue = []
    // Each turn, reward AI for favorable events, and convert the game state to inputs for the neural nets:
    try{qpo.ali.nn.backward(qpo.sixty.list.reduce(qpo.add, 0))}  // Try to reward...
    catch(err){console.log("Can't train without having acted.")} // ...but will fail if no actions have been taken
    // Manage the game state variables and get input array for nn:
    this.prevState = this.state
    this.state = this.getState()
    qpo.inputForNeural = qpo.convertStateToInputs(this.state)

    //// MOVE GENERATION/EXECUTION SECTION
    for (var i=0; i<this.po; i++){ //snap all units into their correct positions prior to executing new moves
      if(qpo.blue.units[i].alive){ qpo.blue.units[i].snap() }
      if(qpo.red.units[i].alive){ qpo.red.units[i].snap() }
    }
    var po = this.po //for convenience
    for (var i=0; i<po; i++){ //Generate AI moves & execute all moves
      var ru = this.teams.red.units[i]  // Shorten the reference to the red unit, for convenience
      var bu = this.teams.blue.units[i] // ^^^ same for blue
      if (ru.player.type != 'human') { ru.generateMove() }
      if (bu.player.type != 'human') { bu.generateMove() }
      ru.executeMove()
      bu.executeMove()
      bu.resetIcon() //reset the icons for the player's team
      ru.updateLevel()
      bu.updateLevel()
    }

    if(this.turnNumber == this.turns-1){ //End the game, if it's time.
      if (this.isEnding == false){ //find the winner and store to winner
        for(var i=0; i<qpo.blue.units.length; i++){qpo.blue.units[i].deactivate()}
        var winner
        qpo.blueActiveUnit = 50
        qpo.redActiveUnit = 50
        if (qpo.scoreboard.redScore == qpo.scoreboard.blueScore) { winner = "tie" }
        else if (qpo.scoreboard.redScore > qpo.scoreboard.blueScore) { winner = "red" }
        else { winner = "blue" }
        this.isEnding = true
        setTimeout(function(){qpo.activeGame.end(winner)}, 3000*qpo.timeScale)
      }
    }
    this.board.flash(false)
  }
  this.end = function(winner, h){
    qpo.user.activeUnit = null
    var h = h || 0
    clearInterval(qpo.clockUpdater)
    clearInterval(qpo.collisionDetector)
    clearInterval(qpo.turnStarter)
    qpo.gui.stop()
    qpo.gui.animate({'opacity':0}, 2000, 'linear')
    qpo.fadeOutGlow(qpo.glows, function(){ //clear GUI, reset arrays, and bring up the next screen
      qpo.gui.clear()
      c.clear()
      qpo.shots = []
      qpo.bombs = []
      qpo.units = []
      (winner == "red") ? (qpo.ali.nn.backward(2)) : (qpo.ali.nn.backward(0)) //reward AI for winning, not losing
      (winner == "tie") ? (qpo.ali.nn.backward(1)) : (qpo.ali.nn.backward(0)) //reward it a little for tying
      try{qpo.activeSession.update(winner)} //add to the proper tally. Will throw error in tut mode.
      catch(e){;} //don't bother adding to the proper tally in tut mode.
      if(qpo.trainingMode){this.type='training'}
      switch(this.type){ //do the right thing depending on context (type) of game
        case 'tut': { //set mode back to 'tut' and show the next tutorial scene
          qpo.mode = 'tut'
          qpo.tut.tutFuncs.enter()
          break;
        }
        case 'training': { //If in training mode, decide whether to train another game.
          qpo.trainingCounter++
          if (qpo.trainingCounter >= qpo.gamesToTrain){ // If game counter satisfied, check batch
            qpo.batchCounter++
            // var newBatch = new qpo.Batch(qpo.activeSession);
            // qpo.trainingData.push(newBatch);
            qpo.trainingData.push(new qpo.Batch(qpo.activeSession))
            console.log("we got here...")
            if (qpo.batchCounter >= qpo.batchesToTrain){ // If batch counter satisfied, exit trainingMode
              qpo.trainingMode = false
              qpo.menus["Match Complete"].open()
              for (var i=0; i<qpo.batchesToTrain; i++){ // log each batch's data to console
                console.log(qpo.trainingData[i])
              }
            }
            else { qpo.retrain() }// If batch counter not exceeded, train another batch
          }
          else { qpo.startGame([8,4]) }// If game counter not satisfied, train another game
          break
        }
        case 'campaign': { //If in campaign mode, reopen the campaign menu, with the next mission highlighted.
          qpo.menus[qpo.activeMission.chapter].open(h)
          break
        }
        default: { //We're not in tutorial, training, or campaign. Open the match complete menu
          qpo.menus["match complete"].open()
        }
      }
    }.bind(this), 2000)

    // qpo.activeGame.song.pause()
    // qpo.activeGame.song.currentTime=0
    // qpo.menuMusic()
  }

  //Start actually doing things:
  qpo.activeGame = this
  this.customScript()
  this.start()

  return this
}
