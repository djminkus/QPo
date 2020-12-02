qpo.bombEasing = 'linear';

// "Bomb" class
qpo.Bomb = function(su){ //su = source unit
  var UNIT = qpo.guiDimens.squareSize
  var INITIAL_SIZE = UNIT * 14/50
  var MARGIN_Y = (UNIT-INITIAL_SIZE)/2
  var MARGIN_X = MARGIN_Y
  // var INITIAL_RADIUS = 14/50   //multiply by unit to get actual
  // var MAX_RADIUS = 2   //unused. # of square lengths the explosion takes up
  // var SIDE_RADIUS = 2   //pixels of rounding at the corners

  this.team = su.team
  this.unit = su
  this.timer = 3
  this.exploded = false
  this.x = su.x
  this.y = (this.team == "blue" ? su.y+1 : su.y-1)
  var lw = qpo.board.lw //left wall
  var tw = qpo.board.tw //top wall
  switch(this.team){ //make the "this.phys" and put it in the right place
    case "blue":
      this.phys = c.rect(lw +su.tx() + MARGIN_X,
                    tw + su.ty() + qpo.guiDimens.squareSize + MARGIN_Y,
                    INITIAL_SIZE, INITIAL_SIZE, qpo.BCR);
      break;
    case "red":
      this.phys = c.rect(lw+ su.tx() + MARGIN_X,
                    tw + su.ty() - MARGIN_Y - INITIAL_SIZE,
                    INITIAL_SIZE, INITIAL_SIZE, qpo.BCR);
      break;
  }
  qpo.gui.push(this.phys)

  //put this in the "bombs" array:
  var ind = qpo.findSlot(qpo.bombs)
  this.index = ind
  qpo.bombs[this.index] = this

  this.phys.attr({
    "fill":qpo.COLOR_DICT["purple"],
    "opacity": 1,
    'fill-opacity':.25,
    'stroke-opacity':1,
    "stroke":qpo.COLOR_DICT["purple"],
    'stroke-width':qpo.bombStroke
  });

  return this
}

qpo.Bomb.prototype.explode = function(){ //animate the bomb's explosion
  this.exploded = true;
  this.timer = -1;
  var cx = this.phys.getBBox().x;
  var cy = this.phys.getBBox().y;
  this.phys.stop();

  var anim = Raphael.animation({
    "16.6%": {
      "y": cy - (qpo.bombSize/2 - 7*qpo.guiDimens.squareSize/50),
      "x": cx - (qpo.bombSize/2 - 7*qpo.guiDimens.squareSize/50),
      "width": qpo.bombSize,
      "height": qpo.bombSize,
      // 'opacity': 1,
      'stroke-width': 8,
      'stroke-opacity':1,
      'fill-opacity': 1
    },
    "100%": {
      "y":cy,
      "x":cx,
      "width":0,
      "height":0,
      'opacity':0,
      'stroke-width':0,
      'fill-opacity':.25
    }
  }, 15/16 * 3000*qpo.timeScale, function(){
    this.phys.remove()
    qpo.bombs[this.index] = false
  }.bind(this));
  this.phys.animate(anim);
}
qpo.Bomb.prototype.next = function(){ //each turn make the bomb either explode, or move and count down.
  if (this.timer == 0){
    this.explode();
  } else if (this.timer > 0 ){
    var bombAnim
    var side = this.phys.attr('width') // also 'height'
    var shrinkageFactor = .7 //factor by which unexploded bomb shrinks each turn
    var shrinkageAmt = (1-shrinkageFactor) * side //amount of shrinkage, in pixels
    switch(this.team){ //create the right animation, and update this.y
      case "blue":
        bombAnim = Raphael.animation({
          "y":this.phys.attr('y') + qpo.guiDimens.squareSize,
          'x':this.phys.attr('x') + shrinkageAmt/2,
          "width": side * shrinkageFactor,
          "height": side * shrinkageFactor
        }, 3000*qpo.timeScale, qpo.bombEasing, function(){this.next()}.bind(this) );
        this.y += 1
        break;
      case "red":
        bombAnim = Raphael.animation({
          "y":this.phys.attr('y') - 0.98*qpo.guiDimens.squareSize,
          'x':this.phys.attr('x') + shrinkageAmt/2,
          "width": side * shrinkageFactor,
          "height": side * shrinkageFactor
        }, 3000*qpo.timeScale, function(){this.next()}.bind(this) );
        this.y -= 1
        break;
    }
    this.phys.animate(bombAnim)
  }
  this.timer = this.timer - 1
}
