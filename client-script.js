document.getElementById('button-log-in').onclick = function createChatClient() {
    if (checkLogInForm()) {
        document.getElementById('client-nickname').innerHTML = document.getElementById('modal-log-in-form-input-nickname').value;
        document.getElementById('client-avatar').style.display = "block";
        document.getElementById('message-text').focus();
        document.getElementById('modal-log-in').style.display = 'none';
        connectToServerByAjax();
    }
}

function checkLogInForm() {
    if (document.getElementById('client-avatar').src == "" || document.getElementById('modal-log-in-form-input-nickname').value == "") {
        document.getElementById('modal-log-in-form-warning').style.display = "block";
        return false;
    } else return true;
}

window.onload = function attachAvatarsSetEvent(event) {
    for (var i = 0; i < 12; i++) {
        document.getElementsByClassName('modal-log-in-form-avatar')[i].onclick = function() {
            setClientAvatar(this);
        }
    }
    document.getElementById('modal-log-in').style.display = 'flex';
}

function setClientAvatar(avatar) {
    for (var i = 0; i < 12; i++) document.getElementsByClassName('modal-log-in-form-avatar')[i].style.borderColor = '#ffffff';
    avatar.style.borderColor = '#0084ff';
    document.getElementById('client-avatar').src = avatar.getAttribute("src");
}

document.getElementById('button-show-stats').onclick = function showStatsInModal() {
    loadStatsToModal();
    document.getElementById('modal-stats').style.display = 'flex';
}

document.getElementById('modal-stats-close').onclick = function closeStatsInModalByCloseButton() {
    document.getElementById('modal-stats').style.display = 'none';
}

window.onclick = function closeStatsInModalByClickingOutside(event) {
    if (event.target == document.getElementById('modal-stats')) {
        document.getElementById('modal-stats').style.display = 'none';
    }
}

document.getElementById('button-clear-log').onclick = function clearLogSection() {
    document.getElementById('section-log').innerHTML = "";
}

document.getElementById('button-radio-ajax').onchange = function chooseAjaxConnection() {
    closeWebsocketConnection();
    connectToServerByAjax();
}

document.getElementById('button-radio-websocket').onchange = function chooseWebsocketConnection() {
    closeAjaxConnection();
    connectToServerByWebsocket();
}

function closeAjaxConnection() {
    ajaxNewMessageLongRequest.abort();
}

function closeWebsocketConnection() {
    ws.close();
    ws.onclose = function() {}; // It sends 'close' event to server
}

function connectToServerByAjax() {
    var startTime = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "http://localhost:1234/check-connection");
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var time = Date.now();
            addTextToLogSection('Connected with server by AJAX in ' + (time - startTime) + 'ms');
            addStats('connectionAJAX',(time - startTime));
            waitForMessageByAjax();
        }
    }
}

function connectToServerByWebsocket() {
    var startTime = Date.now();
    ws = new WebSocket('ws://localhost:1234', 'echo-protocol');
    ws.addEventListener('open', function(event) {
        var time = Date.now();
        addTextToLogSection('Connected with server by WS in ' + (time - startTime) + 'ms');
        addStats('connectionWebsocket',(time - startTime));
    });
    ws.addEventListener('message', function(e) {
        if (e.data != 'received') {
            var receivedByClientTime = Date.now();
            var msg = JSON.parse(e.data);
            msg.receivedByClient = receivedByClientTime;

            addTextToLogSection('Upload + download: ' + (msg.receivedByClient - msg.sentByClient));
            addTextToLogSection('Upload: ' + (msg.receivedByServer - msg.sentByClient));
            addTextToLogSection('Download: ' + (msg.receivedByClient - msg.sentByServer));
            addStats('messageWebsocket', msg.receivedByClient - msg.sentByClient, msg.receivedByServer - msg.sentByClient, msg.receivedByClient - msg.sentByServer);

            ////// !!!!!!!!!!!!!!
            addStats2(msg.sentByClient, msg.receivedByServer, msg.sentByServer, msg.receivedByClient)/////// TEMPORARY!!!!! /////////////////////////////////////////

            // console.log(msg.sentByClient);
            // console.log(msg.receivedByServer);
            // console.log(msg.sentByServer);
            // console.log(msg.receivedByClient);

            printMessageInChatSection(msg);
        }
    });
}

function addTextToLogSection(text) {
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
    scrollDivToBottom('section-log');
}

function scrollDivToBottom(divID) {
    var div = document.getElementById(divID);
    div.scrollTop = div.scrollHeight - div.clientHeight;
}

function waitForMessageByAjax() {
    var sendAjaxRequest = function() {
        ajaxNewMessageLongRequest = new XMLHttpRequest();
        ajaxNewMessageLongRequest.open("POST", "http://localhost:1234/get-message");
        ajaxNewMessageLongRequest.send();
        ajaxNewMessageLongRequest.onreadystatechange = function() {
            if (ajaxNewMessageLongRequest.readyState == 4 && ajaxNewMessageLongRequest.status == 200) {
                var receivedByClientTime = Date.now();
                var msg = JSON.parse(ajaxNewMessageLongRequest.responseText);
                msg.receivedByClient = receivedByClientTime;

                addTextToLogSection('Upload + download: ' + (msg.receivedByClient - msg.sentByClient));
                addTextToLogSection('Upload: ' + (msg.receivedByServer - msg.sentByClient));
                addTextToLogSection('Download: ' + (msg.receivedByClient - msg.sentByServer));
                addStats('messageAJAX', msg.receivedByClient - msg.sentByClient, msg.receivedByServer - msg.sentByClient, msg.receivedByClient - msg.sentByServer);

                ////// !!!!!!!!!!!!!!
                addStats2(msg.sentByClient, msg.receivedByServer, msg.sentByServer, msg.receivedByClient)/////// TEMPORARY!!!!! /////////////////////////////////////////

                printMessageInChatSection(msg);
                sendAjaxRequest();
            }
        }
        ajaxNewMessageLongRequest.ontimeout = function() {
            sendAjaxRequest();
        }
    }
    sendAjaxRequest();
}

function printMessageInChatSection(messageObject) {
    var messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message-own';
    if (messageObject.nickname == document.getElementById('client-nickname').textContent) var messageHTML = '<div class="avatar-and-nickname"><img src="' + messageObject.avatar + '" class="chat-avatar"><span class="nickname">' + messageObject.nickname + '</span></div><div class="chat-text"><span class="arrow-left"></span><span class="chat-text">' + messageObject.message + '</span></div>';
    else var messageHTML = '<div class="chat-text"><span class="chat-text">' + messageObject.message + '</span><span class="arrow-right"></span></div><div class="avatar-and-nickname"><img src="' + messageObject.avatar + '" class="chat-avatar"><span class="nickname">' + messageObject.nickname + '</span></div>';
    messageDiv.innerHTML = messageHTML;
    document.getElementById('message-text').value = "";
    document.getElementById('section-chat').appendChild(messageDiv);
    scrollDivToBottom('section-chat');
}

document.getElementById('button-send').onclick = function prepareMessageAndSend() {
    if (document.getElementById('message-text').value.trim() != "") {
        document.getElementById('message-text').focus();
        var messageObject = {
            nickname: document.getElementById('client-nickname').textContent,
            avatar: document.getElementById('client-avatar').getAttribute("src"),
            message: document.getElementById('message-text').value,
            sentByClient: null,
            receivedByServer: null,
            sentByServer: null,
            receivedByClient: null
        };
        if (document.getElementById('button-radio-ajax').checked == true) sendMessageByAjax(messageObject);
        else sendMessageByWebsocket(messageObject);
    }
}

function sendMessageByAjax(data) {
    var start = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "http://localhost:1234/put-message");
    data.sentByClient = Date.now();
    xmlhttp.send(JSON.stringify(data));
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            addTextToLogSection('Successfully sent message to server by AJAX');
        }
    }
}

function sendMessageByWebsocket(data) {
    data.sentByClient = Date.now();
    ws.send(JSON.stringify(data));
    var handler = function(e) {
        if (e.data == 'received') addTextToLogSection('Successfully sent message to server by WEBSOCKET');
        ws.removeEventListener("message", handler);
    };
    ws.addEventListener("message", handler);
}

var statsConnectionsAJAX = [];
var statsConnectionsWebsocket = [];
var statsMessagesAJAX = [];
var statsMessagesWebsocket = [];

function addStats(type, totalTime, uploadTime = null, downloadTime = null) {
    switch(type){
        case 'connectionAJAX':
            statsConnectionsAJAX.push({totalTime: totalTime});
            break;
        case 'connectionWebsocket':
            statsConnectionsWebsocket.push({totalTime: totalTime});
            break;
        case 'messageAJAX':
            statsMessagesAJAX.push({totalTime: totalTime, uploadTime: uploadTime, downloadTime: downloadTime});
            break;
        case 'messageWebsocket':
            statsMessagesWebsocket.push({totalTime: totalTime, uploadTime: uploadTime, downloadTime: downloadTime});
            break;
    }
}

////// !!!!!!!!!!!!!!
//////////////////// TEMPORARY!!!!!!! ////////////////////////////////////
var stats1 = [], stats2 = [], stats3 = [], stats4 = []
function addStats2(p1, p2, p3, p4) {
    stats1.push(p1)
    stats2.push(p2)
    stats3.push(p3)
    stats4.push(p4)
}
document.getElementById('button-show-stats').onclick = function showStatsInModal() {
    var content = JSON.stringify(stats1) + '<br><br><br>' + JSON.stringify(stats2) + '<br><br><br>' + JSON.stringify(stats3) + '<br><br><br>' + JSON.stringify(stats4);
    document.getElementById('xyz').innerHTML = content;
}
///////////////////////////////////////////////////////////////////////////

function loadStatsToModal() {
    var statsContent = 'STATS CONNECTIONS AJAX:<br><br>' + JSON.stringify(statsConnectionsAJAX)
    + '<br><br>STATS CONNECTIONS WEBSOCKET:<br><br>' + JSON.stringify(statsConnectionsWebsocket)
    + '<br><br>STATS MESSAGES AJAX:<br><br>' + JSON.stringify(statsMessagesAJAX)
    + '<br><br>STATS MESSAGES WEBSOCKET:<br><br>' + JSON.stringify(statsMessagesWebsocket);
    document.getElementById('modal-stats-content').innerHTML = statsContent;
}
