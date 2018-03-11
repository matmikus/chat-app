/*
  Auto scrolling content of chat messages and log to the bottom
*/

function scrollToBottom(id) {
  var div = document.getElementById(id);
  div.scrollTop = div.scrollHeight - div.clientHeight;
}
scrollToBottom('log-box');
scrollToBottom('chat-box');

/*
  Showing and hiding modal with stats
*/

var statsModal = document.getElementById('stats-modal');
var statsButton = document.getElementById('show-stats');
var statsClose = document.getElementsByClassName('modal-close')[0];
statsButton.onclick = function() {
  statsModal.style.display = 'flex';
}
statsClose.onclick = function() {
  statsModal.style.display = 'none';
}
window.onclick = function(event) {
  if (event.target == statsModal) {
    statsModal.style.display = 'none';
  }
}

/*
  Clearing log content
*/

var clearButton = document.getElementById('clear-log');
clearButton.onclick = function() {
  document.getElementById('log-box').innerHTML = "";
}

/*
  Showing start modal, choosing nickname and avatar, validation
*/

var formAvatar = new Array();
for (var i = 0; i < 12; i++) {
  formAvatar.push(document.getElementsByClassName('form-avatar')[i]);
  formAvatar[i].onclick = function() {
    chooseAvatar(this);
  }
}

function chooseAvatar(avatar) {
  for (var i = 0; i < 12; i++) document.getElementsByClassName('form-avatar')[i].style.borderColor = '#ffffff';
  avatar.style.borderColor = '#0084ff';
  document.getElementById('user-avatar').src = avatar.src;
  document.getElementById('user-avatar').style.display = "none";
}
var loginModal = document.getElementById('login-modal');
var enterButton = document.getElementById('enter');
window.onload = function(event) {
  loginModal.style.display = 'flex';
}
enterButton.onclick = function() {
  if (document.getElementById('user-avatar').src == "" || document.getElementById('nickname-input').value == "") document.getElementById('warning').style.display = "block";
  else {
    document.getElementById('user-nickname').innerHTML = document.getElementById('nickname-input').value;
    document.getElementById('user-avatar').style.display = "block";
    loginModal.style.display = 'none';
    connectAJAX();
  }
}

/*
  Changing connection type
*/

var radioAX = document.getElementById('radioAX');
radioAX.onchange = function() {
  connectAJAX();
}

var radioWS = document.getElementById('radioWS');
radioWS.onchange = function() {
  connectWS();
}

/*
  Adding log
*/

function addLog(text) {
  var d = new Date();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var seconds = d.getSeconds();
  if (minutes < 10) minutes = '0' + minutes;
  if (seconds < 10) seconds = '0' + seconds;
  var log = document.createTextNode(hours + ':' + minutes + ':' + seconds + ' ' + text);
  document.getElementById('log-box').appendChild(log);
  var br = document.createElement('br');
  document.getElementById('log-box').appendChild(br);
  scrollToBottom('log-box');
}

/*
  Connection with server
*/

function connectAJAX() {
  var startTime = Date.now();
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "http://localhost:1234/connect");
  xmlhttp.send(0);
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) var time = Date.now();
    if (!isNaN(time - startTime)) {
      addLog('Connected with server by AJAX in ' + (time - startTime) + 'ms');
    }
  }
}

function connectWS() {
  var start = Date.now();
  var ws = new WebSocket('ws://localhost:1234', 'echo-protocol');

  ws.onopen = function() {
    addLog('Connected with server by WS in ' + (Date.now() - start) + 'ms');
  };
}

/*
  Sending message
*/

var sendButton = document.getElementById('send');
sendButton.onclick = function() {
  if (document.getElementById('message-text').value.trim() != "") {
    var message = document.createElement('div');
    message.className = 'chat-message-own';
    var messageCode = '<div class="avatar"><img src="' + document.getElementById('user-avatar').src + '" class="chat-avatar"><span class="nickname">' + document.getElementById('user-nickname').textContent + '</span></div><div class="chat-text"><span class="arrow-left"></span><span class="chat-text">' + document.getElementById('message-text').value + '</span></div>';
    message.innerHTML = messageCode;
    document.getElementById('message-text').value = "";
    document.getElementById('chat-box').appendChild(message);
    scrollToBottom('chat-box');
  }
}
