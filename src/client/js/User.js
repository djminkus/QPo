qpo.randomHandle = function(){
  var handle = '',
    part1 = ['pro','noob','random','super','epic',
      'slower','rapid','dextrous','power','uber'],
    part2 = ['Arthur','Bilbo','Chris','Dave','Erin',
      'Falco','Gil','Harry','Ichiban','Jake']
  handle += part1[Math.floor(10*Math.random())]
  handle += part2[Math.floor(10*Math.random())]
  handle += Math.floor(1000*Math.random()).toString()
  return handle
}

qpo.User = function(stats){ //An entity within the ranking system. Has a name, a level, a rank, and an exp value.
  // handle is a string like "djminkus"
  // [il, ir, ix] = [initial level, initial rank, initial exp]
  try { //build user from stats obj
    stats = JSON.parse(stats)
    console.log('user ' + stats.handle + ' loaded.')
    this.handle = stats.handle
    this.level = stats.level
    this.rank = stats.rank
    this.exp = stats.exp //experience points
    this.type = stats.type //human or one of four AI types (null, random, rigid, or neural)
    this.campaignProgress = stats.campaignProgress //booleans representing completion status of each campign mission
  }
  catch(e){ //create new user.
    console.log('new user created.')
    this.handle = qpo.randomHandle()
    this.level = 0
    this.rank = 0
    this.exp = 0 //experience points
    this.type = 'human' //human or one of four AI types (null, random, rigid, or neural)
    this.campaignProgress = {'easy':[false,false,false],'medium':[false,false,false],'hard':[false,false,false]} //booleans representing completion status of each campign mission
  }

  this.levelUp = function(){this.level++}
  this.rankUp = function(){this.rank++}
  this.rankDown = function(){this.rank--}
  this.addExp = function(amt){this.exp += amt}

  this.player = null
  this.toPlayer = function(args){ //returns a newly created Player object
    this.player = new qpo.Player(args.unitList, this.handle, this.type, args.team, args.number)
    return this.player
  }
  this.minUnit = null //minimum index in
  this.maxUnit = null

  this.activeUnit = null
  this.updateActiveUnit = function(cond){
    // Cond is condition (either "move" or "death"), the reason this function's being called.
    // Deactivate the old active unit. Find the next living unit and activate it.
    // Update this.activeUnit.
    var oldAU, newAU;
    var po = qpo.activeGame.po;
    this.minUnit =  this.player.num   * qpo.activeGame.unitsPerPlayer
    this.maxUnit = (this.player.num+1)* qpo.activeGame.unitsPerPlayer - 1

    var findingUnit = true;
    var tries = 0;
    var ind = this.activeUnit.num + 1; //first index to look at
    while (findingUnit) { // keep looking until you find the new active unit.
      // debugger;
      if (ind > this.maxUnit) { ind = this.minUnit; }
      oldAU = this.activeUnit;
      newAU = qpo[this.player.team].units[ind]; //potential new active unit
      // debugger;
      //When you find the new one, deactivate the old unit, activate the new one, and update this.activeUnit.
      if ((newAU.alive) && (qpo.activeGame.isEnding == false)){ // This is our new active unit. Do stuff.
        // debugger;
        findingUnit = false; //unit has now been found. Exit the While loop after this iteration.
        this.activeUnit.deactivate();
        this.activeUnit = qpo[this.player.team].units[ind];
        this.activeUnit.activate();
        // debugger;
      }
      ind++;
      tries++;
      if (tries == qpo.activeGame.unitsPerPlayer) { // No other units are eligibile for activation. Stop looking.
        findingUnit = false;
        if(cond=='death'){this.activeUnit.deactivate()}
      }
    }
  }

  this.getStats = function(){
    return {
      'handle': this.handle,
      'level': this.level,
      'rank': this.rank,
      'exp': this.exp,
      'type': this.type,
      'campaignProgress': this.campaignProgress
    }
  }

  return this
}
