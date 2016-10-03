/*     karpathy's "REVISION: 'ALPHA'" pattern
var QpoUtil = QpoUtil || { REVISION: 'ALPHA' };
(function(global){
  var InnerModule = function(p1,p2){ //constructor for exported "Class"
    this.property1 = p1;
    this.property2 = p2;
    this.method = function(){
      return output;
    }
  }
  global.InnerModule = InnerModule;
})(QpoUtil)
*/

var QpoUtil = (function(){
  this.CursorList = function(list, initialCursorPosition){
    this.list = list;
    this.selectedItem = this.list[initialCursorPosition];
    return this;
  }
  return this;
})();

(function(lib) {
  "use strict";
  if (typeof module === "undefined" || typeof module.exports === "undefined") {
    window.QpoUtil = lib; // in ordinary browser, attach library to window
  } else {
    module.exports = lib; // in nodejs
  }
})(QpoUtil);
