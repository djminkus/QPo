var num_inputs = 218;
var num_actions = 7; // 7 possible choices for a move
var temporal_window = 4; // amount of temporal memory. 0 = agent lives in-the-moment
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way,
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 75, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 75, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
var tdtrainer_options = {
  batch_size:10,
  l2_decay:0.01,
  learning_rate:0.001,
  momentum:0.0
};

var opt = { //more options for the neural net
  'experience_size' : 500,
  'epsilon_min' : 0.05,  // Curiosity level when age = learning_steps_total
  'gamma' : 0.7,  // Discount rate
  'epsilon_test_time' : 0.05,
  'layer_defs' : layer_defs,
  'learning_steps_total' : 2500,
  'learning_steps_burnin' : 250,
  'start_learn_threshold' : 25,
  'tdtrainer_options' : tdtrainer_options,
  'temporal_window': temporal_window
}

qpo.actions = ["moveLeft","moveUp","moveRight","moveDown","shoot","bomb","stay"]
qpo.saveSend = function(name, save, send){ // Send a net to server and/or save it
  // pass 'ali', 'bryan', etc. and two Bools
  var value_net = qpo[name].nn.value_net.toJSON();
  var age = qpo[name].nn.age;
  var experience = qpo[name].nn.experience
  var name = qpo.capitalize(name);

  try { nancheck = qpo.ali.nn.value_net.layers[0]['in_act']['dw'][0] }
  catch(e){console.log(e); nancheck='ok'}
  try { nancheck2 = qpo.ali.nn.value_net.layers[6]['out_act']['w'][0] }
  catch(e){console.log(e); nancheck2='ok'}

  // If no NaN issue, send the net to server and/or save it
  if( !Object.is(nancheck, NaN) && ! Object.is(nancheck2, NaN)) {
    if(send){ // Send neural data to server:
      $.post("/neuralSend", {'name': name, 'age': age, 'value_net':value_net, 'experience': experience}, function(data, status){
        console.log(data)
        console.log(status)
      })
      console.log('ali net sent to server. ')
    }
    if(save){ //Save network in localStorage:
      // Store network in localStorage:
      try{
        localStorage['aliAge'] = JSON.stringify(qpo.ali.nn.age)
        console.log('ali age saved to localStorage. Saving value nets...')
        localStorage['aliNN'] = JSON.stringify(qpo.ali.nn.value_net.toJSON()) //stores network to local storage for persistence
        console.log('ali value net saved to localStorage. Saving experiences...')
        // localStorage['aliCopy'] = JSON.stringify(qpo.ali.nn)
        // localStorage['aliCopy2'] = JSON.stringify(qpo.ali.nn.value_net.toJSON())
        localStorage['aliExp'] = JSON.stringify(qpo.ali.nn.experience)
        console.log('ali experiences saved to localStorage.')
      }
      catch(e){ console.log(e) }
    }
  }
  else { console.log('NaN issue found when preparing to send/save Ali.') }
}

// ------- OLD CODE
qpo.convertStateToInputs = function(state){ // out of use as of Nov 30 2020
  var arr = new Array(), //final array to be fed to network as input
  q = qpo.activeGame.q,
  gridAdj = (q+1)/2, //grid adjustment
  gameBoard = qpo.guiCoords.gameBoard,
  xMid = (gameBoard.rightWall + gameBoard.leftWall) / 2,
  yMid = (gameBoard.topWall + gameBoard.bottomWall) / 2,
  xInd, yInd
  for(var i=0; i<16; i++){ //0-15 (unit coords on game board go here)
    // All of these (x and y) range from 0 to qpo.activeGame.q when unit is
    //   alive, and -1 when unit is dead. So, -1 to 8.
    arr[i] = state[i] - gridAdj
  }
  for(var i=0; i<24; i++){ //16-63 (shot Raphael coords go here)
    //x-coords range from qpo.guiCoords.gameBoard.leftWall to qpo.guiCoords.gameBoard.rightWall
    //  and have indices 2i
    //y-coords range from qpo.guiCoords.gameBoard.topWall to qpo.guiCoords.gameBoard.bottomWall
    //  and have indices 2i+1
    xInd = 16 + (2*i)
    yInd = 16 + (2*i) + 1
    arr[xInd] = xMid - state[xInd]
    arr[yInd] = yMid - state[yInd]
  }
  for(var i=0; i<24; i++){ //64-87 (shot directionalities go here)
    xInd = 16+48 + i
    arr[xInd] = state[xInd]
  }
  for(var i=0; i<32; i++){ //88-151 (bomb Raphael coords go here)
    xInd = 16+48+24 + (2*i)
    yInd = 16+48+24 + (2*i) + 1
    arr[xInd] = xMid - state[xInd]
    arr[yInd] = yMid - state[yInd]
  }
  for(var i=0; i<32; i++){ //152-183 (bomb directionalities go here)
    xInd = 16+48+24+64 + i
    arr[xInd] = state[xInd]
  }
  for(var i=0; i<32; i++){ //184-215 (bomb timers go here)
    //range from -1 to 3. Middle value is +1.
    xInd = 16+48+24+64+32 + i
    arr[xInd] = 1 - state[xInd]
  }
  var timeLag = (Date.now()) - state[216] //time since state was acquired
  arr[216] = timeLag/(3000*qpo.timeScale)  //take into account the fraction of
                                      //a turn that's elapsed since state was acquired.
  return arr
};

qpo.redRewardQueue = new Array()
qpo.sixty = {"list" : new Array(), "cursor" : 0}
