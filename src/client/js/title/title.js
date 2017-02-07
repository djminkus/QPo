
qpo.displayTitleScreen = function(){ //Called whenever title screen is displayed
  qpo.activeMenu = "title"
  qpo.mode = "menu"
  qpo.activeMission = qpo.missions[0] = new qpo.Mission([false,0,false])

  //1ST LAYER (background blackness)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"})
  this.layer1 = c.set().push(this.blackness)

  // qpo.makeMuteButton();

  //2ND LAYER (foreground) :
  this.bits = new qpo.Bits2(c.width/2, false, [qpo.COLOR_DICT['green'], qpo.COLOR_DICT['purple']])
  this.layer2 = c.set().push(this.bits.all)

  //3rd layer (board, title, and prompt)
  var m = 100
  this.board = new qpo.Board(2,1, c.width/2-m, c.height/2 - m*3/2, m)
  this.title = c.text(c.width/2, c.height/2-m, 'Q-Po').attr({qpoText:64})
  this.promptt = c.text(c.width/2, c.height/2+m, "press spacebar to start")
    .attr({qpoText:[32, qpo.COLOR_DICT["orange"]]});
  qpo.blink(this.promptt)
  this.layer3 = c.set().push(this.board.all, this.title, this.promptt)

  this.all = c.set()
  this.all.push(this.layer1, this.layer2, this.layer3)
  this.all.attr({'opacity':0})
  qpo.fadeIn(this.all)

  this.close = function(){ //clear screen and make next menu
    this.all.unclick() //disable further clicks
    this.bits.bye()

    var timeScale = 4,
      totalLength = 500 //length of closing animation if timeScale is 1

    //FADE THINGS OUT:
    qpo.ignore(400*timeScale) //ignore further keyboard input.
    this.promptt.stop()
    qpo.fadeOut(this.promptt, function(){}, .25*totalLength*timeScale);
    qpo.fadeOutGlow(qpo.glows, function(){}, .25*totalLength*timeScale);
    qpo.fadeOut(this.board.all, function(){}, .25*totalLength*timeScale);
    this.title.animate({
      '40%': {'opacity':.3},
      '100%': {'opacity':1}
    }, .4*totalLength*timeScale, function(){ qpo.glows.push( this.title.glow({'color':'white'}) ) }.bind(this) )

    setTimeout(function(){ //clear canvas, open next menu
      qpo.fadeOutGlow(qpo.glows, function(){}, .6*totalLength*timeScale)
      qpo.fadeOut(this.title, function(){ //clear canvas, open next menu
        c.clear()
        qpo.guiCoords.gameBoard.leftWall = 25
        qpo.guiCoords.gameBoard.topWall = 75
        // for(var i=0; i<100; i++){
        //   c.circle(i*3, 500*(1-qpo.userExpLevels[i]/1000), 2).attr({'fill':"white"})
        // }
        qpo.login()
      }, .6*totalLength*timeScale)
    }.bind(this), .4*totalLength*timeScale)
  };
  this.all.click( function(){this.close()}.bind(this) )

  return this;
}
qpo.login = function(){ //prompt the user to create an account or log in.
  qpo.mode='login'
  // $("#raphContainer").css({"display":"none"})
  // $("#raphContainer2").css({"display":"none"})

  $("#raphContainer").hide()
  $("#raphContainer2").hide()
  var form = document.createElement("form"),
    spacer = document.createElement("div"),
    inputUsername = document.createElement("input"),
    // inputPassword = document.createElement("input"),
    inputSubmit = document.createElement("input")

  // Style the new elements:
  $(spacer).css({"height":"200px"}).attr({"display":"block"})
  $(inputUsername).attr({"type":"text", "autocomplete":"off", "autofocus":"on",
    "name":"username", "placeholder":"username"})
    .css({"display": "block", "margin":"auto", "font-size": 28, "border":"none", "text-align":"center",
      "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['background']}),
  // $(inputPassword).attr({"type":"password", "autocomplete":"off",
  //   "name":"password", "placeholder":"password"})
  //   .css({"display": "block", "margin":"auto", "font-size": 28, "border":"none", "text-align":"center",
  //   "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['background']}),
  $(inputSubmit).attr({"type":"submit", "value":"Play"}) // ** MENUS START HERE ** -----------
    .css({"display": "block", "margin":"auto", "font-size":20, "border":"none", "padding":"10px", "margin-top": "10px",
    "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['green']})
    .click(function(e){ // SUBMIT FORM, MAKE MENUS
      e.preventDefault() //keeps URL from changing

      var username = $(inputUsername).val()
      // console.log(username)
      $.post("/menu", {'username': username}, function(data, status){ //create user session state on client, from data received
        // console.log(data)
        qpo.user = new qpo.User(data)

        $("form").fadeOut(400, function(){ //bring the Raph papers back and make the menus
          $(spacer).hide()

          $("#raphContainer").show()
          $("#raphContainer2").show()

          qpo.makeMenus(true) //see menu.js.
          // It's in the main menu's "and" function that the 
        })
      })
    });

  $(form, inputUsername, inputSubmit).hide().fadeIn()

  $("#raphContainer").after(spacer, form)
  $("form").append(inputUsername,
    // inputPassword,
    inputSubmit)
}

qpo.devOption = 'title'
switch(qpo.devOption){ // **ENTRY POINT** ---------------------------
  case 'main': { //open main menu
    qpo.user = new qpo.User()
    qpo.makeMenus(true)
    break
  }
  case 'title': { //show title screen
    qpo.titleScreen = new qpo.displayTitleScreen()
    break
  }
  case 'login': { //show login screen
    qpo.login()
    break
  }
  case 'easy': { //show "easy" campaign chapter menu (not implemented)
    break
  }
  case 'game': { //start a game immediately
    qpo.user = new qpo.User()
    qpo.activeGame = new qpo.Game()
    qpo.makeMenus(false)
    break
  }
  default: {
    qpo.titleScreen = new qpo.displayTitleScreen()
    break
  }
}
