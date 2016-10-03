// 'rigid' AI.

/* WAYS TO IMPROVE AI:
Move back instead of left/right if shot is too close to avoid
Don't fire a bomb if too close to a wall
*/

qpo.findMove = function(unit){ // returns a string representing the move to be executed
                         //   by the computer player's unit in question.
  var chosenMove = null;
  var movesList = ["moveLeft","moveUp","moveRight","moveDown","bomb","shoot","stay"]; //different order than "qpo.moves", unfortunately
    //used at the end to return the proper string for the chosen move.

  // Use process of elimination (demerits system) to pick the least-bad move.
  var demerits = [0,0,0,0, 0,0, 1];
    // # of reasons not to moveLeft, Up, Right, Down, bomb, shoot, and stay, respectively.
    // Staying is usually stupid.
  var unitBox = unit.rect.getBBox() //bounding box of unit
  var tsu = unitBox.y   //y coord of top of unit
  var bsu = unitBox.y2  //y coord of bottom of unit
  var lsu = unitBox.x;  //x coordinate of left side of unit
  var rsu = unitBox.x2; //x coordinate of right side of unit

  //MOVE OUT OF THE WAY OF SHOTS
  for(var i=0; i<qpo.shots.length; i++){
    var shotBox = qpo.shots[i].getBBox();   //bounding box of shot
    var tss = shotBox.y;     //see unitBox
    var bss = shotBox.y2;
    var lss = shotBox.x;     //x coord of left side of shot
    var rss = shotBox.x2;    //x coord of right side of shot
    if(lss > rsu){            //If the shot is to the right of the unit,
      demerits[2] += 1;       //  unit has a new reason not to move right.
    } else if (rss < lsu){    //If the shot is to the left of the unit,
      demerits[0] += 1;       //  unit has a new reason not to move left.
    } else {                  //Otherwise, the shot is in the same column,
      demerits[1] += 1;       //  so unit has a new reason not to do anything
      demerits[3] += 1;       //  other than move left or right.
      demerits[4] += 1;
      demerits[5] += 1;
      demerits[6] += 1;
    }
  }

  //MOVE OUT OF THE WAY OF BOMBS THAT ARE CLOSE
  for(var i=0; i<qpo.bombs.length; i++){
    if (qpo.bombs[i]){
      var bombBox = qpo.bombs[i].phys.getBBox(); //bounding box of bomb
      var lsb = bombBox.x;     //x coord of left side of bomb
      var rsb = bombBox.x2;    //x coord of right side of bomb
      var tsb = bombBox.y;     //y coord of top of bomb
      var bsb = bombBox.y2;    //y coord of bottom of bomb

      //find the vertical distance between the center of the unit and the center of the bomb
      var distance = Math.abs( (tsb+bsb)/2 - (tsu+bsu)/2 );

      if(lsb > rsu){            //If the bomb is to the right of the unit,
        demerits[2] += 1;       //  unit has a new reason not to move right.
      } else if (rsb < lsu){     //If the bomb is to the left of the unit,
        demerits[0] += 1;       //  unit has a new reason not to move left.
      } else {                  //Otherwise, the bomb is in the same column,
        demerits[1] += 1;       //  so unit has a new reason not to do anything
        demerits[3] += 1;       //  other than move left or right.
        demerits[4] += 1;
        demerits[5] += 1;
        demerits[6] += 1;
        // console.log("bomb in same column");
      }
    }
  }

  //DON'T BOTHER MOVING INTO WALLS THAT YOU'RE IN CONTACT WITH:
  if (-5 < lsu-qpo.guiCoords.gameBoard.leftWall < 5){demerits[0]++;}
  if (-5 < tsu-qpo.guiCoords.gameBoard.topWall < 5){demerits[1]++;}
  if (-5 < rsu-qpo.guiCoords.gameBoard.rightWall < 5){demerits[2]++;}
  if (-5 < bsu-qpo.guiCoords.gameBoard.bottomWall < 5){demerits[3]++;}

  //RANDOMLY FORGET ALL BUT 7 DEMERITS (TO SIMULATE "DISTRACTIBILITY")
    //TODO

  //CHOOSE THE MOVE WITH THE FEWEST DEMERITS:
  var fewestDemerits = 100; //a comparer
  for (var i=0; i<demerits.length;i++){ //find the lowest number of demerits
    if(demerits[i]<fewestDemerits){
      fewestDemerits = demerits[i];
    }
  }
  //collect indices of moves tied for least demerits:
  var indices = new Array();
  var utilIndex = 0;
  for (var i=0; i<demerits.length;i++){ //find the lowest number of demerits
    if(demerits[i]==fewestDemerits){
      indices[utilIndex] = i;
      utilIndex += 1;
    }
  }
  //choose random index from "indices" array:
  var moveIndex = indices[Math.floor(Math.random()*indices.length)];
  chosenMove = movesList[moveIndex];
  /* log some stuff to the console for debugging
  // console.log("demerits: " + demerits);
  // console.log("fewestDemerits: " + fewestDemerits);
  // console.log("m")
  // console.log("indices: " + indices);
  // console.log("moveIndex: " + moveIndex);
  // console.log("chosenMove: " + chosenMove);
  */

  return chosenMove;
}
