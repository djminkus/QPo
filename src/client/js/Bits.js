qpo.Bits = function(x1, y1, xRange, yRange, colors, number, bye){
  //colors is an array of color strings

  this.circles = c.set()
  this.squares = c.set()
  this.x1 = x1
  this.y1 = y1
  this.xRange = xRange
  this.yRange = yRange

  this.allBits = c.set()
  for(i=0; i<number; i++){
    var size = 13 * Math.random() // 0 to 13
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
