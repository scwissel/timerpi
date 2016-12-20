var exec = require('child_process').exec;

var lights = {

  turnon:      function () {
                    exec('/home/pi/lightson.sh');
  },

  turnoff:     function () {
                    exec('/home/pi/lightsoff.sh');
  },

  getstatus:   function (location,gpio,callback) {
                 exec('gpio -g read ' + gpio, (error, stdout, stderr) => {
                   if (error) {
                     console.error('gpio read exec error: ${error}');
                     callback(error);
                   }
                   var status = stdout.substring(0,1);
                   //console.log(`stdout: ${stdout} ${pos}`);
                   callback(null,location,status);
                   //console.log(`stderr: ${stderr}`);
                 });
                 return;
  },

};

module.exports = lights;
