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

qpo.Scene = function(headline, body, x, y, highx, highy, highSizeModx, highSizeMody, hideHigh, promptt){
  //black pane, title text, body texts (array), prompt text, orange highlight -- 1 Scene.
  this.WIDTH = 300;
  this.HEIGHT = 200;
  this.Y = 200
  this.X = 600
  this.CENTERS = [this.X + this.WIDTH/2, this.Y + this.HEIGHT/2]; //x,y centers
  // var PADDING = 10;
  var bs = 30 //body spacing (from other body strings)
  this.pane = c.rect(600,200,this.WIDTH, this.HEIGHT).attr({"fill":"black"});
  this.head = c.text(this.CENTERS[0], this.Y+30, headline).attr({qpoText:[30,"white"]});
  this.bod = new Array();
  // for (var i=0; i<3; i++){this.bod[i]=c.text(this.CENTERS[0], (y+50) + (i+1)*bs, body[i]).attr({qpoText:[18,"white"]});}
  this.bod1 = c.text(this.CENTERS[0], this.Y+80, body[0]).attr({qpoText:[18,"white"]}); //bod for body
  this.bod2 = c.text(this.CENTERS[0], this.Y+105, body[1]).attr({qpoText:[18,"white"]});
  this.bod3 = c.text(this.CENTERS[0], this.Y+130, body[2]).attr({qpoText:[18,"white"]});
  this.promptt = c.text(this.CENTERS[0], this.Y+170, promptt).attr({qpoText:[20, qpo.COLOR_DICT['red']]});
  this.high = c.rect(highx, highy, 70+highSizeModx, 70+highSizeMody); //high for highlight
  this.high.attr({"fill":"none", "stroke":qpo.COLOR_DICT["orange"], "stroke-width":4});

  qpo.blink(this.promptt);

  this.all = c.set().push(this.pane, this.head, this.bod1, this.bod2, this.bod3, this.promptt, this.high);
  if (hideHigh) { this.high.hide(); } //hide the highlight, or don't

  return this;
}

qpo.Tut = function(){
  c.setSize(qpo.guiDimens.gpWidth+qpo.guiDimens.tpWidth, qpo.guiDimens.gpHeight);
  qpo.activeGame = new qpo.Game(7,1,'tut',false,true,99);
  qpo.drawGUI(7,1); //q=7, po=1;
  controlPanel.resetIcons();
  activeScreen = "tut";
  this.status = -1;
  // var blue0, red0, turnNumber;
  this.blue0;
  this.red0;
  this.turnNumber;

  this.scenes = [ //Generate first few scenes (in side panel.)
    new qpo.Scene("Welcome!",["Welcome to Q-Po. Let's", "get you up to speed.",""],50,50,0,0,0,0,true,
        "Press enter to continue."),
    new qpo.Scene("Units",["This is a unit. Destroy enemy", "units to score points and"," win the round."],150,50,65,115,0,0,false,
      "Press enter to continue."),
    new qpo.Scene("Turns",["This is the turn timer.", "One turn takes about one second.",
      "Each unit gets one move per turn."],250,50,380,180,70,70,false,
      "Press enter to continue."),
    new qpo.Scene("Control Panel",["This is the control panel. It shows", "you your plans. Every command",
      "you give shows up here."],100,250,10,410,320,60,false,
      "Press enter to continue."),
    new qpo.Scene("Moving",["When the turn timer hits 0, your", "units follow your commands. Let's",
      'learn the commands!'],100,250,10,410,320,60,false,
      "Press enter to continue.")
  ];

  for(i=1; i<this.scenes.length; i++){this.scenes[i].all.hide();}//hide all except the first one
  this.status=0;
  controlPanel.orange.hide();

  this.transition = function(){ // Transition between scenes, and increment this.status
    if(this.status < 4){ // Remove raphs from old scene, update this.status, show the raphs from the new one
      this.scenes[this.status].all.animate({'opacity':0},500);
      setTimeout(function(){ //remove old els and show new ones
        this.scenes[this.status].all.remove();
        this.status++;
        this.scenes[this.status].all.show();
        this.scenes[this.status].all.attr({'opacity':0});
        this.scenes[this.status].all.animate({'opacity':1}, 500);
      }.bind(this),500);
    }
    else { this.status++; }// Just update this.status
  }

  this.tutFuncs = { //functions to be called on "enter" keypress (and maybe others?)
    "enter": function(){ // enter/return key (transition to next scene)
      switch(qpo.tut.status){
        case 0: //transition from "welcome" to "units"
          qpo.tut.blue0 = new makeUnit("blue",1,1,0);
          qpo.tut.red0 = new makeUnit("red",1,5,0);
          qpo.tut.red0.rect.toBack();
          controlPanel.changeIcon("stay");
          break;
        case 1: //transition from "units" to "turns"
          var timerAnim = Raphael.animation({
            "0%" : {segment: [450, 250, 50, -90, 269]},
            "100%" : {segment: [450, 250, 50, -90, -90]}
          }, 3000).repeat("Infinity");
          qpo.timer.pie.animate(timerAnim);
          break;
        case 2: //transition from "turns" to "control panel 1"
          // qpo.timer.pie.stop();
          // qpo.timer.pie.attr({segment: [450, 250, 50, -90, 269]});
          break;
        case 3: //transition from "control panel" to "moving"
          break;
        case 4: //transition from "moving" (scene) to keyboard controls (screen)
          qpo.gui.remove(); //remove the game gui
          qpo.tut.scenes[4].all.remove();
          qpo.tut.controlsScreen = qpo.tut.makeControlsScreen(this);
          break;
        case 5: //transition from keyboard controls to "try it out"
          qpo.fadeOut(qpo.tut.controlsScreen.all, function(){
            qpo.tut.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
            qpo.tut.scenes[5] = new qpo.Scene("1v1 the AI",["Beat me!", '1st to 4 wins!',
              ' ~ Alice'], 170, 250, 10,410,320,60,true, "Press enter to continue.");
            qpo.tut.scenes[5].all.transform('t-500,0');
          })
          break;
        case 6: //start a game.
          qpo.fadeOut(qpo.tut.scenes[5].all, function(){
            qpo.tut.blackness.remove();
            c.setSize(qpo.guiDimens.gpWidth, qpo.guiDimens.gpHeight);
            qpo.countdownScreen([7,1,'tut',false,true]);
          })
          break;
        case 7: //the game was ended. Get ready for 2v2.
          qpo.tut.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
          qpo.tut.scenes[7] = new qpo.Scene("Game Over",["That was 1v1.","Let's try 2v2.",
            "Get ready to multitask."], 170, 250, 10,410,320,60,true, "Press enter to continue.");
          qpo.tut.scenes[7].all.transform('t-500,0').attr({'opacity':0});
          qpo.fadeIn(qpo.tut.scenes[7].all);
          break;
        case 8: //Start a 2v2 game
          qpo.fadeOut(qpo.tut.scenes[7].all, function(){
            qpo.tut.blackness.remove();
            qpo.countdownScreen([7,2,'tut',false,true]);
          });
          break;

          // qpo.drawGUI(7,2); //q=7, po=1;
          // controlPanel.resetIcons();
          // qpo.tut.scenes[8] = new qpo.Scene("Q and Po",["Q is the size of the grid.", 'Po is the units per team.',
          //   ' ~ Alice'], 170, 250, 10,410,320,60,true, "Press enter to continue.");
        case 9: //2v2 game over, get ready for 5v5
          qpo.tut.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
          qpo.tut.scenes[9] = new qpo.Scene("Game Over",["That's just the beginning.",
           "Let's try 5v5.",""], 170, 250, 10,410,320,60,true, "Press enter to continue.");
          qpo.tut.scenes[9].all.transform('t-500,0').attr({'opacity':0});
          qpo.fadeIn(qpo.tut.scenes[9].all);
          break;
        case 10: // Start a 5v5 game
          qpo.fadeOut(qpo.tut.scenes[9].all, function(){
            qpo.tut.blackness.remove();
            qpo.countdownScreen([10,5,'tut',false,true]);
          });
          break;
        case 11: //5v5 game over, say bye
          qpo.tut.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
          qpo.tut.scenes[11] = new qpo.Scene("Game Over",["Now you know how to play.",
           "Have fun :)"," ~ Alice"], 170, 250, 10,410,320,60,true, "Press enter to continue.");
          qpo.tut.scenes[11].all.transform('t-500,0').attr({'opacity':0});
          qpo.fadeIn(qpo.tut.scenes[11].all);
          break;
        case 12: //send 'em back to the main menu
          qpo.fadeOut(qpo.tut.scenes[11].all, function(){
            qpo.tut.blackness.remove();
            qpo.mode = 'menu';
            qpo.menus['main'] = qpo.makeMainMenu();
          });
          break;
        default: //default case
          console.log("You forgot a 'break', David.");
          break;
      }
      qpo.tut.transition();
    },
  };

  this.makeControlsScreen = function(tutt){
    this.blackness = c.rect(0,0,600,600).attr({"fill":"black"});
    this.keys = c.set().push(
      c.rect(40, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.rect(100, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.rect(160, 40, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.rect(50, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.rect(110, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.rect(170, 100, 50, 50, 10).attr({"stroke":"white","stroke-width":2}),
      c.text(65, 65, "Q").attr({qpoText:[20]}),
      c.text(125, 65, "W").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(185, 65, "E").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(75, 125, "A").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(135, 125, "S").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(195, 125, "D").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
    );
    this.labels = c.set().push(
      c.path("M50,30 L-20,-20").attr({"stroke":"white","stroke-width":2}),
      c.path("M125,30 L125,-10").attr({"stroke":"white","stroke-width":2}),
      c.path("M190,30 L240,-10").attr({"stroke":"white","stroke-width":2}),
      c.path("M40,150 L-20,200").attr({"stroke":"white","stroke-width":2}),
      c.path("M130,160 L130,200").attr({"stroke":"white","stroke-width":2}),
      c.path("M200,160 L240,200").attr({"stroke":"white","stroke-width":2}),
      c.text(55 - 3*30, 35 - 3*30 + 20, "Bomb").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(125, 65 - 3*30, "Move Up").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(185 + 3*30, 65 - 3*30, "Shoot").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(65 - 3*30, 155 + 3*30 - 20, "Move Left").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(135, 125 + 3*30, "Move Down").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"}),
      c.text(195 + 3*30, 125 + 3*30, "Move Right").attr({"fill":"white","font-size":20,"font-family":"'Open Sans',sans-serif"})
    );

    this.keys.transform("t170,170");
    this.labels.transform("t170,170");

    this.shot = c.rect(450,100,6,20).attr({"fill":qpo.COLOR_DICT["green"],'opacity':0.5});
    this.bomb = c.rect(130,100,14,14).attr({"fill":qpo.COLOR_DICT["purple"],'opacity':0.5});

    this.promptt = c.text(300,500, "Press enter to continue.")
      .attr({qpoText:[20, qpo.COLOR_DICT["red"]]});

    qpo.blink(this.promptt);
    this.all = c.set().push(this.blackness, this.keys, this.labels, this.promptt, this.shot, this.bomb);
    this.all.attr({'opacity':0});
    this.all.animate({'opacity':1},500);
    return this;
  };
};
