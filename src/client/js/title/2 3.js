var form = document.createElement("form");
// var spacer = document.createElement("div");
var showEmailButton = document.createElement("input"); // The button below the text input box

$(form).append(showEmailButton)

(function() { //inject the Google webfont script
  var wf = document.createElement('script');
  wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();

var font = 'Questrial'

switch(font){ //for easy font switching
  case 'Righteous':{
    WebFontConfig = { google: { families: [ 'Righteous::latin' ] } };
    break;
  }
  case 'Poppins':{
    WebFontConfig = { google: { families: [ 'Poppins:400,300,500,600,700:latin' ] } };
    break;
  }
  case 'Oxygen':{
    WebFontConfig = { google: { families: [ 'Oxygen:300,400,700:latin' ] } };
    break;
  }
  case 'Varela':{
    WebFontConfig = { google: { families: [ 'Varela+Round::latin' ] } };
    break;
  }
  case 'Questrial':{
    WebFontConfig = { google: { families: [ 'Questrial::latin' ] } };
    break;
  }
  case 'Orbitron':{
    WebFontConfig = { google: { families: [ 'Orbitron:400,500,700,900:latin' ] } };
    break;
  }
  case 'Open Sans':{
    WebFontConfig = { google: { families: [ 'Open+Sans:300,400:latin' ] } };
    break;
  }
}

COLOR_DICT = { //define colors using hex
  "blue": "#0055ff",
  "red": "#e00000",
  "orange": "#ffbb66",
  "green": "#00bb55", // shot color
  "purple":"#bb00bb", // bomb/plasma color
  'light blue':'#5588ff', // antimatter color

  "background": "#000000", //black is 0
  "grey": "#bbbbbb",
  "foreground": "#ffffff" //white is f
};

$(showEmailButton).attr({"type":"submit", "value":"show email"}) // ** MENUS START HERE ** -----------
  .css({"display": "block", "margin":"auto", "font-size":20, "border":"none", "padding":"10px", "margin-top": "10px",
  "font-family": " '" + font + "',sans-serif", "color":COLOR_DICT['foreground'], "background-color":COLOR_DICT['green']})
  .click(function(e){ // SUBMIT FORM, MAKE MENUS
    e.preventDefault() //keeps URL from changing

    // var username = $(inputUsername).val() // Get the value from the text input box
    // console.log(username)

    // Retrieve an email address from the server:
    $.post("/email", {'nah': 'no'}, function(data, status){
      console.log(data)
      console.log(status)

      var emailText = document.createElement('p');
      // TODO: change the text of this to include the data sent from the form
      // data.email should now be my gmail address in string form.
      $(emailText).text(data.email) // this should do?
    })
  });

var dang = 0;
var dang2 = false;
var dang3 = true;

// We're getting errors because of qpo.fontString, etc -- or because I'm not loading every single script.
// So, maybe let go of qpo.fontString, or define a var in here that serves the same purpose.
