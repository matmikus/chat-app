/*
  Chat data
*/

const messages = [];
var clients = []; // for websocket

/*
  AJAX server
*/

var http = require('http'),
    url = require('url');
var server = http.createServer(function(request, response) {
    var path = url.parse(request.url).pathname;
    if (path == "/check-connection") {
        console.log("AJAX connection request received");
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.end();
    } else if (path == "/put-message") {
        console.log("AJAX message received");
        request.on('data', function(data) {
            newMessage(JSON.parse(data.toString()));
        });
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.end();
    } else if (path == "/get-message") {
        console.log('AJAX new messages request received');
    }

}).listen(1234);
console.log("AJAX server initialized");

/*
  WebSocket server
*/

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});
console.log("WEBSOCKET server initialized");
wsServer.on('request', function(r) {
    console.log("WEBSOCKET connection started");
    console.log('WS clients: ' + clients.length);
    // w tym miejscu powinienem przerwać long polling ajaxa o nowe wiadomosci
    var connection = r.accept('echo-protocol', r.origin); //  connection.remoteAddress    to numer klienta podlaczonego
    var client = connection;
    clients.push(client);
    connection.on('message', function(message) {
        console.log("WEBSOCKET message received");
        client.sendUTF('received');
        newMessage(JSON.parse(message.utf8Data));
    });
    connection.on('close', function(reasonCode, description) {
        clients.splice(clients.findIndex(function(element) {
            return connection;
        }), 1);
        delete client;
        console.log("WEBSOCKET connection closed");
        console.log('WS clients: ' + clients.length);
    });
});

/*
  Adding new message and sending it to all listeners
*/

function newMessage(messageObject) {
    messages.push(messageObject);
    console.log(messageObject);
    // wsServer:
    for (var i = 0; i < clients.length; i++) {
        clients[i].send(JSON.stringify(messageObject));
        console.log('wyslano do clienta nr ' + i);
    }
}
