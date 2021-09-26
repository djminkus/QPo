qpo.Leveller = function(cx, cy, r, user){
  this.user = user

  this.bigTri = qpo.triangle(cx, cy, r, 3, false)
  this.bigTriGlow = this.bigTri.glow({color:qpo.COLOR_DICT['foreground']})

  this.lvTri = qpo.triangle(cx, cy - (r*3/4), r/3 * 4/3, 2, true)
  this.lvTxt = c.text(cx, cy - (r*3/4) + 15, Math.floor(this.user.elo)).attr({qpoText:[15]})
  this.lvTriGlow = this.lvTri.glow({color:qpo.COLOR_DICT['foreground']})
  this.updateLevel = function(){
    this.lvTxt.attr({'text': Math.floor(this.user.elo)})
  }.bind(this)

  this.oneTri = qpo.triangle(cx - 0.65*r, cy+.375*r, r/3, 2, false)
  this.oneTxt = c.text(cx - 0.65*r, cy+.375*r, this.user.onePoRank).attr({qpoText:[15]})
  this.oneTriGlow = this.oneTri.glow({color:qpo.COLOR_DICT['foreground']})

  this.twoTri = qpo.triangle(cx + 0.65*r, cy+.375*r, r/3, 2, false)
  this.twoTxt = c.text(cx + 0.65*r, cy+.375*r, this.user.twoPoRank).attr({qpoText:[15]})
  this.twoTriGlow = this.twoTri.glow({color:qpo.COLOR_DICT['foreground']})

  //NAMEPLATE:
  var NPX1 = cx-0.6*r //nameplate x1
  var NPY1 = cy-20 //nameplate y1
  var NPX2 = NPX1 + 1.2*r
  var NPY2 = NPY1 + 40
  this.nameplate = c.set().push(
    c.rect(NPX1, NPY1, 1.2*r, 40).attr({'fill':qpo.COLOR_DICT['background']}),
    c.path("M"+cx+","+NPY1+'h-'+(0.6*r)+'v40h'+(0.6*r)).attr({'stroke':qpo.COLOR_DICT['red'], 'stroke-width':3}),
    c.path("M"+cx+","+NPY1+'h'+(0.6*r)+'v40h-'+(0.6*r)).attr({'stroke':qpo.COLOR_DICT['blue'], 'stroke-width':3}),
    c.text(cx, cy+2, this.user.username).attr({qpoText:[30]})
  )

  this.all = c.set(this.bigTri, this.nameplate, this.lvTri, this.lvTxt, this.oneTri, this.oneTxt, this.twoTri, this.twoTxt)
  this.glows = c.set(this.bigTriGlow, this.oneTriGlow, this.twoTriGlow, this.lvTriGlow)
  /* ROTATING SQUARE IN CIRCLE
  this.circle = c.circle(cx,cy,r).attr({
    'stroke':qpo.COLOR_DICT['foreground'],
    'stroke-width':2
  })

  this.square = qpo.centeredSquare(c, cx, cy, Math.sqrt(2)*r, {
    'stroke':qpo.COLOR_DICT['foreground'],
    'stroke-width':2
  })
  this.lvtxt = c.text(cx,cy-20, 'lv.').attr({qpoText:[15]})
  this.levelText = c.text(cx,cy+10, this.user.level).attr({qpoText:[40]})
  this.userName = c.text(cx, cy-r-25, this.user.username).attr({qpoText:[40]})

  this.all = c.set(this.circle, this.square, this.lvtxt, this.levelText, this.userName)

  var anim = new Raphael.animation({'transform':'r360'}, 9000, 'linear', function(){this.square.attr({'transform':'r0'})}.bind(this)).repeat(Infinity)
  this.square.animate(anim)
  */

  this.bye = function(){
    qpo.fadeOutGlow(this.glows, function(){}, 1500)
    qpo.fadeOut(this.all, function(){}, 1500)
  }
  return this
}
