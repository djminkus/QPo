qpo.Batch = function(session){
  //CURRENTLY ASSUMES NEURAL IS CONTROLLING REDS,
  //  AND THAT WE WANT TO KNOW HOW OFTEN THE NEURAL WON.
  console.log("new Batch created");
  this.wins = session.redWins;
  this.ties = session.ties;
  this.losses = session.blueWins;
  return this;
};
