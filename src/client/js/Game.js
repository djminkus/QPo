qpo.Game = function(args){ //"Game" class.
  //{q, po, type, turns, ppt, customScript, teams}
  qpo.mode = 'game'
  this.songURL = "./timekeeper-main.mp3"

  // Do these do anything? 10/13/20
  // Not found in qpo.js 6/28/21
  qpo.scr = (qpo.trainingMode ? null : 2) // Shot corner radius
  qpo.BCR = (qpo.trainingMode ? null : 2) // Bomb corner radius

  if (args != undefined) { // Assign args to properties of 'this' (or set defaults)
    //Grab the arguments (and fill in missing ones with default values):
    this.q = args.q || 7 // Number of rows, columns on the board
    this.po = args.po || 3 // Number of units on each team
    this.type = args.type || 'single' //What kind of game is this? (tutorial, single, multi, campaign, training, testing)
    this.turns = (args.turns || 95) //How many turns does this game consist of?
    this.ppt = args.ppt || 1 //players per team
    this.customScript = args.customScript || function(){}
    this.teams = { //instantiate red and blue teams
      'red': new qpo.Team({'color':'red', 'players': args.redPlayers}),
      'blue': new qpo.Team({'color':'blue', 'players': args.bluePlayers})
    }
  }
  else { // No args, start a 2-po game against CPU
    this.q = 7
    this.po = 2
    this.type = 'single'
    this.turns = 3
    this.ppt = 1
    this.customScript = function(){}
    this.teams = {
      'red': new qpo.Team({'color':'red'}),
      'blue': new qpo.Team({'color':'blue', 'players': [qpo.user.toPlayer({'team':'blue', 'number': 0})] })
    }
  }

  // DO SOME THINGS WITH THE ARGS:
  qpo.red = this.teams.red //convenient pointer
  qpo.blue = this.teams.blue //convenient pointer

  this.scoreToWin = 10*this.po
  this.unitsPerPlayer = this.po/this.ppt

  qpo.currentSettings = {'q':this.q, 'po': this.po, 'type':this.type,
    'turns':this.turns, 'ppt': this.ppt, 'customScript':this.customScript}

  qpo.guiDimens.squareSize = 350/this.q   //aim to keep width of board at 7*50 (350). So, qpo.guiDimens.squareSize = 350/q.
  qpo.bombSize = 2 * qpo.guiDimens.squareSize
  this.scaling = qpo.guiDimens.squareSize/50 // Visual scaling

  const RIGID_AI_ELO = 500

  for(var i=0; i<this.ppt; i++){ //fill empty player slots with computer players
    if(typeof qpo.red.players[i] != 'object'){qpo.red.players[i] = new qpo.Player(null, 'Riggy'+i, 'rigid', 'red', i, RIGID_AI_ELO)}
    if(typeof qpo.blue.players[i] != 'object'){qpo.blue.players[i] = new qpo.Player(null, 'Riggy'+i, 'rigid', 'blue', i, RIGID_AI_ELO)}
  }
  qpo.user.minUnit = qpo.user.player.num   * this.po
  qpo.user.maxUnit =(qpo.user.player.num+1)* this.po - 1
  // var player1 = (qpo.user.player || qpo.aliP)
  // qpo.user.minUnit = player1.num * this.po
  // qpo.user.maxUnit =(player1.num + 1) * this.po - 1

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
  this.getState = function(){ // Returns an array representing, ideally, the totality of the game's state
    var arr = new Array() // Will contain 216 entries for 4-po game.
    //  We'll format the array properly later. Let's start with the raw values.
    for (var i=0; i<this.po; i++){
      //principle: keep coords of same obj together

      // 16 qpo-grid coords of units (4 per po--red/blue x/y):
      if(qpo.blue.units[i].alive){ //0-7: blue x,y
        arr[2*i] = qpo.blue.units[i].x / qpo.board.cols //values from 0 to (q-1)
        arr[2*i + 1] = qpo.blue.units[i].y / qpo.board.rows
      }
      else { // -1 if dead
        arr[2*i] = -1
        arr[2*i + 1] = -1
      }
      if(qpo.red.units[i].alive){ //8-15: red x,y
        arr[2*qpo.activeGame.po + 2*i] = qpo.red.units[i].x / qpo.board.cols
        arr[2*qpo.activeGame.po + 2*i + 1] = qpo.red.units[i].y / qpo.board.rows
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
          //3 things per shot.
          arr[15 + one70] = qpo.shots[zero23].data('xLoc') / qpo.board.cols
          arr[15 + one70 + 1] = qpo.shots[zero23].data('yLoc') / qpo.board.rows
          if (qpo.shots[zero23].data("team")=="blue"){ arr[15 + one70 + 2] = 0.25 }
          else { arr[15 + one70 + 2] = .75 }
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
        if(qpo.bombs[zero31]) { //if bomb exists, load real values
          //4 things per bomb.
          arr[15 + 72 + one125] = qpo.bombs[zero31].x / qpo.board.cols
          arr[15 + 72 + one125 + 1] = qpo.bombs[zero31].y / qpo.board.rows
          if (qpo.bombs[zero31].team == "blue"){ arr[15 + 72 + one125 + 2] = 0.25 }
          else { arr[15 + 72 + one125 + 2] = .75 }
          arr[15 + 72 + one125 + 3] = qpo.bombs[zero31].timer
        }
        else { // load -1,-1,0,-1 if bomb doesn't exist
          arr[15 + 72 + one125] = -1
          arr[15 + 72 + one125 + 1] = -1
          arr[15 + 72 + one125 + 2] = 0
          arr[15 + 72 + one125 + 3] = -1
        }
      }
    }
    // arr[216] = Date.now()  // Why did I include this?
    arr[216] = 0.0001 // to prevent array from being clipped

    //fill empty slots with 0s:
    for(var i=0; i<arr.length; i++){
      if (arr[i] == undefined || isNaN(arr[i]) || arr[i]==null) {arr[i]=0}}
    return arr
  };

  this.prep = function(){ //show the pregame screen.
    // $("#raphContainer").attr('style', 'display: block; float: none; margin: auto;')
    // $("#raphContainer2").attr('style','display: block; width: 0px; float: none')
    // qpo.user.leveller.all.remove()
    // qpo.user.leveller = null
    // qpo.viewToggler.toggle()

    qpo.menuSong.pause();
    qpo.menuSong.currentTime = 0;
    qpo.makeMuteButton()
    qpo.gui.push(qpo.muteButton);

    this.bluePrepElements = c.set()
    this.redPrepElements = c.set()

    for (var i=0; i<this.ppt; i++){
      this.bluePrepElements.push(c.text(c.width/2, 100+40*i, qpo.blue.players[i].handle))
      this.redPrepElements.push(c.text(c.width/2, 400+40*i, qpo.red.players[i].handle))
    }

    //center each group of text elements in the proper location:
    var box = this.bluePrepElements.getBBox()
    var adj = c.height/4 - (box.y + box.height/2)
    // var transformString = 't0,'+adj
    this.bluePrepElements.attr({'transform':('t0,'+adj)})
    box = this.redPrepElements.getBBox()
    adj = c.height*3/4 - (box.y + box.height/2)
    // transformString = 't0,'+adj
    this.redPrepElements.attr({'transform':('t0,'+adj)})

    this.bluePrepElements.attr({qpoText:[30, qpo.COLOR_DICT['blue']]})
    this.redPrepElements.attr({qpoText:[30, qpo.COLOR_DICT['red']]})

    this.vs = c.text(c.width/2, c.height/2, 'vs.').attr({qpoText:30})

    this.prepElements = c.set(this.vs, this.bluePrepElements, this.redPrepElements)
    qpo.fadeIn(this.prepElements, 1000)
    setTimeout(function(){ //after 3 seconds, fade out prep elements and start the game
      qpo.fadeOut(this.prepElements, function(){ //start the game once the prep elements are faded out
        this.start()
      }.bind(this), 1000)
    }.bind(this), 3000)
  }
  this.start = function(){
    // Draw the board, clear the arrays, place the units and start the game

    if(qpo.playMusic == true){ // stop menu song and play game song. (implement when game song acquired)
      try { this.song.remove() } //try removing the previously existing song
      catch(err) { ; } //if error is thrown, probably doesn't exist, do nothing
      //MAKE MUSIC (unless in tutorial mode)
      if (this.type != 'tutorial'){
        this.song = new Audio(this.songURL);
        this.song = qpo.user.musicVol;
        setTimeout(function(){this.song.play();}.bind(this), 1500);
        console.log("playing game music in 1.5 seconds...");
      }
    }

    qpo.mode = 'game'
    qpo.units = new Array()
    qpo.shots = new Array()
    qpo.bombs = new Array()

    this.drawGUI(this.xAdj, this.yAdj)
    var GUI_TIME = 1500
    setTimeout(function(){ // After 1500 ms, make the units and capture initial state
      qpo.makeUnits() // puts the units on the board (with 1000 ms fade-in)
      this.state = this.getState()
    }.bind(this), GUI_TIME)

    setTimeout(function(){qpo.board.notify('3')}, 1500+GUI_TIME)
    setTimeout(function(){qpo.board.notify('2')}, 3000+GUI_TIME)
    setTimeout(function(){qpo.board.notify('1')}, 4500+GUI_TIME)
    // setTimeout(function(){qpo.board.notify('Go')}, 3000)

    setTimeout(function(){ // After 6000 ms, activate user's first unit in prep for game and flash it three times
      qpo.user.player.squad.list[0].activate()
      setTimeout(function(){qpo.blue.units[0].deactivate()}, 100)
      setTimeout(function(){qpo.blue.units[0].activate()},   200)
      setTimeout(function(){qpo.blue.units[0].deactivate()}, 300)
      setTimeout(function(){qpo.blue.units[0].activate()},   400)
    }.bind(this), 4500+GUI_TIME)

    setTimeout(function(){ //After 7500 ms, start the game in earnest: Set up the newTurn interval, and the collision detection
      qpo.turnStarter = setInterval(this.newTurn.bind(this), 3000*qpo.timeScale)
      this.board.flash(true, false)
      // setTimeout(function(){this.board.flash()}.bind(this), 3000*qpo.timeScale-qpo.flashLengths.flash);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50)
    }.bind(this), 6000+GUI_TIME)

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

    setTimeout(function(){ //update board state, generate the demerits arrays, and make all units spawn-ready
      qpo.board.updateState.call(qpo.board) // does not involve Game.getState
      var demerits = {
        'blue' : qpo.board.findDemerits.call(qpo.board, 'blue'),
        'red' : qpo.board.findDemerits.call(qpo.board, 'red')
      }
      for (var i=0; i<qpo.units.length; i++){
        if(qpo.units[i].spawnTimer == 0) {qpo.units[i].findSpawn(demerits[qpo.units[i].team])}
      }
    }, 7/8 * 3000 * qpo.timeScale)

    qpo.moment = new Date()

    //// AI SECTION
    // REWARD
    // Record reward events that happened this turn:
    // === old weird logic ===
    // qpo.sixty.list[qpo.sixty.cursor] = qpo.redRewardQueue.reduce(qpo.add, 0) //sum the queue and load result into the cursorlist
    // qpo.sixty.cursor = (qpo.sixty.cursor == 59) ? 0 : (qpo.sixty.cursor + 1) //cycle the cursor
    // qpo.redRewardQueue = [] //clear the queue
    // === end old weird ===
    // Each turn, reward AIs for favorable events, and convert the game state to inputs for the neural nets:
    for(var i=0, player; i<qpo.red.players.length; i++){ // do reward propagation logic for each player
      player = qpo.red.players[i]
      if (player.type == 'neural'){ // Try to reward...
        try {
          var reward = player.rewardQueue.reduce(qpo.add, 0)
          // console.log('reward: ' + reward)
          player.brain.backward(reward)
          qpo.netsChanged = true;
          player.rewardQueue = [] //clear the reward queue
        }
        catch(err){ // ...but will fail if no actions have been taken
          // console.log("Can't train without having acted, or...");
          console.log(err)
        }
      }
      player = qpo.blue.players[i]
      if (player.type == 'neural'){ // Try to reward...
        try{
          var reward = player.rewardQueue.reduce(qpo.add, 0)
          // console.log('reward: ' + reward)
          player.brain.backward(reward)
          qpo.netsChanged = true;
          player.rewardQueue = [] //clear the reward queue
        }
        catch(err){ // ...but will fail if no actions have been taken
          // console.log("Can't train without having acted, or...");
          console.log(err)
        }
      }
    }
    // === MORE old weird ===
    // try{qpo.ali.nn.backward(qpo.sixty.list.reduce(qpo.add, 0))}  // Try to reward...
    // catch(err){console.log("Can't train without having acted.")} // ...but will fail if no actions have been taken

    // PREPARE STATE
    // Manage the game state variables and get input array for nn:
    this.prevState = this.state
    this.state = this.getState()
    // qpo.inputForNeural = qpo.convertStateToInputs(this.state) //used before modifying getState() on Nov 30 2020
    qpo.inputForNeural = this.state

    // Check for NaNs in value net, and make a backup every 17 turns:
    try {
      if (this.turnNumber % 16 == 0){ //back up the value net every so often
        qpo.ali.backup = JSON.stringify(qpo.ali.nn.value_net);
        console.log("Ali's value net was backed up. ")
      }
      if(Object.is(qpo.ali.nn.value_net.layers[0]['in_act']['dw'][0], NaN)) {
        console.log('NaN issue. Restoring value net from backup. ');
        qpo.debugit = true;
        // qpo.ali.nn.value_net = JSON.parse(JSON.stringify(qpo.ali.backup));
        qpo.ali.nn.value_net.fromJSON(JSON.parse(qpo.ali.backup));
      }
      if(Object.is(qpo.ali.nn.value_net.layers[6]['out_act']['w'][0], NaN)) {
        console.log('NaN issue 2.') // This shouldn't happen after backup.
      }
    }
    catch(e){console.log(e)}

    //// MOVE GENERATION/EXECUTION SECTION
    if(this.turnNumber != this.turns){ //unless it's the end of the game, generate and execute moves.
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
    }

    var shot, i
    for(i=0; i<qpo.shots.length; i++){ //update shot locations
      shot = qpo.shots[i]
      if(shot.data('team') ==  'blue') { shot.data('yLoc', shot.data('yLoc')+qpo.SHOT_SPEED) }
      else { shot.data('yLoc', shot.data('yLoc')-qpo.SHOT_SPEED) }
    }

    if(this.turnNumber == this.turns-1){ // Prepare to end the game. Set a timeout to call Game.end().
      if (this.isEnding == false){ //prevent further input
        qpo.blueActiveUnit = 50
        qpo.redActiveUnit = 50
        for(var i=0; i<qpo.blue.units.length; i++){
          qpo.blue.units[i].deactivate()
          qpo.red.units[i].deactivate()
        }
        this.isEnding = true
        setTimeout(function(){qpo.activeGame.end()}, 3000*qpo.timeScale)
        this.board.flash(false, true)
      }
    }
    else { this.board.flash(false, false)}
  }
  this.end = function(){ // Clear GUI, reset arrays, update ELO.
    var winner
    if (qpo.scoreboard.redScore == qpo.scoreboard.blueScore) { winner = "tie" }
    else if (qpo.scoreboard.redScore > qpo.scoreboard.blueScore) { winner = "red" }
    else { winner = "blue" }

    qpo.user.activeUnit = null
    clearInterval(qpo.clockUpdater)
    clearInterval(qpo.collisionDetector)
    clearInterval(qpo.turnStarter)
    clearInterval(qpo.flashTimeout)

    // Start playing the menu song again after a few seconds
    setTimeout(function(){
      qpo.menuSong.currentTime = 0;
      qpo.menuSong.play();
    }, 5000)

    qpo.gui.stop()
    qpo.gui.exclude(qpo.scoreboard.all)
    qpo.gui.animate({'opacity':0}, 2000, 'linear')
    qpo.scoreboard.gameEnd() //move the text down, make the bits, and stuff
    qpo.fadeOutGlow(qpo.glows, function(){ //clear GUI, reset arrays, and bring up the next screen
      qpo.shots = []
      qpo.bombs = []
      qpo.units = [];
      // (winner == "red") ? (qpo.ali.nn.value_net.backward(2)) : (qpo.ali.nn.value_net.backward(0)) //reward AI for winning, not losing
      // (winner == "tie") ? (qpo.ali.nn.value_net.backward(1)) : (qpo.ali.nn.value_net.backward(0)) //reward it a little for tying
      try{qpo.activeSession.update(winner, qpo.scoreboard.blueScore, qpo.scoreboard.redScore)} //add to the proper tally. Will throw error in tut mode.
      catch(e){;} //don't bother adding to the proper tally in tut mode.

      setTimeout(function(){ // Clear the qpo gui, update ELO, and display menu or start another game
        qpo.gui.clear()

        qpo.gui.push(qpo.scoreboard.all)

        if(qpo.trainingMode){this.type='training'}
        switch(this.type){ // Display menu or start another game
          case 'tutorial': {
            qpo.menus["main menu"].open(1)
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
            else {  // If game counter not satisfied, train another game
              // qpo.startGame([8,4])
              qpo.activeGame = new qpo.Game({
                'q':8,
                'po':4,
                'type':'training',
                'ppt':2,
                'bluePlayers': [qpo.aliP, qpo.bryanP],
                'redPlayers':[qpo.calebP, qpo.daltonP]
              })
            }
            break
          }
          case 'testing': { //If in testing mode, decide whether to test another game.
            qpo.testingCounter++
            console.log('tested game ' + qpo.testingCounter + ' out of ' +
              qpo.gamesToTest + "; winner was " + winner + ";, score was " +
              qpo.scoreboard.blueScore + '-' + qpo.scoreboard.redScore)
            if (qpo.testingCounter >= qpo.gamesToTest){ // If game counter satisfied, check batch counter
              qpo.batchCounter++
              var batch = new qpo.Batch(qpo.activeSession)
              qpo.saveSend('ali', true, true) // Save/send the neural net after each batch.
              qpo.testingData.push(batch)
              console.log('Batch ' + qpo.batchCounter + ' completed.')
              console.log(batch)
              if (qpo.batchCounter >= qpo.batchesToTest){ // If batch counter satisfied, exit testingMode
                qpo.testingMode = false
                for (var i=0; i<qpo.batchesToTest; i++){ // log the batch's data to console
                  console.log(qpo.testingData[i])
                }
                qpo.menus["match complete"].open();
              }
              else { qpo.retest() }// If batch counter not exceeded, test another batch (reset testingCounter)
            }
            else {  // If game counter not satisfied, test another game
              // qpo.activeGame = new qpo.Game({
              //   'q':8,
              //   'po':4,
              //   'type':'testing',
              //   'ppt':2,
              //   'bluePlayers': [qpo.aliP, qpo.bryanP],
              //   'redPlayers':[new qpo.Player(null, 'Rigid 1', qpo.testOpponent, 'red', 0),
              //                 new qpo.Player(null, 'Rigid 2', qpo.testOpponent, 'red', 1)]
              // })
              qpo.activeGame = new qpo.Game({
                'q':6,
                'po':2,
                'type':'testing',
                'ppt':1,
                'bluePlayers': [qpo.aliP],
                'redPlayers':[new qpo.Player(null, qpo.testOpponentName, qpo.testOpponent, 'red', 0)]
              });
            }
            break
          }
          case 'campaign': { //If in campaign mode, reopen the campaign menu, with the next mission highlighted.
            qpo.menus[qpo.activeMission.chapter].open(qpo.activeMission.number)
            break
          }
          default: { //We're not in tutorial, training, or campaign. Open the match complete menu, update ELOs.
            qpo.menus["match complete"].open()

            //ELO section. A is blue, B is red. (Sorry.)
            // Assumes three computer players and one human player. Finds adjustment for human's elo.
            var p_A = qpo.scoreboard.blueScore // blue team's points
            var p_B = qpo.scoreboard.redScore  // red team's points
            var S_A = p_A / (p_A + p_B)   // "score" of blue team in elo terms.
            var R_A = this.teams.blue.elo // elo of blue team.
            var R_B = this.teams.red.elo // elo of red team.
            var SCORE_FACTOR = 400;
            var E_A = 1 / (1 + 10 ** ((R_B - R_A) / SCORE_FACTOR));
            var k = 32 * 6
            var elo_correction = k * (S_A - E_A)

            qpo.user.eloAdjust(elo_correction);
            qpo.menus['main menu'].doodad.updateLevel();
          }
        }
      }.bind(this), 2000)
    }.bind(this), 2000)

    // qpo.activeGame.song.pause()
    // qpo.activeGame.song.currentTime=0
    // qpo.menuMusic()
  }

  // Start actually doing things:
  qpo.activeGame = this
  this.customScript()

  if(this.type=='tutorial'){ this.start() }
  else { this.prep() } //initialize it with pregame screen.

  return this
}
