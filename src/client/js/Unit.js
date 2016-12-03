c.customAttributes.inactiveUnit = function(teamColor){
  return {
    "stroke":qpo.COLOR_DICT[teamColor],
    "stroke-width": qpo.unitStroke,
    'opacity': 1
  }
}

qpo.circleAtts = function(color){ //attributes for the neutral/stay icon
  return {
    'stroke':qpo.COLOR_DICT[color],
    'stroke-width':qpo.iconStroke,
    'fill':qpo.COLOR_DICT[color],
    'r':qpo.guiDimens.squareSize/12
  }
}
qpo.shotAtts = {
  "opacity":1,
  'stroke': qpo.COLOR_DICT["green"],
  'stroke-width':2
}
qpo.scr = 2 //shot corner radius
qpo.levelTurns = [3, 5, 8, 999] //qpo.levelTurns[level-1] gives how many turns it takes to get to that level from previous level
qpo.levelSAs = ['.', '-.', '-', ''] //stroke-dasharrays for each level

qpo.Unit = function(color, gx, gy, num, player, belongs){ //DEFINE UNIT TYPE/CLASS
  // color is 'blue' or 'red' -- "Which team is the unit on?"
  // gx and gy are the initial grid values (the "spawn point", per se)
  // num is this unit's number (within its team)
  //   (For now, only blue units are numbered (6-20-15) )
  // player is the Player that owns this unit
  // belongs is a boolean -- true if this unit belongs to this client.

  var mtr = qpo.guiDimens.squareSize; //mtr for meter, meaning one 'unit' of length
  this.mtr = mtr; // side length of unit with coating
  this.inner = mtr - 6; // side length of unit without coating

  var lw = qpo.board.lw; //left wall, for convenience
  var tw = qpo.board.tw; //top wall
  var xo = lw+3 //x origin of inner rect (this.rect)
  var yo = tw+3 //y origin of inner rect

  this.team = color; //"red" or "blue"
  this.belongsToUser = belongs;
  this.player = player; //the Player that this unit belongs to

  this.x = gx; // grid position. (column number, 0 to q-1)
  this.y = gy; // grid position (row number, 0 to q-1)

  this.nx = null; //next x
  this.ny = null; //nexy y

  this.rect = c.rect(lw+3, tw+3, this.inner, this.inner).attr({
      "fill":qpo.COLOR_DICT[color],
      'fill-opacity': 0.10,
      "opacity":1,
      // 'stroke-opacity':1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width': qpo.unitStroke,
      'stroke-dasharray': qpo.levelSAs[0]
    });
  // if ( !this.belongsToUser && this.color == qpo.user.player.team){ this.rect.attr({'stroke-opacity':0.5}) }
  this.coating = c.rect(lw,tw,mtr,mtr)
    .attr({'fill':'none', 'stroke-width':2, 'stroke':'none'})
    .data('type','none')
  this.phys = c.set(this.rect, this.coating);
  this.all = c.set(this.phys)
  if(this.belongsToUser){ //make the icons and add them to the phys
    this.icons = {
      'stay': c.circle(lw + mtr/2, tw + mtr/2).attr(qpo.circleAtts(color)),
      'moveUp': qpo.arrow(lw+mtr/2, tw+mtr/2, qpo.COLOR_DICT[color], 'up'),
      'moveDown': qpo.arrow(lw+mtr/2, tw+mtr/2, qpo.COLOR_DICT[color], 'down'),
      'moveLeft': qpo.arrow(lw+mtr/2, tw+mtr/2, qpo.COLOR_DICT[color], 'left'),
      'moveRight': qpo.arrow(lw+mtr/2, tw+mtr/2, qpo.COLOR_DICT[color], 'right'),
      'shoot': c.rect(lw+mtr/2-2, tw+mtr/2-7.5, 4, 15, 2).attr({
        // "fill":qpo.COLOR_DICT['green'],
        'stroke':qpo.COLOR_DICT['green'],
        'stroke-width':2
      }),
      'bomb': c.rect(lw+mtr/2 - 5, tw+mtr/2 - 5, 10*mtr/50, 10*mtr/50, 2).attr({
        // "fill":qpo.COLOR_DICT['purple'],
        'stroke':qpo.COLOR_DICT['purple'],
        'stroke-width':3
      })
    }
    this.iconsSet = c.set(this.icons.stay, this.icons.moveUp, this.icons.moveDown, this.icons.moveLeft,
      this.icons.moveRight, this.icons.shoot, this.icons.bomb).hide()
    this.all.push(this.iconsSet)
    this.icon = this.icons.stay
    this.phys.push(this.icon)
    this.icon.show()
  } else { //a placeholder icon so the methods don't break
    this.icon = c.rect(-500,0, 1,1)
  }

  this.level = 1;
  this.turnsToNextLevel = qpo.levelTurns[0];

  this.num = num || 0; //which unit is it? (# on team)
  this.alive = true;
  this.active = false; //is it highlighted?
  this.movingForward = false; //checked when this unit fires a shot, for animation purposes
  this.willScore = false;
  this.spawnTimer = -1; //how many turns until this unit spawns? (-1 if alive)
  if (qpo.mode !== 'menu' && color == qpo.playerTeam){ // Make the spawn icon.
    var bit = qpo.guiCoords.gameBoard.width/qpo.activeGame.po;
    var six = lw + (this.num*bit) + bit/2 ; //spawn icon x center
    var siy = tw-25; //spawn icon x center
    this.spawnIcon = c.rect(six - mtr/4, siy - mtr/4, mtr/2, mtr/2).attr({
      'opacity':1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width':qpo.unitStroke*mtr/50,
      'fill':qpo.COLOR_DICT[color]
    });
    this.spawnText = c.text(six, siy, 0).attr({qpoText:[10]});
    this.spawnIconSet = c.set().push(this.spawnIcon, this.spawnText).hide();
    this.rects = c.set().push(this.rect, this.spawnIcon);
    qpo.gui.push(this.spawnIconSet);
  }

  this.rects = c.set(this.rect, this.spawnIcon);
  this.nextAction = 'stay';

  this.snap();
  try{ //record the unit's initial spawn to the game record, loading blue coords in first
    switch(color){
      case "blue": {
        qpo.activeGame.record.unitSpawns[num] = [gx,gy];
        break;
      }
      case "red": {
        qpo.activeGame.record.unitSpawns[qpo.activeGame.po + num] = [gx,gy];
        break;
      }
      default: {
        console.log("this was unexpected");
        break;
      }
    }
  }
  catch(err){;} //in menu; no active game defined, so catch the error that generates and do nothing.

  qpo.gui.push(this.phys);

  var self = this
  this.actions = {
    'moveUp' : function(){ self.move('up') }.bind(self),
    'moveRight' : function(){ self.move('right')}.bind(self),
    'moveDown' : function(){ self.move('down') }.bind(self),
    'moveLeft' : function(){ self.move('left') }.bind(self),
    'bomb' : function(){ self.bomb() }.bind(self),
    'shoot' : function(){ self.shoot() }.bind(self),
    'stay' : function(){ self.stay() }.bind(self),
    'spawn' : function(){ self.spawn() }.bind(self),
    'recharge' : function(){ self.recharge() }.bind(self)
  }

  this.kills = 0
  this.deaths = 0
  this.scores = 0

  this.nextSpawn = -1 //turn number of this unit's next spawn

  return this
}

qpo.Unit.prototype.tx = function(){return (this.mtr*this.x);}; //raphael transform, x value
qpo.Unit.prototype.ty = function(){return (this.mtr*this.y);}; //raphael transform, y value
qpo.Unit.prototype.trans = function(){return ('t'+this.tx()+','+this.ty())};
qpo.Unit.prototype.search = function(dir){ //find the first unit in direction dir
  // console.log('search begun at ind ' + this.num);
  var ind = this.num; //index (num) of found unit
  var row = this.y; //row being searched
  var col = this.x; //column being searched
  var colSep = 0; //column separation
  var rowSep = 0; //row separation
  var tries = 0;
  var looking = true;
  switch(dir){
    case 'left':
      while(looking){
        col -= 1; //move on to the next leftmost column
        if (col == -2){col=qpo.activeGame.q-1} //if off board, roll over to right end
        row = this.y; //reset row
        rowSep = 0; // and rowSep
        // console.log('looking at column ' + col);
        for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru rows
          if(Math.pow(-1,i) == -1){rowSep++;} // if i is odd, look further away, columnwise
          row = this.y + rowSep*Math.pow(-1,i); //select a row to look in
          if (row < -1 || row > qpo.activeGame.q) {row = this.y + rowSep*Math.pow(-1, i+1)} //don't allow non-rows
          for(var j=0; j<qpo.activeGame.po; j++){
            if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                (col == qpo.blue.units[j].x == -1) )
                && qpo.blue.units[j].spawnTimer < 1) {
              ind = qpo.blue.units[j].num;
              looking=false;
            } //found it!
          }
        }
        tries++;
        if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
      }
      break;
    case 'up':
      while(looking){ //iterate through rows
        row -= 1; //move on to the next upmost row
        if (row == -2){row=qpo.activeGame.q-1} //if off board, roll over to bottom
        col = this.x; //reset col
        colSep = 0; // and colSep
        // console.log('looking at row ' + row);
        for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru cols
          if(Math.pow(-1,i) == -1){colSep++;} // if i is odd, look further away, columnwise
          col = this.x + colSep*Math.pow(-1,i); //select a col to look in
          if (col < -1 || col > qpo.activeGame.q) {col = this.x + colSep*Math.pow(-1, i+1)} //don't allow non-cols
          for(var j=0; j<qpo.activeGame.po; j++){
            if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                (row == qpo.blue.units[j].x == -1) )
                && qpo.blue.units[j].spawnTimer < 1) {
              ind = qpo.blue.units[j].num;
              looking=false;
            } //found it!
          }
        }
        tries++;
        if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
      }
      break;
    case 'right':
      while(looking){
        col += 1; //move on to the next leftmost column
        if (col == qpo.activeGame.q){col = -1} //if off board, roll over to left end (spawners)
        row = this.y; //reset row
        rowSep = 0; // and rowSep
        // console.log('looking at column ' + col);
        for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru rows
          if(Math.pow(-1,i) == -1){rowSep++;} // if i is odd, look further away, columnwise
          row = this.y + rowSep*Math.pow(-1,i); //select a row to look in
          if (row < -1 || row > qpo.activeGame.q) {row = this.y + rowSep*Math.pow(-1, i+1)} //don't allow non-rows
          for(var j=0; j<qpo.activeGame.po; j++){
            if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                (col == qpo.blue.units[j].x == -1) )
                && qpo.blue.units[j].spawnTimer < 1) {
              ind = qpo.blue.units[j].num;
              looking=false;
            } //found it!
          }
        }
        tries++;
        if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
      }
      break;
    case 'down':
      while(looking){ //iterate through rows
        row += 1; //move on to the next downmost row
        if (row == qpo.activeGame.q){row = -1} //if off board, roll over to bottom
        col = this.x; //reset col
        colSep = 0; // and colSep
        // console.log('looking at row ' + row);
        for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru cols
          if(Math.pow(-1,i) == -1){colSep++;} // if i is odd, look further away, columnwise
          col = this.x + colSep*Math.pow(-1,i); //select a col to look in
          if (col < -1 || col > qpo.activeGame.q) {col = this.x + colSep*Math.pow(-1, i+1)} //don't allow non-cols
          for(var j=0; j<qpo.activeGame.po; j++){
            if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                (row == qpo.blue.units[j].x == -1) )
                && qpo.blue.units[j].spawnTimer < 1) {
              ind = qpo.blue.units[j].num;
              looking=false;
            } //found it!
          }
        }
        tries++;
        if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
      }
      break;
    default:
      console.log('HELLO FROM THE OTHER SIIIIIIIIDE');
  }
  this.deactivate();
  qpo.blue.units[ind].activate();
  // console.log('search complete, found index ' + ind)
}

qpo.Unit.prototype.ntx = function(){return this.mtr*this.nx}; //next transform x
qpo.Unit.prototype.nty = function(){return this.mtr*this.ny}; //next transform x
qpo.Unit.prototype.ntrans = function(){return ('t'+this.ntx()+','+this.nty())};

qpo.Unit.prototype.snap = function(){this.all.attr({'transform':this.trans()});} //.bind(this) if glitchy

qpo.Unit.prototype.applyCoating = function(which){
  this.coating.data('type', which);
  switch(which){ //change the color of the coating
    case 'none' : { this.coating.attr({'stroke':'none'}); break;}
    case 'shield': { this.coating.attr({'stroke':qpo.COLOR_DICT['green']}); break;}
    case 'plasma': { this.coating.attr({'stroke':qpo.COLOR_DICT['purple']}); break;}
    case 'antimatter': { this.coating.attr({'stroke':qpo.COLOR_DICT['light blue']}); break;}
    default: {console.log('SOMETHING WEIRD HAPPENED')}
  }
}

qpo.Unit.prototype.setLevel = function(newLevel){
  if (newLevel < 1){this.level = 1} //don't allow level to go below 1
  else if (newLevel > 4){this.level = 4} //don't allow level to go above 4
  else{ this.level = newLevel }

  this.turnsToNextLevel = qpo.levelTurns[this.level-1];

  this.rect.attr({'stroke-dasharray':qpo.levelSAs[this.level-1]});
  // this.rect.attr({'stroke-width':this.level});
  if(qpo.mode == 'game' && this.team == qpo.playerTeam){
    // this.team == qpo.user.player.team ? (this.notify('Lv. up!')) : (false)
    // if(!qpo.user.player.team){debugger}
    // this.notify('Lv. up!');
  }

  switch(this.level){ //apply shield or plasma coating (lvs. 3, 4)
    case 1: {this.applyCoating('none'); break;}
    case 3: { this.applyCoating('shield'); break;}
    case 4: {this.applyCoating('plasma'); break;}
    default:{ break; }
  }
}
qpo.Unit.prototype.levelUp = function(){
  var newLevel = this.level+1
  this.setLevel(newLevel)
  if(this.team==qpo.playerTeam){ //notify the player of their levelup.
    var puncs = [null, '.', '.', '!', '!!']
    this.notify("Lv. "+newLevel+puncs[newLevel])
  }
};
qpo.Unit.prototype.levelDown = function(){ this.setLevel(this.level-1) };
qpo.Unit.prototype.updateLevel = function(){
  if (this.alive) {
    this.turnsToNextLevel--;
    if (this.turnsToNextLevel<0){this.levelUp()}
  }
}

qpo.Unit.prototype.notify = function(str){
  if(this.team == qpo.playerTeam){
    var notification = c.text(this.rect.getBBox().x+this.mtr/2, this.rect.getBBox().y-15, str).attr({qpoText:[20, qpo.COLOR_DICT[this.team]]})
    qpo.gui.push(notification)
    var time = 2000
    notification.animate({'opacity':0}, 2000)
    setTimeout(function(){notification.remove()}.bind(this), 2000)
  }
}

qpo.Unit.prototype.showSpawnIcon = function(){ //change the digit and fade in the set
  this.spawnText.attr({'text':this.spawnTimer});
  this.spawnIconSet.show();
  qpo.fadeIn(this.spawnIconSet, 2000*qpo.timeScale);
}

qpo.Unit.prototype.order = function(order){ // Set this unit's icon and update its .nextAction, then update the user's active unit
  if(order == 'bomb' && this.level == 1){ false } //lv. 1 units can't bomb.
  else {
    this.setIcon(order)
    this.nextAction = order
    if (!this.alive || this.willScore){ this.icon.hide() }
    qpo.user.updateActiveUnit("move")
    var obj = new Object()
    obj.team = this.team
    obj.num = this.num
    obj.move = order
    // qpo.sendMoveToServer(obj)
  }
}
qpo.Unit.prototype.setIcon = function(order){
  if (this.belongsToUser){ //update the icon, but not for non-user units.
    this.phys.exclude(this.icon);
    // this.icon.remove(); //remove the old icon from the paper
    // var newIcon;
    // var color = qpo.COLOR_DICT[this.team];
    // switch(order){ //add the new icon
    //   case 'moveUp':
    //     newIcon = qpo.arrow(qpo.board.lw+this.mtr/2, qpo.board.tw+this.mtr/2, color, 'up');
    //     // args[3] = 'up';
    //     break;
    //   case 'moveDown':
    //     newIcon = qpo.arrow(qpo.board.lw+this.mtr/2, qpo.board.tw+this.mtr/2, color, 'down');
    //     break;
    //   case 'moveLeft':
    //     newIcon = qpo.arrow(qpo.board.lw+this.mtr/2, qpo.board.tw+this.mtr/2, color, 'left');
    //     break;
    //   case 'moveRight':
    //     newIcon = qpo.arrow(qpo.board.lw+this.mtr/2, qpo.board.tw+this.mtr/2, color, 'right');
    //     break;
    //   case 'shoot':
    //     newIcon = c.rect(qpo.board.lw+this.mtr/2-2, qpo.board.tw+this.mtr/2-7.5, 4, 15, 2).attr({
    //       // "fill":qpo.COLOR_DICT['green'],
    //       'stroke':qpo.COLOR_DICT['green'],
    //       'stroke-width':2
    //     });
    //     break;
    //   case 'bomb':
    //     newIcon = c.rect(qpo.board.lw+this.mtr/2 - 5, qpo.board.tw+this.mtr/2 - 5, 10*this.mtr/50, 10*this.mtr/50, 2).attr({
    //       // "fill":qpo.COLOR_DICT['purple'],
    //       'stroke':qpo.COLOR_DICT['purple'],
    //       'stroke-width':3,
    //     });
    //     break;
    //   case 'stay':
    //     newIcon = c.circle(qpo.board.lw+this.mtr/2, qpo.board.tw+this.mtr/2, this.mtr/10).attr(qpo.circleAtts(this.team));
    //     break;
    //   default:
    //     console.log('this was unexpected');
    //     console.log(order)
    // }
    // newIcon.attr({'transform':'t'+this.tx()+','+this.ty()});
    // this.phys.push(newIcon);
    // this.icon = newIcon;
    this.icon.hide()
    this.icon = this.icons[order]
    this.phys.push(this.icon)
    this.icon.show()
  }
}
qpo.Unit.prototype.resetIcon = function(){
  if (this.belongsToUser){ //reset the icon, but not for non-user units.
    // this.phys.exclude(this.icon);
    // this.icon.remove();
    // this.icon = c.circle(qpo.board.lw + this.mtr/2, qpo.board.tw + this.mtr/2, this.mtr/7).attr(qpo.circleAtts(this.team));
    // this.phys.push(this.icon);
    // this.snap(); //takes place of transform section because this method is only called at beginnings of turns
    this.setIcon('stay')
    if(!this.alive){ //hide the icon and show the spawn countdown
      this.icon.hide();
      if (this.team == qpo.playerTeam){this.spawnText.attr({'text':this.spawnTimer});}
    }
  }
}
qpo.Unit.prototype.randomIcon = function(){ //randomize the unit's icon (for title screen)
  var choice = Math.floor(7*Math.random());
  this.setIcon(qpo.moves[choice]);
}
qpo.Unit.prototype.activate = function(){ // Highlight (with animation)
  if(this.alive){ // Only works if unit is alive.
    if(qpo.user.activeUnit){qpo.user.activeUnit.deactivate()} //make sure to deactivate old active unit

    var pinchEls = qpo.pinch(this.rect);
    this.turnOrange = setTimeout(function(){this.rects.attr({"stroke":qpo.COLOR_DICT["orange"]})}.bind(this), 50);
    setTimeout(function(){pinchEls.remove()}.bind(this), 50);

    this.phys.toFront();
    this.active = true;
    qpo.user.activeUnit = this;
  } else { console.log("Oops... you tried to activate a dead unit.")}
}
qpo.Unit.prototype.deactivate = function(){
  clearTimeout(this.turnOrange);
  if(this.team == qpo.playerTeam){ this.rects.attr({inactiveUnit:this.team}); }
  else { this.rect.attr({inactiveUnit:this.team}); }
  this.active = false;
  qpo.user.activeUnit = null;
}

qpo.Unit.prototype.score = function(why){
  // console.log('scored via ' + why + ' on turn ' + qpo.activeGame.turnNumber);
  this.alive = false
  this.willScore = false
  this.scores++
  this.deactivate()
  if(qpo.activeGame.type == 'campaign' && qpo.activeMission.number==1){ qpo.activeMission.end(true) }
  else{ // set spawn timer, show spawn icon, update scoreboard, end game if necessary
    this.spawnTimer = qpo.spawnTimers[qpo.activeGame.unitsPerPlayer]
    if (this.team==qpo.playerTeam){this.showSpawnIcon()}
    if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, and ending game
      qpo[this.team].addPoint()
      switch(this.team){ // update scoreboard, prep to reward AI
        case qpo.otherTeam: //enemy team ("red" until server implementation)
          qpo.redRewardQueue.push(-1) //is this backwards?
          break
        case qpo.playerTeam: //player team ("blue" until server implementation)
          qpo.redRewardQueue.push(1) //is this backwards?
          if(this.active){qpo.updateBlueAU(qpo.activeGame.po)}
          break
      }
      if (qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin  //if score limit reached, disable respawn
        || qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin){
        qpo.activeGame.respawnEnabled = false
      }
      if (qpo.activeGame.type != 'elimination') { this.nextAction = 'recharge' } //start counting down spawn timer
      else if (qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
        || qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
        var winner
        setTimeout(function(){ //set winner to "tie","blue",or "red" (after 20 ms to account for performance issues)
          if(qpo.scoreboard.redScore==qpo.scoreboard.blueScore){
            winner = "tie"
          } else if (qpo.scoreboard.blueScore > qpo.scoreboard.redScore) {
            winner = "blue"
          } else {
            winner = "red"
          }
        }, 2000*qpo.timeScale)
        qpo.activeGame.isEnding = true
        setTimeout(function(){qpo.activeGame.end(winner)}, 2000*qpo.timeScale);
      }
    }
  }
  this.phys.animate({"opacity":0}, 2000*qpo.timeScale)
  setTimeout(function(){ //hide the visage and move it "off the board"
    this.phys.hide()
    this.x = -1
    this.y = -1
    this.phys.attr({'opacity':1, 'transform':this.trans()})
    this.setLevel(1)
  }.bind(this), 2000*qpo.timeScale)
}
qpo.Unit.prototype.kill = function(why){
  this.deaths++;
  this.alive = false;
  this.willScore = false;
  if(this.active){ qpo.user.updateActiveUnit('death') }
  this.applyCoating('none');
  this.spawnTimer = qpo.spawnTimers[qpo.activeGame.unitsPerPlayer];
  if(this.team==qpo.playerTeam){ this.showSpawnIcon(); }
  this.icon.attr({'opacity':0});
  this.phys.stop();
  this.phys.animate({ "opacity":0 }, 2000*qpo.timeScale);
  this.rect.animate({ 'height':0, 'width':0 , 'x':qpo.board.lw+this.mtr/2, 'y':qpo.board.tw+this.mtr/2}, 2000*qpo.timeScale)
  setTimeout(function(){ //hide the visage and move it "off the board"
    this.phys.hide();
    this.x = -1;
    this.y = -1;
    this.phys.attr({'opacity':1, 'transform':this.trans()});
    // this.icon.attr({'opacity': 1}) //tried 
    this.setLevel(1);
  }.bind(this), 2000);
  if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, and ending game
    if(this.team=='blue'){qpo.red.addPoint()}
    else{qpo.blue.addPoint()}
    switch(this.team){ //prep to reward AI, and update blue AU if necessary
      case qpo.otherTeam: //enemy team ("red" until server implementation)
        qpo.redRewardQueue.push(1); //is this backwards?
        break;
      case qpo.playerTeam: //player team ("blue" until server implementation)
        var number = this.num;
        qpo.redRewardQueue.push(-1); //is this backwards?
        if (this.active){qpo.updateBlueAU(qpo.activeGame.po);}
        break;
    }
    if (qpo.activeGame.type != 'elimination') { this.nextAction = 'recharge' }
    else if (qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
      || qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
      var winner;
      setTimeout(function(){ //set winner to "tie","blue",or "red" (after 20 ms to account for performance issues)
        if(qpo.scoreboard.redScore==qpo.scoreboard.blueScore){
          winner = "tie";
        } else if (qpo.scoreboard.blueScore > qpo.scoreboard.redScore) {
          winner = "blue";
        } else {
          winner = "red";
        }
      }, 2000*qpo.timeScale);
      qpo.activeGame.isEnding = true;
      setTimeout(function(){qpo.activeGame.end(winner);}, 2000*qpo.timeScale);
    }
  }
}
qpo.Unit.prototype.recordMove = function(move){
  switch(this.team){ //record the move (in qpo.activeGame.record)
    case "blue": {
      qpo.activeGame.record.blueMoves.push(move);
      break;
    }
    case "red": {
      qpo.activeGame.record.redMoves.push(move);
      break;
    }
    default: { "this was unexpected"; }
  }
}

qpo.Unit.prototype.move = function(dir){
  switch(dir){ //adjust this.x and this.y, accounting for walls and grid position
    case 'up':{
      if (this.y == 0){ //check if red, and if so, score.
        if (this.team == 'red'){
          this.y = -1
          this.score()
        }
      }
      else { this.y -= 1 }
      break;}
    case 'right':{
      if (this.x != qpo.activeGame.q-1){ this.x += 1 }
      break;}
    case 'down':{
      if (this.y == qpo.activeGame.q-1){ //bottom wall: score blue.
        if (this.team == 'blue'){ //score
          this.y = qpo.activeGame.q
          this.score()
        }
      }
      else { this.y += 1  }
      break}
    case 'left':{
      if (this.x != 0) { this.x -= 1 }
      break}
    default:{
      console.log('RED ALERT')
    }
  }
  this.all.animate({'transform':this.trans()}, 3000*qpo.timeScale, '>'); //move that son of a gun
  if ((dir == 'up' && this.team == 'red') || (dir=='down' && this.team =='blue')) {this.movingForward = true;}
  else {this.movingForward = false;}
  this.recordMove(dir);
}
qpo.Unit.prototype.bomb = function(){
  this.movingForward = false
  if(this.level<2){this.notify('Level too low.')} //units below level 2 can't bomb.
  else{ //fire a bomb
    var bomb;
    bomb = new qpo.Bomb(this);
    bomb.next();
    if(qpo.mode=="menu"){ //put the bomb's phys in the correct layer
      bomb.phys.toBack();
      try{qpo.menus.main.blackness.toBack();}
      catch(e){}
      try{qpo.menus.title.blackness.toBack();}
      catch(e){}
    }
    else{this.recordMove(5)}
  }
}
qpo.Unit.prototype.shoot = function(){
  this.movingForward = false;
  var width = 4;
  var height = 20;
  var speed = 4; // in boxes per turn
  var lw = qpo.board.lw;
  var tw = qpo.board.tw;
  var shot, anim;
  switch(this.team){ //create the shot and the correct animation based on if the unit is moving forward
    case "blue":
      shot = c.rect(lw+this.x*this.mtr + this.mtr*(25-width/2)/50,
                    tw+this.y*this.mtr + this.mtr + 2*this.mtr/50,
                    this.mtr*width/50, this.mtr*2/50, qpo.scr);
      anim = Raphael.animation({"height":height*this.mtr/50}, 500*qpo.timeScale,
        function(){ shot.animate({"y": shot.attr('y') + speed*this.mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);}.bind(this)
      );
      if (this.movingForward){
        anim = Raphael.animation({"height":height*this.mtr/50, "y": shot.attr('y') + this.mtr/6 + 10*this.mtr/50}, 500*qpo.timeScale,
          function(){ shot.animate({"y": shot.attr('y') + speed*this.mtr*qpo.activeGame.q},
            3000*qpo.activeGame.q*qpo.timeScale); //make the shot move at 2.5 units per turn
        });
      }
      break;
    case "red":
      shot = c.rect(lw+this.x*this.mtr + this.mtr*(25-width/2)/50,
                    tw+this.y*this.mtr - this.mtr*4/50,
                    this.mtr*width/50, this.mtr*2/50, qpo.scr);
      anim = Raphael.animation({"height":height*this.mtr/50, "y": shot.attr('y') - 0.5*this.mtr}, 500*qpo.timeScale,
        function(){
          shot.animate({"y": shot.attr('y') - speed*this.mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
        }.bind(this)
      );
      if (this.movingForward){
        anim = Raphael.animation({"height":height*this.mtr/50, "y": shot.attr('y') - height*this.mtr/50 - this.mtr/6 - 10*this.mtr/50}, 500*qpo.timeScale,
          function(){
            shot.animate({"y": shot.attr('y') - speed*this.mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
          }
        );
      }
      break;
  }
  shot.attr(qpo.shotAtts);
  shot.data("team",this.team); //make it remember which team fired it
  shot.data('unit',this) //and even which unit fired it
  shot.animate(anim);
  qpo.gui.push(shot);
  qpo.shots.push(shot);
  this.recordMove(6);
}
qpo.Unit.prototype.stay = function(){
  this.rect.stop()
  this.recordMove(7)
}
qpo.Unit.prototype.spawn = function(){ //call this at the moment you want a new unit to spawn
  this.spawnTimer = -1;
  var spawnLoc = qpo.findSpawn(this.team); //get the [row, column] for the spawn (loc is location)
  this.x = spawnLoc[1]; //update the grid positions, for qpo.snap
  this.y = spawnLoc[0]; //update the grid positions, for qpo.snap
  this.snap();
  this.phys.show();
  this.phys.attr({'opacity':1});
  this.rect.attr({ 'height':this.inner, 'width':this.inner, 'x': qpo.board.lw + 3, 'y':qpo.board.tw + 3});
  if(this.spawnIconSet){this.spawnIconSet.hide();}
  this.alive = true;
  if(!qpo.user.activeUnit && this.belongsToUser){this.activate()}
};
qpo.Unit.prototype.recharge = function(){ //count down spawn timer and, if needed, queue spawn
  this.spawnTimer--;
  if(this.spawnTimer==0){this.nextAction='spawn'};
}

qpo.Unit.prototype.generateMove = function(){ //set this.nextAction to a string generated by AI
  var generatedMove = '';
  switch(this.player.type){ //generate a move using random, rigid, neural, or null AI
    case "random": {
      generatedMove = qpo.moves[Math.round(Math.random()*6)];
      while (generatedMove == 'bomb' && this.level == 1){generatedMove = qpo.moves[Math.round(Math.random()*6)];}
      break;
    }
    case "rigid": { generatedMove = qpo.findMove(this); break; }
    case "neural": {
      qpo.inputForNeural[217] = this.num-0.5-(qpo.activeGame.po/2); //generate a zero-mean input representing chosen unit
      var action = qpo.ali.nn.forward(qpo.inputForNeural); // Have the AI net generate a move (integer)
      generatedMove = qpo.actions[action]; //get the proper string
      break;
    }
    case 'null' : { //just stay.
      generatedMove = 'stay';
      break;
    }
    default: { console.log("this was unexpected"); break; }
  }
  if(this.alive){this.nextAction = generatedMove} //don't go through with it if unit is dead.
}
qpo.Unit.prototype.executeMove = function(){ //call the function named in this.nextAction
  this.actions[this.nextAction]();
  if(this.alive){this.nextAction = 'stay';}
}
