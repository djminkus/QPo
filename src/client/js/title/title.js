
qpo.displayTitleScreen = function(){ //Called whenever title screen is displayed
  qpo.activeMenu = "title";
  qpo.mode = "menu";
  qpo.activeMission = qpo.missions[0] = new qpo.Mission([false,0,false])

  //1ST LAYER (background blackness)
  this.blackness = c.rect(0,0,c.width,c.height).attr({"fill":"black"});
  this.layer1 = c.set().push(this.blackness);

  // qpo.makeMuteButton();
  // qpo.activeGame = new qpo.Game(11, 3, false, false, true); //needed for menus. UNACCEPTABLE.

  //2ND LAYER (foreground) :
  this.bits = c.set()
  this.bitsLeft = c.set();
  this.bitsRight = c.set();
  var colors = [qpo.COLOR_DICT['green'], qpo.COLOR_DICT['purple']]
  for (var i=0; i<23; i++){ //generate some pixelly starlike things.
    var size = 13 * Math.random()
    var time = 67*size

    var ind = Math.floor(2*Math.random())
    var color1 = colors[ind]
    var color2
    ind ? (color2 = colors[ind-1]) : (color2 = colors[ind+1])

    var x = c.width/2*Math.random()
    var y = c.height*Math.random()


    var newBit1 = c.rect(x, y, size, size).attr({'stroke':color1}).data('i', i)
    qpo.blink(newBit1, time)
    var newBit2 = c.circle(c.width-x, c.height-y, size/Math.sqrt(2)).attr({'stroke':color2}).data('i', i)
    qpo.blink(newBit2, time)

    this.bits.push(newBit1, newBit2)
    this.bitsLeft.push(newBit1)
    this.bitsRight.push(newBit2)
  }
  this.bits.attr({'fill':'none', 'stroke-width': 2});
  this.layer2 = c.set().push(this.bits);

  //3rd layer (board, title, and prompt)
  var m = 100;
  this.board = new qpo.Board(2,1, c.width/2-m, c.height/2 - m*3/2, m);
  this.title = c.text(c.width/2, c.height/2-m, 'Q-Po').attr({qpoText:64})
  this.promptt = c.text(c.width/2, c.height/2+m, "press spacebar to start")
    .attr({qpoText:[32, qpo.COLOR_DICT["orange"]]});
  qpo.blink(this.promptt);
  this.layer3 = c.set().push(this.board.all, this.title, this.promptt);

  this.all = c.set();
  this.all.push(this.layer1, this.layer2, this.layer3);
  this.all.attr({'opacity':0});
  qpo.fadeIn(this.all);

  this.close = function(){ //clear screen and make next menu
    //PART THE SEA OF BITS:
    var timeScale = 4,
      totalLength = 500, //length of closing animation if timeScale is 1
      HW = c.width/2, //half width
      bitAnimLength = .2
    this.bitsLeft.forEach(function(item, index){
      var DISPLACEMENT = 1 - ( item.getBBox().x / HW ) // displacement from center
      var DELAY = DISPLACEMENT * ( (1-bitAnimLength) * timeScale)
      // console.log(delay)
      setTimeout(function(){
        item.animate({'transform':'t-'+(HW + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
        // console.log(item)
        // debugger;
      }.bind(this), DELAY)
    })
    this.bitsRight.forEach(function(item, index){
      var DISPLACEMENT = 1 - (c.width-item.getBBox().x2)/HW
      var DELAY = DISPLACEMENT * (1-bitAnimLength * timeScale)
      setTimeout(function(){
        item.animate({'transform':'t'+(HW + DISPLACEMENT + 20)+',0'}, (bitAnimLength*totalLength*timeScale), '>')
      }.bind(this), DELAY)
    })

    //FADE THINGS OUT:
    qpo.ignore(400*timeScale) //ignore further input. (not perfect)
    this.promptt.stop();
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
        c.clear();
        qpo.guiCoords.gameBoard.leftWall = 25;
        qpo.guiCoords.gameBoard.topWall = 75;
        qpo.login()
        // qpo.menus['main menu'].open();
      }, .6*totalLength*timeScale)
    }.bind(this), .4*totalLength*timeScale)
  };
  this.all.click(function(){ this.close() }.bind(this));

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
  // console.log(inputUsername)
  // console.log($(inputUsername))
  // console.log($("inputUsername"))
  // console.log($("#inputUsername"))

  // $(form).attr({"action":"menu", "method":"POST"})
  $(spacer).css({"height":"200px"}).attr({"display":"block"})
  $(inputUsername).attr({"type":"text", "autocomplete":"off", "autofocus":"on",
    "name":"username", "placeholder":"username"})
    .css({"display": "block", "margin":"auto", "font-size": 28, "border":"none", "text-align":"center",
      "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['background']}),
  // $(inputPassword).attr({"type":"password", "autocomplete":"off",
  //   "name":"password", "placeholder":"password"})
  //   .css({"display": "block", "margin":"auto", "font-size": 28, "border":"none", "text-align":"center",
  //   "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['background']}),
  $(inputSubmit).attr({"type":"submit", "value":"Play"})
    .css({"display": "block", "margin":"auto", "font-size":20, "border":"none", "padding":"10px", "margin-top": "10px",
    "font-family":qpo.fontString, "color":qpo.COLOR_DICT['foreground'], "background-color":qpo.COLOR_DICT['green']})
    .click(function(e){
      e.preventDefault()

      var username = $(inputUsername).val()
      // console.log(username)
      $.post("/menu", {'username': username}, function(data, status){
        // alert("Data: " + data + " \nStatus: " + status);
        console.log('1')
        // console.log('other one')
        // console.log(data)
        // qpo.user = JSON.parse(data)
        qpo.user = new qpo.User(data)

        $("form").hide()
        $(spacer).hide()
        // $("#raphContainer").css({"display":"inline"})
        // $("#raphContainer2").css({"display":"inline"})
        $("#raphContainer").show()
        $("#raphContainer2").show()


        console.log('2')
        qpo.makeMenus()
        console.log('3')
      })
    }),

  $("#raphContainer").after(spacer, form)
  $("form").append(inputUsername,
    // inputPassword,
    inputSubmit)
}

qpo.titleScreen = new qpo.displayTitleScreen();
