





// const tw_driver = require('./tw_driver');


// let pkt = new tw_driver.TwPacket();

// pkt.addr = 255;
// pkt.cmd = 21;
// pkt.d1 = 3;
// pkt.d2 = 0;
// pkt.d3 = 0;
// pkt.d4 = 0;

// tw_driver.driver.init();


// tw_driver.driver.write(pkt, 2, 500).then(
//     res => {
//         console.log(res)
//     },

//     err => {
//         console.log(err)
//     }
// )



var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});


server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
});



wsServer.on('request', function (request) {
    const connection = request.accept(null, request.origin);

    connection.on('message', function (message) {
        console.log('Received Message:', message.utf8Data);

        let reqJson = JSON.parse(message.utf8Data)
        console.log(reqJson.b);


        connection.sendUTF({ "a": reqJson.b * 3 });
    });
    connection.on('close', function (reasonCode, description) {
        console.log('Client has disconnected.');
    });
});
