//Set up the menu objects and open the title screen.
qpo.Menu = function(titleStr, itemList, parent, placeholder, makeDoodad, and){ // A Menu contains a CursorList of MenuOptions
  this.titleStr = titleStr
  this.TITLE_SIZE = 40
  this.makeDoodad = makeDoodad || function(){return c.circle(-5,-5, 1)} // A function that returns a raph set
  this.and = and || function(){} //callback to be called when this menu is opened

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

    // qpo.makeMuteButton();

    this.cl.render();

    this.doodad = this.makeDoodad()

    this.next = this.cl.next
    this.previous = this.cl.previous

    this.all = c.set().push(this.layer1, this.layer2, this.doodad)
    for(var i=0; i < this.cl.length; i++){ this.all.push(this.cl.list[i].raphs) }
    qpo.fadeIn(this.all, 500);
    // qpo.fadeInGlow(qpo.glows);

    this.and()
  }

  this.parent = qpo.menus[parent.toLowerCase()] || 'title'
  this.up = function(){ this.close({'destination':'parent'}) }

  this.children = {}

  this.close = function(obj, time){ //clear the canvas and open the next screen
    qpo.ignore(time)
    this.all.stop()
    // qpo.fadeOutGlow(qpo.glows, function(){}, time);
    qpo.fadeOut(this.all, function(){ //clear canvas, do stuff based on "obj" argument
      this.cl.select(0)
      c.clear();
      this.all = null; //remove reference to raphs too
      switch(obj.destination){ //go to title screen, parent menu, mission, or game
        case 'title': { qpo.titleScreen = new qpo.displayTitleScreen(); break; }
        case 'parent' : { this.parent.open(); break; }
        case 'child' : { this.children[obj.childName].open(); break;}
        case 'mission' : { qpo.missions[obj.missionChapter][obj.missionNumber].begin(); break;}
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

    // this.board = new qpo.Board(1, 7, 200, 120, 40);
    // qpo.board = this.board;
    // this.layer2 = c.set().push(this.board.all);

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
    this.complete = qpo.user.campaignProgress[this.mission.chapter][this.mission.number-1]

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
      }
    )
  } else {
    qpo.muteButton = c.rect(-5,-5,2,2) //to prevent errors
  }
}

qpo.makeMenus = function(){ //Lay out the menu skeletons (without creating Raphael elements, except the Main Menu's)
  console.log('making menus')
  qpo.mode = "menu" // Type of screen that's active -- can be "menu", "game", "tut", or "other"

  qpo.menus = {}
  var x = 50,
  yStart = 100,
  yInt = 50, //vertical distance between menu item anchor points (in pixels)
  xSq = 100, //x for campaign menu options

  bitsX = 250,
  bitsY = 100,
  bitsXR = 270,
  bitsYR = 400

  // qpo.loadUser()

  //make all the menus:
  qpo.menus['main menu'] = new qpo.Menu('Main Menu', [
    new qpo.MenuOption(x, yStart + yInt,'Campaign', function(){}, 'Main Menu', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'vs. CPU', function(){}, 'Main Menu', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Multiplayer', function(){}, 'Main Menu', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Settings', function(){}, 'Main Menu', false, 'stay', 'blue', 3)
  ], 'title', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, qpo.colors, 29)}, function(){
    qpo.leftPane = $("#raphContainer")
    qpo.leftPane.css({'float': 'left', 'margin-left': '50px'});
    if (qpo.user.leveller === undefined) {qpo.user.leveller = new qpo.Leveller(200, 300, 100, qpo.user)}
  })
  qpo.menus['main menu'].up = function(){/*qpo.menus['main menu'].close({'destination':'title'})*/}
  qpo.menus['main menu'].cl.list[0].action = function(){ qpo.menus['main menu'].close('campaign') }
  qpo.menus['main menu'].cl.list[1].action = function(){ qpo.menus['main menu'].close('vs. cpu') }
  qpo.menus['main menu'].cl.list[2].action = function(){ qpo.menus['main menu'].close('multiplayer') }
  qpo.menus['main menu'].cl.list[3].action = function(){ qpo.menus['main menu'].close('settings') }

  qpo.menus['campaign'] = new qpo.Menu('Campaign', [
    new qpo.MenuOption(x, yStart + yInt,'Easy', function(){}, 'Campaign', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'Medium', function(){}, 'Campaign', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Hard', function(){}, 'Campaign', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'Campaign', false, 'stay', 'blue', 3)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.blue], 29)});
  qpo.menus['campaign'].cl.list[0].action = function(){ qpo.menus['campaign'].close({
    'destination':'child',
    'childName':'easy'
  }, 1000); }
  qpo.menus['campaign'].cl.list[1].action = function(){ qpo.menus['campaign'].close({
    'destination':'child',
    'childName':'easy'
  }, 1000); }
  qpo.menus['campaign'].cl.list[2].action = function(){ qpo.menus['campaign'].close({
    'destination':'child',
    'childName':'easy'
  }, 1000); }
  qpo.menus['campaign'].cl.list[3].action = qpo.menus['campaign'].up.bind(qpo.menus['campaign'])

  qpo.menus['campaign'].children.easy = qpo.menus.easy = new qpo.CampaignChapterMenu('Easy', [
    new qpo.CampaignMissionOption(xSq, yStart + yInt,'1', function(){}, 'easy', true, false, 0, qpo.chapters.easy.missions[1]),
    new qpo.CampaignMissionOption(xSq, yStart + 2*yInt,'2', function(){}, 'easy', false, false, 1, qpo.chapters.easy.missions[2]),
    new qpo.CampaignMissionOption(xSq, yStart + 3*yInt,'3', function(){}, 'easy', false, false, 2, qpo.chapters.easy.missions[3]),
    new qpo.MenuOption(x, yStart + 5*yInt,'Back', function(){}, 'easy', false, 'stay', 'blue', 3)
  ], 'Campaign', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.blue], 29)})
  qpo.menus['campaign'].children.easy.cl.list[0].action = function(){ qpo.menus['campaign'].children.easy.close({
    'destination':'mission',
    'missionChapter':'easy',
    'missionNumber':1
  }, 1000); }
  qpo.menus['campaign'].children.easy.cl.list[3].action = qpo.menus['campaign'].children.easy.up.bind(qpo.menus['campaign'].children.easy)
  // qpo.menus['Campaign'].cl.list[1].action = function(){ qpo.menus['Campaign'].close({
  //   'destination':'mission',
  //   'missionChapter':'easy',
  //   'missionNumber':2
  // }, 1000); }
  // qpo.menus['Campaign'].cl.list[1].action = function(){ qpo.menus['Campaign'].close('Mission 2', 1000); }
  // qpo.menus['Campaign'].cl.list[2].action = function(){ qpo.menus['Campaign'].close('Mission 3', 1000); }
  // qpo.menus['Campaign'].cl.list[3].action = function(){ qpo.menus['Campaign'].close('Mission 4', 1000); }

  qpo.menus['vs. cpu'] = new qpo.Menu('vs. CPU', [
    new qpo.MenuOption(x, yStart + yInt,'1-Po', function(){}, 'vs. CPU', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'2-Po', function(){}, 'vs. CPU', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'3-Po', function(){}, 'vs. CPU', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'vs. CPU', false, 'stay', 'blue', 3)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.red], 29)});
  qpo.menus['vs. cpu'].cl.list[0].action = function(){ qpo.menus['vs. cpu'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':6, 'po':2, 'ppt': 2,
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
  qpo.menus['vs. cpu'].cl.list[2].action = function(){ qpo.menus['vs. cpu'].close({
    'destination':'game',
    'gameArgs': {
      'type':'single', 'q':9, 'po':9, 'ppt':3,
      'bluePlayers': [qpo.user.toPlayer({'team':'blue', 'number': 0})]
    }
  }, 1000); }
  qpo.menus['vs. cpu'].cl.list[3].action = qpo.menus['vs. cpu'].up.bind(qpo.menus['vs. cpu'])

  qpo.menus['multiplayer'] = new qpo.Menu('Multiplayer', [
    new qpo.MenuOption(x, yStart + yInt,'2-Po', function(){}, 'Multiplayer', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'3-Po', function(){}, 'Multiplayer', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'4-Po', function(){}, 'Multiplayer', false, 'stay', 'blue', 2),
    new qpo.MenuOption(x, yStart + 4*yInt,'Main Menu', function(){}, 'Multiplayer', false, 'stay', 'blue', 3)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.green], 29)});
  qpo.menus['multiplayer'].cl.list[0].action = function(){ qpo.menus['multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':6, 'po':2
  }, 1000); }
  qpo.menus['multiplayer'].cl.list[1].action = function(){ qpo.menus['multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':7, 'po':2
  }, 1000); }
  qpo.menus['multiplayer'].cl.list[2].action = function(){ qpo.menus['multiplayer'].close({
    'destination':'game',
    'type':'multi', 'q':8, 'po':3
  }, 1000); }
  qpo.menus['multiplayer'].cl.list[3].action = qpo.menus['multiplayer'].up.bind(qpo.menus['multiplayer'])

  qpo.menus['settings'] = new qpo.Menu('Settings', [
    new qpo.MenuOption(x, yStart + 1*yInt,'coming', function(){}, 'Settings', true, 'stay', 'blue', 0),
    new qpo.MenuOption(x, yStart + 2*yInt,'soon', function(){}, 'Settings', false, 'stay', 'blue', 1),
    new qpo.MenuOption(x, yStart + 3*yInt,'Main Menu', function(){}, 'Settings', false, 'stay', 'blue', 2)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.orange], 29)});
  qpo.menus['settings'].cl.list[0].action = function(){ qpo.menus['settings'].close({'destination':'parent'}); }
  qpo.menus['settings'].cl.list[1].action = function(){ qpo.menus['settings'].close({'destination':'parent'}); }
  qpo.menus['settings'].cl.list[2].action = qpo.menus['settings'].up.bind(qpo.menus['settings'])

  qpo.menus['match complete'] = new qpo.Menu('Match Complete',[
    new qpo.MenuOption(x, yStart + 1*yInt, 'Main Menu', function(){}, 'Match Complete', true, 'stay', 'blue', 0)
  ], 'Main Menu', false, function(){qpo.makeBits(bitsX, bitsY, bitsXR, bitsYR, [qpo.COLOR_DICT.purple], 29)});
  qpo.menus['match complete'].cl.list[0].action = function(){ qpo.menus['match complete'].close({'destination':'parent'}); }

  qpo.menus['main menu'].open()
}
qpo.loadUser = function(){
  //TODO: get user data from server:

  // From http://stackoverflow.com/a/4033310/3658320 :
  // (function(theUrl, callback){
  //   var xmlHttp = new XMLHttpRequest();
  //   xmlHttp.onreadystatechange = function() {
  //       if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
  //           callback(xmlHttp.responseText);
  //   }
  //   xmlHttp.open("GET", theUrl, true); // true for asynchronous
  //   xmlHttp.send(null);
  // })(/*url*/, function(){})

  //THE USER'S DETAILS SHOULD ARRIVE IN THE RESPONSE TO THE "POST" REQUEST -- SEE app.post() in server.js

  qpo.user = new qpo.User()
}

// ****** ENTRY POINT
// qpo.makeMenus()
// qpo.menus['main menu'].open()

//----------OLD LOCAL MODE STUFF---------
qpo.freshUser = true
if (qpo.freshUser){ localStorage['stats'] = undefined }
qpo.devMode = true
qpo.freshStart = true // for neural nets

qpo.openingCode = function(){ //get an AI net ready, either from storage or fresh
  if(qpo.freshStart){ //delete Ali from local storage.
    localStorage['aliNN']=null
    // console.log("Ali was deleted")
  }

  // console.log('opening code!')

  try { //retrieve saved AI or generate new one
    qpo.ali = {'nn': null,  "team": "red"}
    qpo.ali.nn = new deepqlearn.Brain(num_inputs, num_actions, opt)
    if(localStorage['aliNN'] !== "null"){ //retrieve saved network from local storage
      // console.log("generating Ali's net from localStorage");
      qpo.ali.nn.value_net.fromJSON(JSON.parse(localStorage['aliNN']))
      // (JSON.stringify(qpo.ali.nn) == localStorage['aliCopy']) ? (console.log("ali successfully reconstructed.")) : console.log("ali reconstruction failed.");
      // (JSON.stringify(qpo.ali.nn.value_net.toJSON()) == localStorage['aliCopy2']) ? (console.log("ali value net successfully reconstructed.")) : console.log("ali value net reconstruction failed.");
    }
    else { //make Ali from scratch.
      // console.log("no net found in localStorage. making new one.") //no net found in localStorage
      var brain = new deepqlearn.Brain(num_inputs, num_actions, opt) // start fresh
      // console.log(brain);
      qpo.ali = {  "nn" : brain, "team" : "red" }
    }
  }
  catch(err){ console.log(err) }

  return null
};
window.onload = qpo.openingCode

qpo.closingCode = function(){ //save the net
  try{ //save the AI net to local storage
    localStorage['aliNN'] = JSON.stringify(qpo.ali.nn.value_net.toJSON()) //stores network to local storage for persistence
    localStorage['aliCopy'] = JSON.stringify(qpo.ali.nn)
    localStorage['aliCopy2'] = JSON.stringify(qpo.ali.nn.value_net.toJSON())
  }
  catch(err){ console.log("uh-oh. Looks like there's no network to store.") }
  // localStorage['stats'] = JSON.stringify(qpo.user.getStats())
  // localStorage['yes'] = 'YES'
  return null
}
window.onbeforeunload = qpo.closingCode
