qpo.bombEasing = 'linear';

// "Bomb" class
qpo.Bomb = function(su){ //su = source unit
  var UNIT = qpo.guiDimens.squareSize;
  var INITIAL_BOMB_SIZE = 10*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_Y = 20*qpo.guiDimens.squareSize/50;
  var BOMB_MARGIN_X = 20*qpo.guiDimens.squareSize/50;
  // var INITIAL_RADIUS = 14/50; //multiply by unit to get actual
  // var MAX_RADIUS = 2; //unused. # of square lengths the explosion takes up
  var SIDE_RADIUS = 2; //pixels of rounding at the corners

  this.team = su.team;
  this.timer = 3;
  this.exploded = false;
  var lw = qpo.board.lw;
  var tw = qpo.board.tw;
  switch(this.team){ //make the "this.phys" and put it in the right place
    case "blue":
      this.phys = c.rect(lw +su.tx() + BOMB_MARGIN_X,
                    tw + su.ty() + qpo.guiDimens.squareSize + BOMB_MARGIN_Y,
                    INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE, SIDE_RADIUS);
      break;
    case "red":
      this.phys = c.rect(lw+ su.tx() + BOMB_MARGIN_X,
                  tw + su.ty() - BOMB_MARGIN_Y - INITIAL_BOMB_SIZE,
                  INITIAL_BOMB_SIZE, INITIAL_BOMB_SIZE, SIDE_RADIUS);
      break;
  }
  qpo.gui.push(this.phys);

  //put this in the "bombs" array:
  var ind = qpo.findSlot(qpo.bombs);
  this.index = ind;
  qpo.bombs[this.index] = this;

  this.phys.attr({
    "fill":qpo.COLOR_DICT["purple"],
    "opacity": 1,
    'fill-opacity':.25,
    'stroke-opacity':1,
    "stroke":qpo.COLOR_DICT["purple"],
    'stroke-width':qpo.bombStroke
  });
  this.explode = function(){ //animate the bomb's explosion
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
    }, 3000*qpo.timeScale, function(){
      this.phys.hide();
      qpo.bombs[this.index] = false;
    }.bind(this));
    this.phys.animate(anim);
  }
  this.next = function(){ //each turn make the bomb either explode, or move and count down.
    if (this.timer == 0){
      this.explode();
    } else if (this.timer > 0 ){
      var bombAnim;
      var side = this.phys.attr('width') // also 'height'
      var shrinkageFactor = .7; //factor by which unexploded bomb shrinks each turn
      var shrinkageAmt = (1-shrinkageFactor) * side //amount of shrinkage, in pixels
      switch(this.team){
        case "blue":
          bombAnim = Raphael.animation({
            "y":this.phys.attr('y') + 0.98 * qpo.guiDimens.squareSize,
            'x':this.phys.attr('x') + shrinkageAmt/2,
            "width": side * shrinkageFactor,
            "height": side * shrinkageFactor
          }, 3000*qpo.timeScale, qpo.bombEasing, function(){this.next()}.bind(this) );
          break;
        case "red":
          bombAnim = Raphael.animation({
            "y":this.phys.attr('y') - 0.98*qpo.guiDimens.squareSize,
            'x':this.phys.attr('x') + shrinkageAmt/2,
            "width": side * shrinkageFactor,
            "height": side * shrinkageFactor
          }, 3000*qpo.timeScale, function(){this.next()}.bind(this) );
          break;
      }
      this.phys.animate(bombAnim);
    }
    this.timer = this.timer - 1;
  }

  return this;
}
