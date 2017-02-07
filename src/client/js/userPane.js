var p = new Raphael("raphContainer2", 400, 600) //create another Raphael canvas

p.customAttributes.qpoText = function(size, fill){ //use the qpo font and white color by default.
  return {
    "font-size": size,
    "fill": (fill || "white"),
    "font-family":" '" + qpo.font + "',sans-serif"
    // "font-family":"'Poppins',sans-serif"
    // "font-family":"'Oxygen',sans-serif"
    // "font-family":"'Varela Round',sans-serif"
    // "font-family":"'Questrial',sans-serif"
    // "font-family":"'Orbitron',sans-serif"
    // "font-family":"'Open Sans',sans-serif"
    // "font-family":"sans-serif"
  };
}

qpo.Leveller = function(cx, cy, r, user){
  this.user = user
  this.circle = p.circle(cx,cy,r).attr({
    'stroke':qpo.COLOR_DICT['foreground'],
    'stroke-width':2
  })
  this.square = qpo.centeredSquare(p, cx, cy, Math.sqrt(2)*r, {
    'stroke':qpo.COLOR_DICT['foreground'],
    'stroke-width':2
  })
  this.lvtxt = p.text(cx,cy-20, 'lv.').attr({qpoText:[15]})
  this.levelText = p.text(cx,cy+10, this.user.level).attr({qpoText:[40]})
  this.userName = p.text(cx, cy-r-25, this.user.username).attr({qpoText:[40]})

  this.all = p.set(this.circle, this.square, this.lvtxt, this.levelText, this.userName)

  var anim = new Raphael.animation({'transform':'r360'}, 9000, 'linear', function(){this.square.attr({'transform':'r0'})}.bind(this)).repeat(Infinity)
  this.square.animate(anim)
}
