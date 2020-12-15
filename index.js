
const tw_driver = require('./tw_driver');


let pkt = new tw_driver.TwPacket();

pkt.addr = 255;
pkt.cmd = 21;
pkt.d1 = 3;
pkt.d2 = 0;
pkt.d3 = 0;
pkt.d4 = 0;


tw_driver.driver.init();


tw_driver.driver.write(pkt, 2, 500).then(
    res => {
        console.log(res)
    },

    err => {
        console.log(err)
    }
)






///////////////////////////////////////////////////////////////








// const SerialPort = require('serialport')


// function generateCRC(buffer, size) {

//     let wCRC = 0xffff;
//     let byByte, byLoop;

//     //for (byByte = 0; byByte < (SIZE_COMMSCOMMAND_BYTES-2); byByte++)
//     for (byByte = 0; byByte < (size - 2); byByte++) {
//         wCRC ^= buffer[byByte];
//         for (byLoop = 0; byLoop < 8; byLoop++) {
//             if (wCRC & 1) {
//                 wCRC >>= 1;
//                 wCRC ^= 0xa001;
//             }
//             else
//                 wCRC >>= 1;
//         }
//     }
//     return wCRC;
// }




// var buffer = new Uint8Array(8);
// buffer[0] = 255;
// buffer[1] = 21;
// buffer[2] = 7;
// buffer[3] = 0;
// buffer[4] = 0;
// buffer[5] = 0;
// let crcVal = generateCRC(buffer, 8);
// buffer[6] = crcVal & 0xFF;
// buffer[7] = crcVal >> 8;




// const port = new SerialPort('/dev/ttyS6', { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 }, function (err) {
//     if (err) {
//         return console.log('Error: ', err.message)
//     }
// });

// let startTime = Date.now();
// port.write(buffer)

// function rx(timeout) {
//     return new Promise(function (res, rej) {
//         let endTime = Date.now() + timeout;

//         let id = setInterval(function () {
//             let twRes = port.read(8);
//             if (twRes != null) {
//                 clearInterval(id);
//                 res(twRes);
//             }
//             if (Date.now() > endTime) {
//                 clearInterval(id);
//                 rej("Error ran out of time waiting for response");
//             }
//         }, 1);
//     })
// }






// async function f() {
//     try {
//         let res = await rx(500);
//         console.log("elapsed time:", Date.now() - startTime)
//         console.log(res)
//     }
//     catch (e) {
//         console.log(e);
//     }

// }



// f();


// .then((res) => {
//     console.log("Success valid response received: ")

//     var buffer = new Uint8Array(8);

//     buffer[0] = res[0];
//     buffer[1] = res[1];
//     buffer[2] = res[2];
//     buffer[3] = res[3];
//     buffer[4] = res[4];
//     buffer[5] = res[5];
//     buffer[6] = res[6];
//     buffer[7] = res[7];

//     console.log(buffer)

// }
// )
//     .catch(e => {
//         console.log(e)
//     })





///////////////////////////////////////////////////////////////