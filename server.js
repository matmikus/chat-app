/*
  AJAX server
*/

var http = require('http'),
  fs = require('fs'),
  url = require('url');
var server = http.createServer(function(request, response) {
  var path = url.parse(request.url).pathname;
  if (path == "/connect") {
    request.on('data', (chunk) => {
      var message = chunk;
      console.log("AJAX connection request received");
      response.writeHead(200, {
        "Content-Type": "text/plain"
      });
      response.end();
    })
  } else {
    fs.readFile('./index.html', function(err, file) {
      if (err) {
        console.log('Error: wrong path of AJAX request');
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.end(file, "utf-8");
    });
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
  console.log("WEBSOCKET connection request received");
  var connection = r.accept('echo-protocol', r.origin); //  connection.remoteAddress    to numer klienta podlaczonego
  var client = connection;
  connection.on('message', function(message) {
    // var msgString = message.utf8Data;
    // client.sendUTF(msgString);
  });
  connection.on('close', function(reasonCode, description) {
    delete client;
  });
});
