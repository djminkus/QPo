qpo.randomHandle = function(){  //Generate a random handle and return it as a string.
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

qpo.User = function(stats){ //An entity within the ranking system.
  // username is a string like "djminkus"
  try { //build user from stats obj
    if (typeof stats === 'string' ) {stats = JSON.parse(stats)} //else it's already an obj
    // console.log(typeof stats)
    this.username = stats.username
    this.level = stats.level
    this.onePoRank = stats.onePoRank || 1
    this.twoPoRank = stats.twoPoRank || 1.01
    this.type = stats.type //human or one of four AI types (null, random, rigid, or neural)
    this.tutDone = stats.tutDone //booleans representing completion status of each campign mission
    this.elo = stats.elo || 100
    this.musicVol = stats.musicVol
    console.log('user ' + this.username + ' loaded.')
    qpo.menuSong.volume = this.musicVol
  }
  catch(e){ //create new user.
    console.log('new user created.')
    this.username = qpo.randomHandle()
    this.level = 0
    this.onePoRank = 1
    this.twoPoRank = 2
    this.type = 'human' //human or one of four AI types (null, random, rigid, or neural)
    this.tutDone = false
    this.elo = 100
  }



  this.levelUp = function(amt){this.level+=amt}
  this.onePoAdjust = function(amt){this.onePoRank+=amt}
  this.twoPoAdjust = function(amt){this.twoPoRank+=amt}
  this.eloAdjust = function(amt){this.elo += amt}

  this.post = function(what){
    // "what" arg: the name of the key of the value to update in the database
    // ex. to update elo, pass "elo" to this function
    var statsObj = this.getStats()
    $.post('/user', {'what': what, 'user': statsObj}, function(data, status){
      console.log('callback 12345 executed (stats sent to server?)')
    })
  }

  this.player = null
  this.toPlayer = function(args){ //returns a newly created Player object
    this.player = new qpo.Player(args.unitList, this.username, this.type, args.team, args.number, this.elo)
    return this.player
  }
  this.minUnit = null
  this.maxUnit = null

  this.activeUnit = null
  this.updateActiveUnit = function(cond){
    // Cond is condition (either "move" or "death"), the reason this function's being called.
    // Deactivate the old active unit. Find the next living unit and activate it.
    // Update this.activeUnit.
    var oldAU, newAU;
    var po = qpo.activeGame.po
    this.minUnit =  this.player.num   * qpo.activeGame.unitsPerPlayer
    this.maxUnit = (this.player.num+1)* qpo.activeGame.unitsPerPlayer - 1

    var findingUnit = true
    var tries = 0
    var ind = this.activeUnit.num + 1 //first index to look at
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
      'username': this.username,
      'level': this.level,
      'onePoRank': this.onePoRank,
      'twoPoRank': this.twoPoRank,
      'type': this.type,
      'tutDone': this.tutDone,
      'elo': this.elo
    }
  }

  return this
}
