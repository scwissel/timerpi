var exec = require('child_process').exec;

var lights = {

  turnon:      function () {
                    exec('/home/pi/lightson.sh');
  },

  turnoff:     function () {
                    exec('/home/pi/lightsoff.sh');
  },

};

module.exports = lights;
