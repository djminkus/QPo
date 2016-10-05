qpo.Mission = function(args){
  //args: {snippets, number, specifics}
  this.snippets = args.snippets || ['',''] //The mission text
  this.number = args.number || -1 //mission number
  this.chapter = args.chapter || 'unspecified'
  this.specifics = args.specifics || function(){} //a function to be executed when mission is begun

  this.begin = function(){
    this.textEls = c.set();
    for (var i=0; i<this.snippets.length; i++){ //create text els from snippets
      this.textEls.push(c.text(300, 40+i*25, this.snippets[i]).attr({qpoText:25}).hide());
    }
    qpo.gui.push(this.textEls);
    setTimeout(function(){qpo.fadeIn(this.textEls, 2500)}.bind(this), 1000);
    qpo.mode = 'game';
    this.specifics.call(this);
    qpo.activeMission = this;
  }
  this.end = function(success){
    var text=''
    qpo.activeMission.textEls.remove()
    if (success){
      text = 'Clear!'
      qpo.user.campaignProgress[this.chapter][this.number-1] = true
    } else {
      text = 'Fail.'
    }
    qpo.gui.push(c.text(300,70, text).attr({qpoText:35}))
    qpo.activeGame.end('blue', this.number);
  }
  return this
};

qpo.chapters = {
  'easy': {'missions': [false]},
  'medium': {'missions': [false]},
  'hard' : {'missions': [false]}
}

qpo.chapters.easy.missions[1] = new qpo.Mission({ //Score once.
  'snippets': ['Use w/a/s/d to move the blue unit', 'across the enemy goal line.'],
  'chapter':'easy',
  'number': 1,
  'specifics': function(){
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1,
      'customScript': function(){
        qpo.aiType = 'null'
        this.yAdj = 20
        this.turns = 200
        // Adjust unit's .score() method to make it end the mission:
        // setTimeout(function(){qpo.blue.units[0].score = function(){qpo.activeMission.end(true)}}, 10000)
      }, 'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    })
    qpo.scoreboard.all.remove();
  }
})
qpo.chapters.easy.missions[2] = new qpo.Mission({ //Kill an enemy unit with a shot.
  'snippets': ['Shoot the enemy unit.','(e or spacebar)'],
  'chapter': 'easy',
  'number': 2,
  'specifics': function(){
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1,
      'customScript': function(){
        qpo.aiType = 'null'
        this.yAdj = 20
        this.turns= 200
        // setTimeout(function(){
        //   qpo.red.units[0].kill = function(and){ }
        // }, 10000)
      }
    })
    qpo.scoreboard.all.remove();
  }
})
qpo.chapters.easy.missions[3] = new qpo.Mission({
  'snippets': ['Bomb the enemy unit. (q)',"Don't get too close."],
  'chapter': 'easy',
  'number': 3,
  'specifics': function(){
    qpo.activeGame = new qpo.Game({'type': 'campaign', 'q':5, 'po':1,
      'customScript': function(){
        qpo.aiType = 'null'
        this.yAdj = 20
        // End it when the enemy unit is killed by a bomb belonging to the user.
      }
    })
    qpo.scoreboard.all.remove();
  }
})
