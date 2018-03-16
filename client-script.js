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
    ws.onclose = function() {}; // It sends 'close' event to server
    ws.close();
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
            waitForMessageByAjax();
        }
    }
}

function connectToServerByWebsocket() {
    var start = Date.now();
    ws = new WebSocket('ws://localhost:1234', 'echo-protocol');
    ws.addEventListener('open', function(event) {
        addTextToLogSection('Connected with server by WS in ' + (Date.now() - start) + 'ms');

    });
    ws.addEventListener('message', function(e) {
        if (e.data != 'received') printMessageInChatSection(JSON.parse(e.data));
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
                var msg = ajaxNewMessageLongRequest.responseText;
                printMessageInChatSection(JSON.parse(msg));
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
            message: document.getElementById('message-text').value
        };
        if (document.getElementById('button-radio-ajax').checked == true) sendMessageByAjax(messageObject);
        else sendMessageByWebsocket(messageObject);
    }
}

function sendMessageByAjax(data) {
    var start = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "http://localhost:1234/put-message");
    xmlhttp.send(JSON.stringify(data));
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            addTextToLogSection('Successfully sent message to server by AJAX in ' + (Date.now() - start) + 'ms');
        }
    }
}

function sendMessageByWebsocket(data) {
    var start = Date.now();
    ws.send(JSON.stringify(data));
    var handler = function(e) {
        if (e.data == 'received') addTextToLogSection('Successfully sent message to server by WEBSOCKET in ' + (Date.now() - start) + 'ms');
        ws.removeEventListener("message", handler);
    };
    ws.addEventListener("message", handler);
}
