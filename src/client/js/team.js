qpo.Team = function(args){
  this.color = args.color || null; // 'red' or 'blue' (related: qpo.playerColor, qpo.unit.team)
  this.units = new Array(); //list of this team's units
  this.players = args.players || new Array(); //list of players on this team
  this.points = 0;

  this.addPoint = function(howMany){ //give this team a point and update the scoreboard
    howMany ? (this.points+=howMany) : (this.points++) //if not told how many, just add 1
    qpo.scoreboard.update()
  }

  this.addPlayer = function(player){ this.players.push(player) }
  this.addUnit = function(unit){ this.units.push(unit) }

  return this;
}
