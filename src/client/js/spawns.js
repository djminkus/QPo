qpo.spawns = (function(){ //create the "spawns" module
  
  return this;
})();

(function(mod) { //attach this module to window object (browser) or export as module (in Node)
  "use strict";
  if (typeof module === "undefined" || typeof module.exports === "undefined") {
    window.qpo.spawns = mod; // in ordinary browser attach library to window
  } else {
    module.exports = mod; // in nodejs
  }
})(qpo.spawns);
