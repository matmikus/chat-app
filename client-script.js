/*
  Auto scrolling content of chat messages and log to the bottom
*/

function scrollToBottom(id) {
    var div = document.getElementById(id);
    div.scrollTop = div.scrollHeight - div.clientHeight;
}
scrollToBottom('section-log');
scrollToBottom('section-chat');

/*
  Showing and hiding modal with stats
*/

var statsModal = document.getElementById('modal-stats');
var statsButton = document.getElementById('button-show-stats');
var statsClose = document.getElementById('modal-stats-close');
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

var clearButton = document.getElementById('button-clear-log');
clearButton.onclick = function() {
    document.getElementById('section-log').innerHTML = "";
}

/*
  Showing start modal, choosing nickname and avatar, validation
*/

var formAvatar = new Array();
for (var i = 0; i < 12; i++) {
    formAvatar.push(document.getElementsByClassName('modal-log-in-form-avatar')[i]);
    formAvatar[i].onclick = function() {
        chooseAvatar(this);
    }
}

function chooseAvatar(avatar) {
    for (var i = 0; i < 12; i++) document.getElementsByClassName('modal-log-in-form-avatar')[i].style.borderColor = '#ffffff';
    avatar.style.borderColor = '#0084ff';
    document.getElementById('client-avatar').src = avatar.getAttribute("src");
    document.getElementById('client-avatar').style.display = "none";
}
var loginModal = document.getElementById('modal-log-in');
var enterButton = document.getElementById('button-log-in');
window.onload = function(event) {
    loginModal.style.display = 'flex';
}
enterButton.onclick = function() {
    if (document.getElementById('client-avatar').src == "" || document.getElementById('modal-log-in-form-input-nickname').value == "") document.getElementById('modal-log-in-form-warning').style.display = "block";
    else {
        document.getElementById('client-nickname').innerHTML = document.getElementById('modal-log-in-form-input-nickname').value;
        document.getElementById('client-avatar').style.display = "block";
        document.getElementById('message-text').focus();
        loginModal.style.display = 'none';
        connectAJAX();
    }
}

/*
  Changing connection type
*/

var radioAX = document.getElementById('button-radio-ajax');
radioAX.onchange = function() {
    disconnectWS();
    connectAJAX();
}

var radioWS = document.getElementById('button-radio-websocket');
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
    document.getElementById('section-log').appendChild(log);
    var br = document.createElement('br');
    document.getElementById('section-log').appendChild(br);
    scrollToBottom('section-log');
}

/*
  Connection with server
*/

function connectAJAX() {
    var startTime = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "http://localhost:1234/check-connection");
    xmlhttp.send(null);
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var time = Date.now();
            addLog('Connected with server by AJAX in ' + (time - startTime) + 'ms');
            receiveMessagesAJAX();
        }
    }
}

var xmlhttpLongPoll;
function receiveMessagesAJAX() {
    var longPoll = function(){
        xmlhttpLongPoll = new XMLHttpRequest();
        xmlhttpLongPoll.open("POST", "http://localhost:1234/get-message");
        xmlhttpLongPoll.send(document.getElementById('client-nickname').textContent);
        xmlhttpLongPoll.onreadystatechange = function() {
            if (xmlhttpLongPoll.readyState == 4 && xmlhttpLongPoll.status == 200) {
                var msg = xmlhttpLongPoll.responseText;
                printMessage(JSON.parse(msg));
                longPoll();
            }
        }
        xmlhttpLongPoll.ontimeout = function() {
            longPoll();
        }
    }
    longPoll();
}

var ws;

function connectWS() {
    var start = Date.now();
    ws = new WebSocket('ws://localhost:1234', 'echo-protocol');
    ws.onopen = function() {
        addLog('Connected with server by WS in ' + (Date.now() - start) + 'ms');
        xmlhttpLongPoll.abort();
    };
    ws.onmessage = function (e) {
        if(e.data != 'received') printMessage(JSON.parse(e.data));
    }
}

function disconnectWS() {
    ws.onclose = function() {};
    ws.close();
}

/*
  Sending message
*/

var sendButton = document.getElementById('button-send');
sendButton.onclick = function() {
    if (document.getElementById('message-text').value.trim() != "") {
        document.getElementById('message-text').focus();
        var messageObject = {
            nickname: document.getElementById('client-nickname').textContent,
            avatar: document.getElementById('client-avatar').getAttribute("src"),
            message: document.getElementById('message-text').value
        };
        if (document.getElementById('button-radio-ajax').checked == true) sendAJAX(messageObject);
        else sendWS(messageObject);
    }
}

function sendAJAX(data) {
    var start = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "http://localhost:1234/put-message");
    xmlhttp.send(JSON.stringify(data));
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            addLog('Successfully sent message to server by AJAX in ' + (Date.now() - start) + 'ms');
        }
    }
}

function sendWS(data) {
    var start = Date.now();
    ws.send(JSON.stringify(data));
    var handler = function(e) {
        if (e.data == 'received') addLog('Successfully sent message to server by WEBSOCKET in ' + (Date.now() - start) + 'ms');
        ws.removeEventListener("message", handler);
    };
    ws.addEventListener("message", handler);
}

/*
    Printing incoming message
*/

function printMessage(messageObject) {
    var messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message-own';
    if(messageObject.nickname == document.getElementById('client-nickname').textContent) var messageHTML = '<div class="avatar-and-nickname"><img src="' + messageObject.avatar + '" class="chat-avatar"><span class="nickname">' + messageObject.nickname + '</span></div><div class="chat-text"><span class="arrow-left"></span><span class="chat-text">' + messageObject.message + '</span></div>';
    else var messageHTML = '<div class="chat-text"><span class="chat-text">' + messageObject.message + '</span><span class="arrow-right"></span></div><div class="avatar-and-nickname"><img src="' + messageObject.avatar + '" class="chat-avatar"><span class="nickname">' + messageObject.nickname + '</span></div>';
    messageDiv.innerHTML = messageHTML;
    document.getElementById('message-text').value = "";
    document.getElementById('section-chat').appendChild(messageDiv);
    scrollToBottom('section-chat');
}
