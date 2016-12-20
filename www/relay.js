
function getdow(date) {
  var weekday = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
  return weekday[date.getDay()];
}

function getage(date) {
  if (!date) return "";
  var now = new Date();
  var then = new Date(date);
  var secs = (now.getTime() - then.getTime()) / 1000;
  if (secs < 30) return "just now";
  if (secs < 60) return "a minute ago";
  if (secs < 120) return "a few minutes now";
  var mins = secs / 60;
  if (mins < 100) return Math.round(mins) + " minutes";
  var hours = mins / 60;
  return Math.round(hours) + " hours";
}

function getduration(startdate,enddate) {
  var secs = Math.trunc((enddate.getTime() - startdate.getTime()) / 1000);
  return secs;
} 

function gettextduration(startdate,enddate) {
  var secs = Math.trunc((enddate.getTime() - startdate.getTime()) / 1000);
  if (secs < 60) return secs + " second" + (secs > 1 ? "s" : "");
  var mins = Math.trunc(secs / 60);
  if (mins < 60) return mins + " minute" + (mins > 1 ? "s" : "");
  var hours = Math.trunc(mins / 60);
  var lmins = mins - (hours * 60); 
  if (lmins > 0) return hours + " hour" + (hours > 1 ? "s " : " ") + lmins + " minute" + (lmins > 1 ? "s" : "");
  return hours + " hour" + (hours > 1 ? "s" : "");
}

function getdatestring(d) {
  //var datestring = ("0"+(d.getMonth()+1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) +
  //  " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  var datestring = getdow(d) + " " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
  return datestring;
}

function displayunknown() {
  var data = {
    status: "Error",
    relays: {},
    asofdate: null,
    message: "Disconnected from server." 
  }
  displaystatus(data);
}

function updaterelaystatus(data,relay) {
  $('#'+relay+'relaystatus').html(data['relays'][relay]['status']);
  if (data['relays'][relay]['status'] === 'Off') {
    $('#'+relay+'relaystatus').removeClass('label-danger').addClass('label-success');
  } else {
    $('#'+relay+'relaystatus').removeClass('label-success').addClass('label-danger');
  }
  $('#'+relay+'temp').html(data['relays'][relay]['temp']);
  $('#'+relay+'sincedate').html(gettextduration(new Date(data['relays'][relay]['asofdate']),new Date()));
}

function displaystatus(data) {
  $('#cputemp').html(data['cputemp']);
  updaterelaystatus(data,'front');
  updaterelaystatus(data,'back');
  updaterelaystatus(data,'west');
  $('#sincedate').html(gettextduration(new Date(data['relays']['asofdate']),new Date()));
  $('#asofdate').html(getage(data['relays']['asofdate']));
  $('#alertmessage').hide();
  $('#sincedatediv').show();
  if (data['status'] !== 'OK') {
    $('#alertmessage').html(data['message']);
    $('#alertmessage').show();
    $('#sincedatediv').hide();
  }
}

function getPositionHistoryMarkup(currentposition,item,enddate) {
  var markup = "";
  markup += '<li class="list-group-item">';
  if (item.position === "Closed") {
    markup += '<span class="label label-success">' + item.position + '</span>';
  } else {
    markup += '<span class="label label-danger">' + item.position + '</span>';
  }
  var secs = getduration(new Date(item.logdate),enddate);
  markup += ' ' + getdatestring(new Date(item.logdate)) + ' for ';
  if ((secs / 60) > 15 || (currentposition && currentposition !== "Closed")) {
    markup += '<mark><strong>' + gettextduration(new Date(item.logdate),enddate) + '</strong></mark>';
  } else {
    markup += gettextduration(new Date(item.logdate),enddate);
  }
  if (currentposition && currentposition !== "Closed") { markup += ' and counting'; }
  markup += '</li>';
  return markup;
}

function getPositionHistoryMarkupTABLE(item,enddate) {
  var markup = "";
  markup += '<tr>';
  if (item.position === "Closed") {
    markup += '<td><span class="label label-success">' + item.position + '</span></td>';
  } else {
    markup += '<td><span class="label label-danger">' + item.position + '</span></td>';
  }
  markup += '<td>' + getdatestring(new Date(item.logdate)) + ' for ' + gettextduration(new Date(item.logdate),enddate) + '</td>';
  markup += '</tr>';
  return markup;
}

function displaypositionhistoryloading(data) {
  document.getElementById("positionhistory_data").innerHTML = '<p>Loading...</p>';
}

function displaypositionhistoryunavailable(data) {
  document.getElementById("positionhistory_data").innerHTML = '<p>Unavailable</p>';
}

function displaypositionhistoryTABLE(data) {
  var out = "";
  out += '<table class="table">';
  var i;
  for(i = 0; i < data.log.length; i++) {
    if (data.log[i].position !== 'Closed') {
      out += getPositionHistoryMarkup(i===0?data.currentposition:null,data.log[i], i === 0 ? new Date() : new Date(data.log[i-1].logdate));
    }
  }
  out += '</table>';
  document.getElementById("positionhistory_data").innerHTML = out;
}

function displaypositionhistory(data) {
  var out = "";
  out += '<ul class="list-group">';
  var i;
  for(i = 0; i < data.log.length; i++) {
    if (data.log[i].position !== 'Closed') {
      out += getPositionHistoryMarkup(i===0?data.currentposition:null,data.log[i], i === 0 ? new Date() : new Date(data.log[i-1].logdate));
    }
  }
  out += '</ul>';
  document.getElementById("positionhistory_data").innerHTML = out;
}

function relayaction(relay,action) {
  jQuery(document).ajaxError(function(event, request, settings){
    displayunknown();
  });
  var gdurl = document.URL + 'timer/';
  var jqxhr = $.getJSON(gdurl + action, function(data) {
    console.log('relay action response received');
    displaystatus(data);
  });
}

window.onload = function () {
  
  var socket = io('', { path: '/timerws/socket.io' });
  var relaystatus;

  socket.on('status', function (data) {
    relaystatus = data;
    console.log(relaystatus);
    displaystatus(relaystatus);
  });

  $('#doorposition').click(function() {
    $('#remotecontrolmodal').modal('show');
  });
  setInterval(function(){ displaystatus(relaystatus); }, 5000);

  // this will close the hamburger menu after a selection
  $(document).on('click','.navbar-collapse.in',function(e) {
    if( $(e.target).is('a') && ( $(e.target).attr('class') != 'dropdown-toggle' ) ) {
        $(this).collapse('hide');
    }
  });
};

