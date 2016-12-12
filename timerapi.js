var express = require('express');
var app = express();
var http = require('http').createServer(app);
var lights = require('./lights.js');
var utils = require('./utils.js');
var config = require('./config.json');

function turnlightson() {
  lights.turnon();
}

function turnlightsoff() {
  lights.turnoff();
}

function getresponse() {
  var response = { status: "OK",
                   message: null };
  return response;
}

//app.use('/');

app.use(express.static(__dirname + "/www", { maxAge: 0 } ));

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
app.listen(config.www.port);
console.log('App Server running at port ' + config.www.port);


