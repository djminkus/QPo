var mlog = function(varNameStr){
  console.log(varNameStr + ": " + eval(varNameStr));
}

var mlog2 = function(varNameStr){
  console.log("   ▼ " + varNameStr + " ▼");
  console.log(eval(varNameStr));
}
