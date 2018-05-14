var http = require('http');
var url = require('url');
var websocket = require('websocket').server;
var ajaxEventEmitter = require('events').EventEmitter;

var websocketActiveClients = [];

var ajaxActiveClients = [];
var ajaxMessageEvent = new ajaxEventEmitter();
var ajaxListener = function ajaxListener(message) {
    while(ajaxActiveClients.length > 0) {
        ajaxActiveClients[0].end(message);
        ajaxActiveClients.splice(0, 1);
    }
}
ajaxMessageEvent.on('message', ajaxListener);

var httpServer = http.createServer(function(request, response) {
    var path = url.parse(request.url).pathname;
    if (path == '/check-connection') {
        console.log('AJAX check connection request received');
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        response.end();
    } else if (path == '/put-message') {
        request.on('data', function(data) {
            console.log('AJAX message received:');
            var receivedByServerTime = Date.now();
            var msg = JSON.parse(data.toString());
            msg.receivedByServer = receivedByServerTime;
            sendNewMessageToAllClients(msg);
        });
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        response.end();
    } else if (path == '/get-message') {
        console.log('AJAX new messages long poll request received');
        ajaxActiveClients.push(response);
        console.log('AJAX clients amount: ' + ajaxActiveClients.length);
        request.on('close', function() {
            var index = ajaxActiveClients.indexOf(response);
            if (index !== -1) ajaxActiveClients.splice(index, 1);
            console.log('AJAX long poll request aborted');
            console.log('AJAX clients amount: ' + ajaxActiveClients.length);
        });
    }
}).listen(1234);
console.log('HTTP server for AJAX initialized');

var websocketServer = new websocket({
    httpServer: httpServer
});
console.log('WEBSOCKET server initialized');
websocketServer.on('request', function(r) {
    console.log('WEBSOCKET new connection started');
    var connection = r.accept('echo-protocol', r.origin);
    websocketActiveClients.push(connection);
    console.log('WEBSOCKET clients amount: ' + websocketActiveClients.length);
    connection.on('message', function(message) {
        var receivedByServerTime = Date.now();
        var msg = JSON.parse(message.utf8Data);
        msg.receivedByServer = receivedByServerTime;
        console.log('WEBSOCKET message received:');
        connection.sendUTF('received');
        sendNewMessageToAllClients(msg);
    });
    connection.on('close', function(reasonCode, description) {
        websocketActiveClients.splice(websocketActiveClients.findIndex(function(element) {
            if(element == connection) return true;
            else return false;
        }), 1);
        console.log('WEBSOCKET connection closed');
        console.log('WEBSOCKET clients amount: ' + websocketActiveClients.length);
    });
});

function sendNewMessageToAllClients(messageObject) {
    console.log(messageObject);

    messageObject.sentByServer = Date.now();
    for (var i = 0; i < websocketActiveClients.length; i++) websocketActiveClients[i].send(JSON.stringify(messageObject));

    messageObject.sentByServer = Date.now();
    ajaxMessageEvent.emit('message', JSON.stringify(messageObject));
}
