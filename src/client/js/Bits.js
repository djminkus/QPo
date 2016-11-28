qpo.Bits1 = function(x1, y1, xRange, yRange, colors, number, bye){
  //colors is an array of color strings

  this.allBits = c.set()
  this.circles = c.set()
  this.squares = c.set()
  this.x1 = x1
  this.y1 = y1
  this.xRange = xRange
  this.yRange = yRange

  for(i=0; i<number; i++){
    var size = qpo.MAX_BIT_SIZE * Math.random() // 0 to 13
    var time = 67 * size //blink time in ms

    var x = x1 + xRange*Math.random()
    var y = y1 + yRange*Math.random()

    //make a new bit (circle or square)
    var newBit
    var b = Math.floor(2*Math.random()) // 0 or 1
    if(b){ newBit = c.rect(x, y, size, size) } // if 1, square
    else { newBit = c.circle(x, y, size/Math.sqrt(2)) } //if 0, cirlce

    //choose its color
    var colorInd = Math.floor(colors.length*Math.random())
    newBit.attr({'stroke':colors[colorInd]})

    qpo.blink(newBit, time)

    this.allBits.push(newBit)
    if(b){ this.squares.push(newBit)}
    else { this.circles.push(newBit)}
  }
  this.allBits.attr({'fill':'none', 'stroke-width': 2})

  if (bye === undefined) { //default 'bye' function
    this.bye = function(){
      // var x1 = this.x1, xRange = this.xRange, y1 = this.y1, yRange = this.yRange
      // console.log(this)
      // console.log(x1, y1)
      var DELAY, DISPLACEMENT
      var timeScale = 4,
        totalLength = 500, //length of closing animation if timeScale is 1
        bitAnimLength = .2

      this.circles.forEach(function(item,index){
        DISPLACEMENT = 1 - ( (item.getBBox().x - this.x1) / this.xRange ) // A number from 0 to 1. 0 means far right, 1 means far left.
        DELAY = DISPLACEMENT * ( (1-bitAnimLength) * timeScale)
        setTimeout(function(){
          item.animate({'transform':'t'+(xRange + 100)+',0'}, (bitAnimLength*totalLength*timeScale), '>', item.remove)
        }.bind(this), DELAY)
      })
      this.squares.forEach(function(item,index){
        DISPLACEMENT = 1 - ( (item.getBBox().y - this.y1) / this.yRange ) // A number from 0 to 1. 0 means bottom, 1 means top.
        DELAY = DISPLACEMENT * ( (1-bitAnimLength) * timeScale)
        setTimeout(function(){
          item.animate({'transform':'t0,'+(yRange + 120)}, (bitAnimLength*totalLength*timeScale), '>', item.remove)
        }.bind(this), DELAY)
      })
    }
  } else { this.bye = bye.bind(this) }

  return this
}

qpo.Bits2 = function(midpoint, segregated, colors){
  this.colors = colors //an ARRAY of colors.
  this.midpoint = midpoint //horizontal coordinate of where they will part.
  this.segregated = segregated //boolean telling us if they're separated by color.

  this.all = c.set()
  this.bitsLeft = c.set()
  this.bitsRight = c.set()

  if(this.segregated){ //generate bits separated by color, as in end-game menu
    var numLeft = Math.floor(47 * midpoint/c.width) //how many bits on the left?
    var numRight = 47 - numLeft //how many bits on the right?

    var i, size, time, x, y, newBit, b
    for (i=0; i<numLeft; i++){ // Make left (red) bits:
      size = qpo.MAX_BIT_SIZE * Math.random() // 0 to 13
      time = 67 * size //blink time in ms

      x = midpoint*Math.random()
      y = c.height*Math.random()

      b = Math.floor(2*Math.random()) // random choice of 0 or 1
      if(b){ newBit = c.rect(x, y, size, size) } // if 1, square
      else { newBit = c.circle(x, y, size/Math.sqrt(2)) } //if 0, circle

      newBit.attr({'stroke':qpo.COLOR_DICT['red']})

      qpo.blink(newBit, time)

      this.all.push(newBit)
      this.bitsLeft.push(newBit)
    }
    for (i=0; i<numRight; i++){ // Make right (blue) bits:
      size = qpo.MAX_BIT_SIZE * Math.random() // 0 to 13
      time = 67 * size //blink time in ms

      x = midpoint + (c.width-midpoint * Math.random())
      y = c.height*Math.random()

      b = Math.floor(2*Math.random()) // random choice of 0 or 1
      if(b){ newBit = c.rect(x, y, size, size) } // if 1, square
      else { newBit = c.circle(x, y, size/Math.sqrt(2)) } //if 0, circle

      newBit.attr({'stroke':qpo.COLOR_DICT['blue']})

      qpo.blink(newBit, time)

      this.all.push(newBit)
      this.bitsRight.push(newBit)
    }
    this.all.attr({'fill':'none', 'stroke-width': 2})
  } else { //generate bits of mixed color with rotational symmetry applied, as in title screen
    for (var i=0; i<23; i++){
      var size = 13 * Math.random()
      var time = 67*size

      var ind = Math.floor(2*Math.random()) // Random choice between 0 and 1
      var color1 = colors[ind]
      var color2
      ind ? (color2 = colors[ind-1]) : (color2 = colors[ind+1])

      var x = c.width/2*Math.random()
      var y = c.height*Math.random()

      var newBit1 = c.rect(x, y, size, size).attr({'stroke':color1}).data('i', i)
      qpo.blink(newBit1, time)
      var newBit2 = c.circle(c.width-x, c.height-y, size/Math.sqrt(2)).attr({'stroke':color2}).data('i', i)
      qpo.blink(newBit2, time)

      this.all.push(newBit1, newBit2)
      this.bitsLeft.push(newBit1)
      this.bitsRight.push(newBit2)
    }
  }

  this.all.attr({'fill':'none', 'stroke-width': 2})

  this.bye = function(){
    var timeScale = 4,
      totalLength = 500, //length of closing animation if timeScale is 1
      bitAnimLength = .2
    var DISPLACEMENT, DELAY
    this.bitsLeft.forEach(function(item, index){
      DISPLACEMENT = 1 - ( item.getBBox().x / this.midpoint ) // A number from 0 to 1. 0 means centered, 1 means far left.
      DELAY = DISPLACEMENT * ( (1-bitAnimLength) * timeScale)
      setTimeout(function(){
        item.animate({'transform':'t-'+(this.midpoint + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
      }.bind(this), DELAY)
    }.bind(this))
    this.bitsRight.forEach(function(item, index){
      DISPLACEMENT = 1 - (c.width-item.getBBox().x2)/(c.width-this.midpoint)
      DELAY = DISPLACEMENT * (1-bitAnimLength * timeScale)
      setTimeout(function(){
        item.animate({'transform':'t'+((c.width-this.midpoint) + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
      }.bind(this), DELAY)
    }.bind(this))
  }

  return this
}
