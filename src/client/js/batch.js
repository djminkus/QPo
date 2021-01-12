qpo.Batch = function(session){
  //CURRENTLY ASSUMES NEURAL IS CONTROLLING REDS,
  //  AND THAT WE WANT TO KNOW HOW OFTEN THE NEURAL WON.
  console.log("new Batch created");
  this.wins = session.blueWins;
  this.ties = session.ties;
  this.losses = session.redWins;
  this.games = session.gamesArr;
  this.arwSum = qpo.ali.nn.average_reward_window.sum;

  this.blueTot = 0;
  this.redTot = 0;
  for (var i=0; i<this.games.length; i++){ // sum scores
    this.redTot += this.games[i].redScore;
    this.blueTot += this.games[i].blueScore;
  }
  return this;
};
