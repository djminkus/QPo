//Set up the menu objects and open the title screen.
qpo.Menu = function(titleStr, itemList, parent, placeholder, unwrapDoodad, and){ // A Menu contains a CursorList of MenuOptions
  // The doodad returned by unwrapDoodad() should have...
  //   ...a bye() method to be called on menu close, and
  //   ...an .all property containing a Raphael set
  this.titleStr = titleStr
  this.TITLE_SIZE = 40
  this.unwrapDoodad = unwrapDoodad || function(){return c.circle(-5,-5, 1)}
  this.and = and || function(){} //callback to be called when this menu is opened

  this.isPlaceholder = placeholder || false
  this.cl = new qpo.CursorList(itemList)

  this.open = function(h){ // (re)create all the raphs for this menu.
    //h is index (in this.cl) of menu option to highlight on load.
    var h = h || 0;
    qpo.mode = 'menu';
    qpo.activeMenu = this.titleStr.toLowerCase();

    // this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
    this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[this.TITLE_SIZE, qpo.COLOR_DICT['foreground']]});
    this.layer1 = c.set().push(this.background, this.title);

    qpo.makeMuteButton();

    this.cl.render();

    this.doodad = this.unwrapDoodad()

    this.next = this.cl.next
    this.previous = this.cl.previous

    this.all = c.set().push(this.layer1, this.layer2, this.doodad.all)
    for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs) }
    qpo.fadeIn(this.all, 500);
    // qpo.fadeInGlow(qpo.glows);

    this.and()
  }

  this.parent = qpo.menus[parent.toLowerCase()] || 'title'
  this.up = function(){ this.close({'destination':'parent'}) }

  this.children = {}

  this.close = function(obj, time){ //clear the canvas and open the next screen
    var time = time || 1500
    qpo.ignore(time)
    this.all.stop()
    try{this.doodad.bye()}
    catch(err){console.log('no doodad to do doodad.bye()')}
    // qpo.fadeOutGlow(qpo.glows, function(){}, time);
    qpo.fadeOut(this.all, function(){ //clear canvas, do stuff based on "obj" argument
      this.cl.select(0)
      c.clear();
      this.all = null; //remove reference to raphs too
      switch(obj.destination){ //go to title screen, parent menu, mission, or game
        case 'title': { qpo.titleScreen = new qpo.displayTitleScreen(); break; }
        case 'parent' : { this.parent.open(); break; }
        case 'child' : { this.children[obj.childName].open(); break;}
        case 'tutorial' : {
          qpo.tutorial.start()
          break;
        }
        case 'game' : {
          // qpo.fadeOut(qpo.leveller.all, function(){ //center the main panel
          //
          // })
          qpo.activeGame = new qpo.Game(obj.gameArgs); break;
        }
        default : { //open the menu of that name (in this case, obj is actually a string)
          try{qpo.menus[obj].open();}
          catch(e){console.log(obj, qpo.menus[obj])}
        }
      }
    }.bind(this), time);
  }.bind(this);

  return this
}
qpo.CursorList = function(list, initialCursorPosition){ // A list with a "selected" or "active" item
  // Methods break unless each item in "list" has a "render()" method

  list===null ? this.list = new Array() : this.list=list ;
  this.length = this.list.length;
  this.cursorPosition = initialCursorPosition || 0;
  this.selectedItem = this.list[this.cursorPosition];

  this.select = function(index){
    this.selectedItem.deactivate();
    this.cursorPosition = index;
    this.selectedItem = this.list[this.cursorPosition];
    this.selectedItem.activate();
  }

  this.rendered = false;

  this.render = function(){ // Generate the raphs.
    for (var i=0; i<this.length; i++){ this.list[i].render(); } //render each item in the list
    try{this.selectedItem.activate()}
    catch(err){console.log('placeholder menu, or unexpected error')};
    this.rendered = true;
  }.bind(this);

  this.addItem = function(item){
    this.list.push(item)
    if(this.rendered){item.render()}
  }

  this.next = function(){
    if(this.cursorPosition>=this.list.length-1){this.select(0)}
    else{this.select(this.cursorPosition+1)}
  }.bind(this); // <-- THIS is when to use .bind() (function's identifier passed to another object)
  this.previous = function(){
    if(this.cursorPosition==0){this.select(this.list.length-1)}
    else{this.select(this.cursorPosition-1)}
  }.bind(this);

  return this;
}
qpo.MenuOption = function(x, y, textStr, action, menu, active, order, color, index){
  //pass in a spawn point, some text, and a function to execute when this option is chosen
  this.index = index;
  this.color = color || 'blue';
  this.x = x
  this.y = y
  qpo.guiDimens.squareSize = 50;
  var mtr = qpo.guiDimens.squareSize;
  this.textStr = textStr;
  this.active = active || false;

  this.render = function(){ //do all the stuff that creates or changes Raph els
    this.menu = qpo.menus[menu.toLowerCase()]; //the menu object that it belongs to

    // this.unit = new qpo.Unit(this.color, this.gx, this.gy); // arg 'num' gets set to 0
    // this.unit.setLevel(4);
    // this.unit.applyCoating('none');
    // if(order){this.unit.setIcon(order)}

    // this.active ? (this.icon = qpo.arrow(x, y, qpo.COLOR_DICT['orange'], 'right')) : (this.icon = c.circle(x, y, 5).attr({'fill':qpo.COLOR_DICT['foreground'], 'stroke':'none'}))

    this.text = qpo.xtext(x+mtr*2/4, y, this.textStr, 20)
    this.text.attr(qpo.inactiveMenuOptAtts)
    if(this.active){this.text.attr(qpo.activeMenuOptAtts)} //highlight it if active

    this.raphs = c.set(this.text)

    this.activate = function(){
      this.icon = qpo.arrow(this.x, this.y, qpo.COLOR_DICT['orange'], 'right')
      this.raphs.push(this.icon)
      this.text.attr(qpo.activeMenuOptAtts)
      qpo.blink(this.text)
      qpo.blink(this.icon)
      this.active = true
    }
    this.deactivate = function(){
      this.text.stop()
      this.icon.stop()
      this.text.attr(qpo.inactiveMenuOptAtts)
      this.raphs.exclude(this.icon)
      this.icon.remove()
      this.active = false
    }

    this.raphs.hover(function(){
      if (!qpo.ignoreInput){
        this.raphs.attr({'cursor':'crosshair'});
        if(!this.active){this.menu.cl.select(this.index)}
      }
    }, function(){ this.raphs.attr({'cursor':'default'}); }, this, this);
    this.raphs.click(function(){this.action()}.bind(this))
  }

  this.action = action //a function

  return this
}
qpo.CampaignChapterMenu = function(titleStr, itemList, parent, placeholder, makeDoodad){ // could inherit prototype from qpo.Menu
  this.titleStr = titleStr
  this.TITLE_SIZE = 40
  this.makeDoodad = makeDoodad || function(){return c.circle(-5,-5, 1)} // A function that returns a raph set

  this.isPlaceholder = placeholder || false
  this.cl = new qpo.CursorList(itemList)

  this.open = function(h){ // (re)create all the raphs for this menu.
    //h is index (in this.cl) of menu option to highlight on load.
    var h = h || 0;
    qpo.mode = 'menu';
    qpo.activeMenu = this.titleStr.toLowerCase();

    this.background = c.rect(0,0, c.width, c.height).attr({'fill':qpo.COLOR_DICT['background']});
    this.title = c.text(c.width/2, 60, this.titleStr).attr({qpoText:[this.TITLE_SIZE, qpo.COLOR_DICT['foreground']]});
    this.layer1 = c.set().push(this.background, this.title);

    qpo.makeMuteButton();

    this.cl.render();
    this.cl.select(h);

    this.doodad = this.makeDoodad()

    this.next = this.cl.next;
    this.previous = this.cl.previous;

    this.all = c.set().push(this.layer1, this.layer2, this.doodad);
    for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs); }
    qpo.fadeIn(this.all, 500);
    // qpo.fadeInGlow(qpo.glows);
  }

  this.parent = qpo.menus[parent.toLowerCase()] || 'title'
  this.up = function(){ this.close({'destination':'parent'}) }

  this.close = function(obj, time){ //clear the canvas and open the next screen
    qpo.ignore(time)
    this.all.stop()
    this.doodad.bye()
    // qpo.fadeOutGlow(qpo.glows, function(){}, time);
    qpo.fadeOut(this.all, function(){ //clear canvas, do stuff based on "obj" argument
      c.clear();
      this.all = null; //remove reference to raphs too
      switch(obj.destination){ //go to title screen, parent menu, mission, or game
        case 'title': { qpo.titleScreen = new qpo.displayTitleScreen(); break; }
        case 'parent' : { this.parent.open(); break; }
        case 'child' : { this.children[obj.childName].open(); break;}
        case 'mission' : { qpo.chapters[obj.missionChapter].missions[obj.missionNumber].begin(); break;}
        case 'game' : { qpo.activeGame = new qpo.Game(obj.gameArgs); break; }
        default : {
          try{qpo.menus[obj].open();}
          catch(e){console.log(obj, qpo.menus[obj])}
        }
      }
    }.bind(this), time);
  }.bind(this);

  return this
}
qpo.CampaignMissionOption = function(x, y, textStr, action, menu, active, complete, index, mission){ //could inherit prototype from MenuOption
  //pass in a spawn point, some text, and a function to execute when this option is chosen
  this.index = index
  this.complete = complete || false
  this.x = x
  this.y = y
  qpo.guiDimens.squareSize = 50
  var mtr = qpo.guiDimens.squareSize
  this.textStr = textStr
  this.active = active || false
  this.mission = mission //the actual mission object

  this.render = function(){ //do all the stuff that creates or changes Raph els
    this.menu = qpo.menus[menu.toLowerCase()]; //the menu object that it belongs to
    this.complete = (qpo.user.campaignProgress[this.mission.chapter][this.mission.number-1] == "true" ) || (qpo.user.campaignProgress[this.mission.chapter][this.mission.number-1] === true)

    this.square = c.rect(this.x, this.y, mtr, mtr).attr({
      'stroke': (this.active ? (qpo.COLOR_DICT['orange']) : (qpo.COLOR_DICT['blue'])),
      'stroke-width': qpo.unitStroke || 4,
      'fill': qpo.COLOR_DICT['blue'],
      'fill-opacity': (this.complete ? (1) : (0.1))
    })

    this.text = c.text(x+mtr/2, y+mtr/2, this.textStr).attr({qpoText:[20]})
    this.text.attr(qpo.inactiveMenuOptAtts)
    if(this.complete){this.text.attr({'fill':qpo.COLOR_DICT['foreground']})}
    if(this.active){this.text.attr(qpo.activeMenuOptAtts)} //highlight it if active

    this.raphs = c.set(this.square, this.text)

    this.activate = function(){
      this.text.attr(qpo.activeMenuOptAtts)
      this.square.attr({'stroke':qpo.COLOR_DICT['orange']})
      this.raphs.toFront()
      qpo.blink(this.text)
      qpo.blink(this.square)
      this.active = true
    }
    this.deactivate = function(){
      this.text.stop()
      this.square.stop()
      this.square.attr({'stroke': qpo.COLOR_DICT['blue']})
      this.square.attr({'opacity': 1})
      this.text.attr(qpo.inactiveMenuOptAtts)
      if(this.complete){this.text.attr({'fill':qpo.COLOR_DICT['foreground']})}
      this.active = false
    }

    this.raphs.hover(function(){
      if(!qpo.ignoreInput){
        this.raphs.attr({'cursor':'crosshair'});
        if(!this.active){this.menu.cl.select(this.index)}
      }
    }, function(){ this.raphs.attr({'cursor':'default'}); }, this, this);
    this.raphs.click(function(){this.action()}.bind(this))
  }

  this.action = action //a function

  return this
}

qpo.makeMuteButton = function(){ //make an icon that can mute the music when clicked
  if (qpo.playMusic) { //don't render the mute button if no audio will be played
    qpo.muteButton = c.path("M-4,-4 L4,-4 L10,-10 L10,10 L4,4 L-4,4 L-4,-4")
      .attr({"stroke-width":2, "stroke":qpo.COLOR_DICT["green"],
        "fill":qpo.COLOR_DICT["green"], "opacity":1})
      .transform("t15,500")
      .click(function(){ //switch between 3 volume settings
        switch(qpo.menuSong.volume){
          case 1: { qpo.menuSong.volume = 0.2; break;}
          case 0.2: { qpo.menuSong.volume = 0; break; }
          case 0: { qpo.menuSong.volume = 1; break; }
          default: {console.log("this was unexpected"); break;}
        }
        switch(qpo.activeGame.song.volume){
          case 1: { qpo.activeGame.song.volume = 0.2; break;}
          case 0.2: { qpo.activeGame.song.volume = 0; break; }
          case 0: { qpo.activeGame.song.volume = 1; break; }
          default: {console.log("this was unexpected"); break;}
        }
      }
    )
  } else {
    qpo.muteButton = c.rect(-5,-5,2,2) //to prevent errors
  }
}
qpo.viewToggler = { //switch between having 2 panes and having 1. Used before/after games.
  'userPaneShown': true,
  'toggle' : function(){
    if (this.userPaneShown){ //hide the user pane
      $("#raphContainer").attr('style', 'float: none; margin: auto;')
      $("#raphContainer2").attr('style','width: 0px; float: none')
      qpo.user.leveller.all.remove()
      qpo.user.leveller = null
      this.userPaneShown = false
    }
    else { //show the user pane
      $("#raphContainer").css({'float': 'left', 'margin-left': '50px'});
      $("#raphContainer2").attr('style','width: 400px; float: left')
      if (qpo.user.leveller === undefined) {qpo.user.leveller = new qpo.Leveller(200, 300, 100, qpo.user)}
      this.userPaneShown = true
    }
  }
}

qpo.quotes = [
  ["Artificial intelligence", "will reach human levels", "by around 2029.", "- Ray Kurzweil"],
  ["[...] for us to have a future", "that's exciting and inspiring," , "it has to be one where we're", "a space-bearing civilization.", "- Elon Musk"],
  ["Genius", "is one percent inspiration", "and ninety-nine percent perspiration.", "- Thomas Edison"],
  ["A person who never made a mistake", "never tried anything new.", "- Albert Einstein"]
]

qpo.makeMenus = function(render){
  //Lay out the menu skeletons. Don't create any Raphael elements, unless render is true.
  //  If render is true, create the main menu's elements.
  qpo.menus = {}
  qpo.tutorial = new qpo.Tutorial()

  var x = 50,
  yStart = 100,
  yInt = 50, //vertical distance between menu item anchor points (in pixels)
  xSq = 100, //x for campaign menu options

  bitsX = 250,
  bitsY = 100,
  bitsXR = 270,
  bitsYR = 400


  //Make top-level menu:
  qpo.menus['main menu'] = new qpo.Menu('Main Menu', [
    new qpo.MenuOption(x, yStart + yInt,'Tutorial', function(){}, 'Main Menu', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'vs. CPU', function(){}, 'Main Menu', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Matchmaking', function(){}, 'Main Menu', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Train ANN', function(){}, 'Main Menu', false, 'stay', 'blue', 3)
    // , new qpo.MenuOption(x, yStart + 4*yInt,'Settings', function(){}, 'Main Menu', false, 'stay', 'blue', 3)
  ], 'title', false, function(){return new qpo.Leveller(350, 250, 150, qpo.user)});
  qpo.menus['main menu'].up = function(){/*qpo.menus['main menu'].close({'destination':'title'})*/}
  qpo.menus['main menu'].cl.list[0].action = function(){ qpo.menus['main menu'].close({'destination':'tutorial'}, 1000) };
  qpo.menus['main menu'].cl.list[1].action = function(){ qpo.menus['main menu'].close('vs. cpu', 1000) };
  qpo.menus['main menu'].cl.list[2].action = function(){ qpo.menus['main menu'].close('matchmaking', 1000) };
  qpo.menus['main menu'].cl.list[3].action = function(){ qpo.menus['main menu'].close('train ann', 1000) };

  // qpo.menus['main menu'].cl.list[3].action = function(){ qpo.menus['main menu'].close('settings') }

  // Make "vs. CPU" menu
  qpo.menus['vs. cpu'] = new qpo.Menu('vs. CPU', [
    new qpo.MenuOption(x, yStart + yInt,'1-Po', function(){}, 'vs. CPU', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'2-Po', function(){}, 'vs. CPU', false, 'stay', 'blue', 1),
    // new qpo.MenuOption(x, yStart + 3*yInt,'3-Po', function(){}, 'vs. CPU', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'vs. CPU', false, 'stay', 'blue', 2)
  ], 'Main Menu', false, function(){return new qpo.Bits1(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.red], 29);});
  qpo.menus['vs. cpu'].cl.list[0].action = function(){ qpo.menus['vs. cpu'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':6, 'po':2, 'ppt': 2, // 'turns':3,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }
  qpo.menus['vs. cpu'].cl.list[1].action = function(){ qpo.menus['vs. cpu'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':8, 'po':4, 'ppt': 2,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }
  // qpo.menus['vs. cpu'].cl.list[2].action = function(){ qpo.menus['vs. cpu'].close({
  //   'destination':'game',
  //   'gameArgs': {
  //     'type':'single', 'q':9, 'po':9, 'ppt':3,
  //     'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
  //   }
  // }, 1000); }
  qpo.menus['vs. cpu'].cl.list[2].action = qpo.menus['vs. cpu'].up.bind(qpo.menus['vs. cpu'])

  // Make "Train ANN" menu
  qpo.menus['train ann'] = new qpo.Menu('Train ANN', [
    new qpo.MenuOption(x, yStart + yInt,'5 games', function(){}, 'Train ANN', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'25 games', function(){}, 'Train ANN', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'125 games', function(){}, 'Train ANN', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'Train ANN', false, 'stay', 'blue', 3)
  ], 'Main Menu', false, function(){
    // Stuff copied from testing mode switch in title.js
    qpo.activeSession = new session('test');
    qpo.testOpponent = 'random';             // (null, random, rigid, or neural)
    qpo.testOpponentName = 'Randy';

    //Make player objects corresponding to each neural net.
    qpo.aliP = new qpo.Player(null, qpo.ali.name, 'neural', qpo.ali.team, 0, qpo.ali.nn)
    // qpo.bryanP = new qpo.Player(null, qpo.bryan.name, 'neural', qpo.bryan.team, 1, qpo.bryan.nn)

    qpo.user.player = qpo.aliP  //just to get things up and running smoothly

    return new qpo.Bits1(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.red], 29);
  });
  qpo.menus['train ann'].cl.list[0].action = function(){
    qpo.menus['train ann'].close({
      'destination':'game',
      'gameArgs': {
        'type':'testing', 'q':6, 'po':2, 'ppt': 1,
        'bluePlayers': [qpo.aliP],
        'redPlayers': [new qpo.Player(null, qpo.testOpponentName, qpo.testOpponent, 'red', 0)]
      }
    }, 1000);
    qpo.gamesToTest=5;
    qpo.batchesToTest=1;
  };
  qpo.menus['train ann'].cl.list[1].action = function(){
    qpo.menus['train ann'].close({
      'destination':'game',
      'gameArgs': {
        'type':'testing', 'q':6, 'po':2, 'ppt': 1,
        'bluePlayers': [qpo.aliP],
        'redPlayers': [new qpo.Player(null, qpo.testOpponentName, qpo.testOpponent, 'red', 0)]
      }
    }, 1000);
    qpo.gamesToTest=5;
    qpo.batchesToTest=5;
  };
  qpo.menus['train ann'].cl.list[2].action = function(){
    qpo.menus['train ann'].close({
      'destination':'game',
      'gameArgs': {
        'type':'testing', 'q':6, 'po':2, 'ppt': 1,
        'bluePlayers': [qpo.aliP],
        'redPlayers': [new qpo.Player(null, qpo.testOpponentName, qpo.testOpponent, 'red', 0)]
      }
    }, 1000);
    qpo.gamesToTest=5;
    qpo.batchesToTest=25;
  };
  // qpo.menus['vs. cpu'].cl.list[2].action = function(){ qpo.menus['vs. cpu'].close({
  //   'destination':'game',
  //   'gameArgs': {
  //     'type':'single', 'q':9, 'po':9, 'ppt':3,
  //     'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
  //   }
  // }, 1000); }
  qpo.menus['train ann'].cl.list[3].action = qpo.menus['train ann'].up.bind(qpo.menus['train ann'])

  // Make "Matchmaking" menu
  qpo.menus['matchmaking'] = new qpo.Menu('Matchmaking', [
    new qpo.MenuOption(x, yStart + yInt,'coming soon?', function(){}, 'Matchmaking', true, 'stay', 'blue', 0),
    // new qpo.MenuOption(x, yStart + yInt,'2-Po', function(){}, 'Matchmaking', true, 'stay', 'blue', 0),
    // new qpo.MenuOption(x, yStart + 2*yInt,'3-Po', function(){}, 'Matchmaking', false, 'stay', 'blue', 1),
    // new qpo.MenuOption(x, yStart + 3*yInt,'4-Po', function(){}, 'Matchmaking', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'Matchmaking', false, 'stay', 'blue', 1)
  ], 'Main Menu', false, function(){return new qpo.Bits1(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.green], 29)});
  // qpo.menus['matchmaking'].cl.list[0].action = function(){ qpo.menus['matchmaking'].close({
  //   'destination':'game',
  //   'type':'multi', 'q':6, 'po':2
  // }, 1000); }
  // qpo.menus['matchmaking'].cl.list[1].action = function(){ qpo.menus['matchmaking'].close({
  //   'destination':'game',
  //   'type':'multi', 'q':7, 'po':2
  // }, 1000); }
  // qpo.menus['matchmaking'].cl.list[2].action = function(){ qpo.menus['matchmaking'].close({
  //   'destination':'game',
  //   'type':'multi', 'q':8, 'po':3
  // }, 1000); }
  qpo.menus['matchmaking'].cl.list[1].action = qpo.menus['matchmaking'].up.bind(qpo.menus['matchmaking'])

  // Make "Settings" menu
  // qpo.menus['settings'] = new qpo.Menu('Settings', [
  //   new qpo.MenuOption(x, yStart + 1*yInt,'coming', function(){}, 'Settings', true, 'stay', 'blue', 0),
  //   new qpo.MenuOption(x, yStart + 2*yInt,'soon', function(){}, 'Settings', false, 'stay', 'blue', 1),
  //   new qpo.MenuOption(x, yStart + 3*yInt,'Main Menu', function(){}, 'Settings', false, 'stay', 'blue', 2)
  // ], 'Main Menu', false, function(){return new qpo.Bits1(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.orange], 29)});
  // qpo.menus['settings'].cl.list[0].action = function(){ qpo.menus['settings'].close({'destination':'parent'}); }
  // qpo.menus['settings'].cl.list[1].action = function(){ qpo.menus['settings'].close({'destination':'parent'}); }
  // qpo.menus['settings'].cl.list[2].action = qpo.menus['settings'].up.bind(qpo.menus['settings'])

  // Make "Match Complete" menu
  qpo.menus['match complete'] = new qpo.Menu('Match Complete',
    [new qpo.MenuOption(x, yStart + 1*yInt, 'Main Menu', function(){}, 'Match Complete', true, 'stay', 'blue', 0)],
    'Main Menu', false,
    function(){ return new qpo.Bits2(qpo.passer, true) },
    function(){
      qpo.menus['match complete'].title.hide()
      qpo.menus['match complete'].all.toFront()
    }
  );
  qpo.menus['match complete'].cl.list[0].action = function(){ qpo.menus['match complete'].close({'destination':'parent'}, 2000); }

  if(render) { //Open the main menu and set qpo.mode to "menu"
    qpo.quote = c.set()

    qpo.menus['main menu'].open()
    qpo.mode = "menu" // Type of screen that's active -- can be "menu", "game", "tut", or "other"
  }
}

//----------localStorage stuff, Old local mode stuff---------
qpo.freshUser = true
if (qpo.freshUser){ localStorage['stats'] = undefined }
qpo.devMode = true

// Neural stuff
qpo.freshStart = false // for neural nets
qpo.neuralSource = 'server' // 'server' or 'local'

if(qpo.freshStart){ //delete Ali from local storage.
  localStorage.removeItem('aliNN')
  localStorage.removeItem('aliCopy')
  localStorage.removeItem('aliCopy2')
  localStorage.removeItem('aliAge')
  console.log("Ali was deleted from localStorage")
  localStorage.removeItem('bryanNN')
  localStorage.removeItem('bryanAge')
  console.log("Bryan was deleted from localStorage")
}

//  get an AI net ready, either from storage or fresh

try {  //retrieve saved AIs or generate new ones
  //Ali
  qpo.ali = {'nn': null,  "team": "blue", 'name': 'Ali'}
  qpo.ali.nn = new deepqlearn.Brain(num_inputs, num_actions, opt)
  switch(qpo.neuralSource){
    case 'local': {
      if(localStorage['aliNN']){ //retrieve saved network from local storage
        console.log("generating Ali's net from localStorage");
        qpo.ali.nn.value_net.fromJSON(JSON.parse(localStorage['aliNN']));
        // ;(JSON.stringify(qpo.ali.nn) == localStorage['aliCopy']) ? (console.log("ali successfully reconstructed.")) : console.log("ali reconstruction failed.");
        qpo.ali.nn.age = Number.parseInt(localStorage['aliAge'], 10);
        qpo.ali.nn.experience = JSON.parse(localStorage['aliExp']) //get Array from string

        if (isNAN(qpo.ali.nn.age)) {qpo.ali.nn.age = 0}
        ;(JSON.stringify(qpo.ali.nn.value_net.toJSON()) == localStorage['aliNN']) ? (console.log("ali value net successfully restored.")) : console.log("ali value net restoration failed.");
      }
      else { //make Ali from scratch.
        console.log("no Ali net found in localStorage. making new one.") //no net found in localStorage
        var brain = new deepqlearn.Brain(num_inputs, num_actions, opt) // start fresh
        // console.log(brain);
        qpo.ali = {  "nn" : brain, "team" : "blue", 'name': 'Ali'}
      }
      break;
    }
    case 'server': {
      console.log('asking server for Ali')
      $.post('/neuralGet', {name: 'Ali'}, function(data, status){
        console.log('Ali data from server: ');
        console.log(data);
        // console.log(status);  // "success" if good
        // console.log('something');
        qpo.ali.nn.value_net.fromJSON(data.value_net);
        qpo.ali.nn.age = data.age;
        qpo.ali.nn.experience = data.experience;
      })
      break;
    }
    default: {console.log('check yourself')}
  }
  // Restore the average_reward_window from localStorage regardless:
  var arwProps = JSON.parse(localStorage['aliARW'])
  qpo.ali.nn.average_reward_window.v = arwProps.v //the list of rewards
  qpo.ali.nn.average_reward_window.sum = arwProps.sum

  //Bryan
  qpo.bryan = {'nn': null,  "team": "blue", 'name': 'Bryan'}
  qpo.bryan.nn = new deepqlearn.Brain(num_inputs, num_actions, opt)
  if(localStorage['bryanNN']){ //retrieve saved network from local storage
    console.log("generating Bryan's net from localStorage");
    qpo.bryan.nn.value_net.fromJSON(JSON.parse(localStorage['bryanNN']));
    ;(JSON.stringify(qpo.bryan.nn) == localStorage['bryanCopy']) ? (console.log("bryan successfully reconstructed.")) : console.log("bryan reconstruction failed.");
    ;(JSON.stringify(qpo.bryan.nn.value_net.toJSON()) == localStorage['bryanCopy2']) ? (console.log("bryan value net successfully reconstructed.")) : console.log("bryan value net reconstruction failed.");
  }
  else { //make Bryan from scratch.
    // console.log("no 'Bryan' net found in localStorage. making new one.") //no net found in localStorage
    var brain = new deepqlearn.Brain(num_inputs, num_actions, opt) // start fresh
    // console.log("Bryan's nn: ");
    // console.log(brain);
    qpo.bryan = {"nn" : brain, "team" : "blue" , 'name': 'Bryan'}
  }

  //Caleb
  qpo.caleb = {'nn': null,  "team": "red", 'name': 'Caleb'}
  qpo.caleb.nn = new deepqlearn.Brain(num_inputs, num_actions, opt)
  if(localStorage['calebNN']){ //retrieve saved network from local storage
    console.log("generating Caleb's net from localStorage");
    qpo.caleb.nn.value_net.fromJSON(JSON.parse(localStorage['calebNN']));
    ;(JSON.stringify(qpo.ali.nn) == localStorage['calebCopy']) ? (console.log("caleb successfully reconstructed.")) : console.log("caleb reconstruction failed.");
    ;(JSON.stringify(qpo.ali.nn.value_net.toJSON()) == localStorage['calebCopy2']) ? (console.log("caleb value net successfully reconstructed.")) : console.log("caleb value net reconstruction failed.");
  }
  else { //make Caleb from scratch.
    // console.log("no Caleb net found in localStorage. making new one.") //no net found in localStorage
    var brain = new deepqlearn.Brain(num_inputs, num_actions, opt) // start fresh
    // console.log(brain);
    qpo.caleb = {  "nn" : brain, "team" : "red", 'name': 'Caleb'}
  }

  //Dalton
  qpo.dalton = {'nn': null,  "team": "red", 'name': 'Dalton'}
  qpo.dalton.nn = new deepqlearn.Brain(num_inputs, num_actions, opt)
  if(localStorage['daltonNN']){ //retrieve saved network from local storage
    console.log("generating Dalton's net from localStorage");
    qpo.dalton.nn.value_net.fromJSON(JSON.parse(localStorage['daltonNN']));
    ;(JSON.stringify(qpo.dalton.nn) == localStorage['daltonCopy']) ? (console.log("dalton successfully reconstructed.")) : console.log("Dalton reconstruction failed.");
    ;(JSON.stringify(qpo.dalton.nn.value_net.toJSON()) == localStorage['daltonCopy2']) ? (console.log("dalton value net successfully reconstructed.")) : console.log("dalton value net reconstruction failed.");
  }
  else { //make Dalton from scratch.
    // console.log("no Dalton net found in localStorage. making new one.") //no net found in localStorage
    var brain = new deepqlearn.Brain(num_inputs, num_actions, opt) // start fresh
    // console.log(brain);
    qpo.dalton = {  "nn" : brain, "team" : "red", 'name': 'Dalton' }
  }
}
catch(err){ console.log(err) }

qpo.closingCode = function(){ //save the nets
  //save the AI nets to the database and to local storage
  try{ qpo.saveSend('ali', true, true) } // defined in aiNeural.js
  catch(err){console.log(err) }
  // localStorage['stats'] = JSON.stringify(qpo.user.getStats())
  // localStorage['yes'] = 'YES'
  return null
}

window.addEventListener("beforeunload", function(e){
  qpo.closingCode();

  (e || window.event).returnValue = null;
  return null;
});



//window.onbeforeunload = qpo.closingCode
