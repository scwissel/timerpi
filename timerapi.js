var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { path: '/timerws/socket.io' });
var lights = require('./lights.js');
var utils = require('./utils.js');
var config = require('./config.json');
var cputemp = 0;

var relays = {};
var relayinfochanged = false;

// read CPU temp
if (config.cputempsensor.enabled) {
  setInterval(function(){
    cputemp = utils.cpuTemp();
  }, config.cputempsensor.intervalsecs * 1000);
}

// init relay information
config.relayconfig.relays.forEach(function(relay) {
  relays[relay.location] = {};
});

// read relay temps
if (config.relayconfig.tempenabled) {
  updatetemps();
  setInterval(function(){
    updatetemps();
  }, config.relayconfig.tempintervalsecs * 1000);
}

// get relay status
if (config.relayconfig.statusenabled) {
  updatestatus();
  setInterval( function () {
    updatestatus();
  }, config.relayconfig.statusintervalsecs * 1000);
}

function updatestatus() {
  config.relayconfig.relays.forEach(function(relay) {
    // read GPIO input port
    lights.getstatus(relay.location,relay.gpio,function (err, location, value) {
      if (err) {
        throw err;
      }
      origvalue = relays[location].status;
      if (value === "0") {
        relays[location].status = "Off";
      } else if (value === "1") {
        relays[location].status = "On";
      } else {
        relays[location].status = "Unknown";
      }
      if (origvalue !== relays[location].status) {
        relays[location].asofdate = new Date();
        relays[location].sincedate = new Date();
        relays.asofdate = new Date();
        relayinfochanged=true;
      }
      //console.log("location: " + location + " is " + relays[location].status);
    });
  });
  if (relayinfochanged) {
    sendioupdate();
  }
}

function sendioupdate() {
  relayinfochanged=false;
  io.emit('status',getresponse());
}

function updatetemps() {
  config.relayconfig.relays.forEach(function(relay) {
    origvalue = relays[relay.location].temp;
    temp = utils.w1Temp(relay.w1deviceid);
    relays[relay.location].temp = temp;
    if (origvalue !== relays[relay.location].temp) {
      relayinfochanged=true;
    }
    //console.log("location: " + relay.location + " temp: " + relays[relay.location].temp);
  });
  if (relayinfochanged) {
    sendioupdate();
  }
}

setInterval( function () {
  displaystatus();
}, config.relayconfig.logintervalsecs * 1000);

function displaystatus() {
  config.relayconfig.relays.forEach(function(relay) {
    console.log("location: " + relay.location + " temp: " + relays[relay.location].temp + " is " + relays[relay.location].status);
  });
}

function turnlightson() {
  lights.turnon();
}

function turnlightsoff() {
  lights.turnoff();
}

function getresponse() {
  var response = { status: "OK",
                   relays: {},
                   cputemp: cputemp,
                   message: null };
  response.relays = relays;
  return response;
}

displaystatus();

//app.use('/');

app.use(express.static(__dirname + "/www", { maxAge: 0 } ));

io.on('connection', function(socket) {
  console.log('client connected');
  socket.emit('status',getresponse());
});

// Express route for incoming requests for the garage door
app.get('/timer/:command', function(req, res) {
  var cmdresponse = getresponse();
  
  if (req.params.command === 'status') {
    // just the response is all that is needed
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'on') {
    turnlightson();
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'off') {
    turnlightsoff();
    res.status(200).send(cmdresponse);
  } else {
    cmdresponse.status = "Error";
    cmdresponse.message = "Invalid command: " + req.params.command;
    res.status(200).send(cmdresponse);
  }
}); 

// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send('Oops, Something went wrong!');
    console.log(req);
  } else {
    console.log(req);
    next(err);
  }
});

//app.listen(config.www.port);
io.listen(app.listen(config.www.port));
console.log('App Server running at port ' + config.www.port);


