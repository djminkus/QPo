qpo.Player = function(unitList, handle, type, team, num, neural, elo){ //Controls multiple units.
  // Exists in the context of a game.
  // Units is a list of units that will be this player's squad. Can be passed as null.
  unitList ? (this.squad = new qpo.CursorList(unitList)) : (this.squad = null); //a CursorList of units (the units this player will control)
  //active unit is reference via this.squad.selectedItem
  this.handle = handle || null; // a string
  this.type = type || null; // human or one of four AI types (null, random, rigid, or neural)
  this.team = team || null; // 'red' or 'blue' (at least for now)
  this.brain = neural || null; // the neural net that will play as this player
  this.rewardQueue = new Array();
  this.elo = elo || 45;

  this.num = num //spot on team (index within array team.players)

  this.addUnit = function(unit){ this.squad ? (this.squad.addItem(unit)) : (this.squad = new qpo.CursorList([unit])) }
  this.makeSquad = function(units){this.squad = new qpo.CursorList(units)}

  return this;
}
