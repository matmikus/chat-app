var http = require('http'),
      fs = require('fs'),
     url = require('url');

var server = http.createServer(function(request, response){
    var path = url.parse(request.url).pathname;
    if(path=="/connect"){
        request.on('data', (chunk) => {
            var message = chunk;
            console.log("AJAX connection request received");
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.end(message);
        })
    }else{
        fs.readFile('./index.html', function(err, file) {
            if(err) {
                console.log('Error: wrong path of AJAX request');
                return;
            }
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(file, "utf-8");
        });
    }
}).listen(1234);
console.log("AJAX server initialized");
var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});
console.log("WEBSOCKET server initialized");
wsServer.on('request', function(r){
    var connection = r.accept('echo-protocol', r.origin);
     var client = connection
    connection.on('message', function(message) {
        var msgString = message.utf8Data;
        client.sendUTF(msgString);
    });
    connection.on('close', function(reasonCode, description) {
        delete client;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
