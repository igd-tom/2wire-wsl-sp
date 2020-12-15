





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

const tw_driver = require('./tw_driver');
var WebSocketServer = require('websocket').server;
var http = require('http');

tw_driver.driver.init();

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
        try {
            let reqJson = JSON.parse(message.utf8Data)
            let maxTries = reqJson.maxTries;
            let timeout = reqJson.timeout;
            let pkt = new tw_driver.TwPacket();
            pkt.addr = reqJson.addr;
            pkt.cmd = reqJson.cmd;
            pkt.d1 = reqJson.d1;
            pkt.d2 = reqJson.d2;
            pkt.d3 = reqJson.d3;
            pkt.d4 = reqJson.d4;

            let respData = {
                twResCode: 0,
                numTries: 0,
                elapsedTime: 0,
                payload: {
                    addr: 0,
                    cmd: 0,
                    d1: 0,
                    d2: 0,
                    d4: 0,
                    d4: 0,
                }
            }


            tw_driver.driver.write(pkt, maxTries, timeout).then(
                res => {
                    respData.twResCode = res.result;
                    respData.numTries = res.numTries;
                    respData.elapsedTime = res.timeElapsed;
                    respData.payload.addr = res.packet.addr;
                    respData.payload.cmd = res.packet.cmd;
                    respData.payload.d1 = res.packet.d1;
                    respData.payload.d2 = res.packet.d2;
                    respData.payload.d3 = res.packet.d3;
                    respData.payload.d4 = res.packet.d4;

                    connection.sendUTF(JSON.stringify(respData));
                }
            )

        }

        catch (e) {
            console.log(e)
        }

    });
    connection.on('close', function (reasonCode, description) {
        console.log('Client has disconnected.');
    });


});
