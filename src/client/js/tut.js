/* TUTORIAL Sequence
  ========
 [x]  Welcome to QPO! (scene)
 [x]  Units (scene)
 [x]  Turns (scene)
 [x]  Control Panel (scene)
 [x]  Execution (scene)
 [x]  Keyboard Controls (SCREEN)
 [ ]
 [x]  Practice (game)
*/

qpo.Tutorial = function(){
  // c.setSize(qpo.guiDimens.gpWidth+qpo.guiDimens.tpWidth, qpo.guiDimens.gpHeight);
  this.status = -1;

  this.stringPairs = [
    /* 0 */ ['Welcome, '+qpo.user.username+'!',''],
    /* 1 */ ['Use w/a/s/d to move your unit.', 'Cross the enemy goal line to score.'],
    /* 2 */ ['Press e to shoot.', 'You can also use spacebar.'],
    /* 3 */ ['Keeping a unit alive levels it up,', 'getting it bonus abilities.'],
    /* 4 */ ['Once your unit is level 2 or greater,', 'Press q to bomb.'],
    /* 5 */ ['Further levels will grant bonus coatings.', 'These act as shields, and more.'],
    /* x */ // ['A green shield (lv. 3) will protect', 'your unit from one shot.'],
    /* x */ // ['A purple shield (lv. 4) lets you run into', 'one unshielded unit and kill it.'],
    /* x */ // ["Soon you'll control multiple units.", 'Press x to send a neutral command.'],
    /* 6 */ ['Now you know the basics.', 'Battle the CPU, or jump into matchmaking.']
  ];

  this.start = function(){
    qpo.activeGame = new qpo.Game({'type': 'tutorial', 'q':5, 'po':1,
      'customScript': function(){
        // qpo.aiType = 'null' //doesn't work
        this.yAdj = 45
        this.turns = 999
      }, 'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    })
    qpo.scoreboard.all.remove();

    this.status=0;

    this.textEls = c.set(
      c.text(c.width/2, 40+0*25, this.stringPairs[0][0]).attr({qpoText:25}).hide(),
      c.text(c.width/2, 40+1*25, this.stringPairs[0][1]).attr({qpoText:25}).hide()
    )

    setTimeout(function(){qpo.fadeIn(this.textEls)}.bind(this), 3000)
    setTimeout(this.next.bind(this), 6000)
  }

  this.next = function(){
    this.status++
    if(this.status >= this.stringPairs.length) {this.end()}
    else{
      qpo.fadeOut(this.textEls, function(){ //change the text and fade it back in.
        this.textEls = c.set(
          c.text(c.width/2, 40, this.stringPairs[this.status][0]).attr({qpoText:25}).hide(),
          c.text(c.width/2, 70, this.stringPairs[this.status][1]).attr({qpoText:25}).hide()
        )
        qpo.fadeIn(this.textEls)
      }.bind(this))
      if(this.status == 3 || this.status == 5 ) {setTimeout(this.next.bind(this), 9000)}
      if(this.status == 6) {setTimeout(this.next.bind(this), 5000)}
    }
  }

  this.end = function(){
    this.status = -1
    qpo.activeGame.end()
    qpo.fadeOut(this.textEls)
    qpo.user.tutDone = true
    qpo.user.post('tutDone')
  }

  // 'ControlsScreen' : function(){
  //   this.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
  //   this.keys = c.set().push(
  //     c.rect(40, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.rect(100, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.rect(160, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.rect(50, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.rect(110, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.rect(170, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
  //     c.text(65, 65, "Q").attr({qpoText:[20]}),
  //     c.text(125, 65, "W").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(185, 65, "E").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(75, 125, "A").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(135, 125, "S").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(195, 125, "D").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  //   );
  //   this.labels = c.set().push(
  //     c.path("M50,30 L-20,-20").attr({"stroke":"white","stroke-width":2}),
  //     c.path("M125,30 L125,-10").attr({"stroke":"white","stroke-width":2}),
  //     c.path("M190,30 L240,-10").attr({"stroke":"white","stroke-width":2}),
  //     c.path("M40,150 L-20,200").attr({"stroke":"white","stroke-width":2}),
  //     c.path("M130,160 L130,200").attr({"stroke":"white","stroke-width":2}),
  //     c.path("M200,160 L240,200").attr({"stroke":"white","stroke-width":2}),
  //     c.text(55 - 3*30, 35 - 3*30 + 20, "Bomb").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(125, 65 - 3*30, "Move Up").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(185 + 3*30, 65 - 3*30, "Shoot").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(65 - 3*30, 155 + 3*30 - 20, "Move Left").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(135, 125 + 3*30, "Move Down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
  //     c.text(195 + 3*30, 125 + 3*30, "Move Right").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
  //   );
  //
  //   this.keys.transform("t170,170");
  //   this.labels.transform("t170,170");
  //
  //   this.shot = c.rect(450,100,6,20).attr({"fill":qpo.COLOR_DICT["green"],'opacity':0.5});
  //   this.bomb = c.rect(130,100,14,14).attr({"fill":qpo.COLOR_DICT["purple"],'opacity':0.5});
  //
  //   this.promptt = c.text(300,500, "Press enter to continue.")
  //     .attr({qpoText:[20, qpo.COLOR_DICT["red"]]});
  //
  //   qpo.blink(this.promptt);
  //   this.all = c.set().push(this.blackness, this.keys, this.labels, this.promptt, this.shot, this.bomb);
  //   this.all.attr({'opacity':0});
  //   this.all.animate({'opacity':1},500);
  //   return this;
  // }
}
