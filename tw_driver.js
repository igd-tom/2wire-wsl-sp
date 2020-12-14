




// type definitions

class TwPacket {
    constructor() {
        this.addr = 0;
        this.cmd = 0;
        this.d1 = 0;
        this.d2 = 0;
        this.d3 = 0;
        this.d4 = 0;
    };
}


class TwResp {
    constructor() {
        this.packet = new TwPacket();
        this.numTries = 0;
        this.timeElapsed = 0;
    }
}

const StatusCode = {
    RESULT_OKAY: 0,
    RESULT_COMMS_FAIL: 1,
    RESULT_FAIL_INVALID_REQUEST: 2,
    RESULT_FAIL_UNSUPPORTED_REQUEST: 3
}


// variables

const BUFFER_SIZE = 100;
const CRC_POLYNOMIAL = 0xa001; // Modbus

const SIZE_COMMSCOMMAND_BYTES = 8;
const SIZE_EXTCOMMSCOMMAND_BYTES = 84;

const P2COMMANDSTATUS_BUSY = 1;
const P2COMMANDSTATUS_PASSED = 2;
const P2COMMANDSTATUS_FAILED = 3;
const P2COMMANDSTATUS_TIMEOUT = 4;
const P2COMMANDSTATUS_INVALID = 5;


const P2COMMAND_READ_LASTCOMMAND = 62;
const P2EXTCOMMAND_READ_GSMMODEMDATA = 90;
const P2EXTCOMMAND_READ_LOGDATA = 85;
const P2EXTCOMMAND_READ_DATA = 91;

const MAX_COMMANDTIMEOUT_25MS = 25;
const MAX_COMMANDTIMEOUT_50MS = 50;
const MAX_COMMANDTIMEOUT_100MS = 100;





const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
var port = new SerialPort('/dev/ttyS6', { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 })

var __rxData = new Array(100);
var __txData = new Array(100);

let twResp = new TwResp();


// private functions

function getTickCount() {
    return Date.now();
}

function checkCRC(buffer, cmdSize) {
    /*
  Return:
  0 = Fail
  1 = Pass
  */
    let wCRC;

    wCRC = pabyBuffer[byCommandSize - 1]; // MSB
    wCRC = wCRC << 8;
    wCRC += pabyBuffer[byCommandSize - 2]; // LSB

    if (wCRC == generateCRC(pabyBuffer, byCommandSize)) {
        return 1;
    }
    else {
        return 0;
    }
}

function tx(twPacket) {
    let wData;

    //Clear Rx Data
    __rxData = new Array(100);

    // Prepare 2-wire command format
    __txData[0] = addr;
    __txData[1] = byCommand;
    __txData[2] = byData1;
    __txData[3] = byData2;
    __txData[4] = byData3;
    __txData[5] = byData4;
    wData = generateCRC(__txData, SIZE_COMMSCOMMAND_BYTES);
    __txData[6] = wData & 0xff;
    __txData[7] = wData >> 8;

    const command = [__txData[0], __txData[1], __txData[2], __txData[3], __txData[4], __txData[5], __txData[6], __txData[7]];
    const buff = Buffer.from(command);

    // Tx
    port.write(buff, function (err) {
        if (err) {
            return console.log("Error on write: ", err.message);
        }
        console.log("message written");
    });
}


function rx(addr, byCommand, wWaitmS) {

    let byReturn = 0;
    let recBuff = Buffer.alloc(1);

    let endTime = Date.now() + wWaitmS;


    // sets serial read timeout
    // Serial1.setTimeout(wWaitmS);

    // will return either on timeout or when specified # bytes have been received
    // totalBytesRead = Serial1.readBytes(__rxData, byRxSize);

    while (date.now() < endTime && recBuff.length < SIZE_COMMSCOMMAND_BYTES) {
        recBuff = serialport.read(SIZE_COMMSCOMMAND_BYTES);
        recBuff = recBuffer == null ? Buffer.alloc(1) : recBuffer;
    }

    if (recBuff.length == SIZE_COMMSCOMMAND_BYTES) {

        __rxData[0] = recBuff.slice(0, 1);
        __rxData[1] = recBuff.slice(1, 2);
        __rxData[2] = recBuff.slice(2, 3);
        __rxData[3] = recBuff.slice(3, 4);
        __rxData[4] = recBuff.slice(4, 5);
        __rxData[5] = recBuff.slice(5, 6);
        __rxData[6] = recBuff.slice(6, 7);
        __rxData[7] = recBuff.slice(7, 8);


        if ((checkCRC(__rxData, SIZE_COMMSCOMMAND_BYTES)) && (__rxData[0] == addr) &&
            ((__rxData[1] == byCommand) || (__rxData[1] == P2COMMAND_READ_LASTCOMMAND))) {
            byReturn = 1;
        }
    }




    return byReturn;
}






// public functions


var driver = {

    init: function () {
        // port = new SerialPort('/dev/ttyS6', { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 });
        console.log("hello");
    },


    // returns a promise 
    // write: function (twPacket, numTries, waitMs) {


    //     let dwTicks, dwTimeout;
    //     let byRetries;
    //     let byState = 0, byBusy;
    //     let byResult;

    //     byRetries = numTries;

    //     let startTime = Date.now();

    //     do {

    //         switch (byState) {

    //             default:
    //             case 0:
    //                 {

    //                     dwTimeout = getTickCount() + waitMs;
    //                     byBusy = 1;
    //                     byResult = StatusCode.RESULT_COMMS_FAIL;

    //                     tx(twPacket);

    //                     byState = 1;
    //                 }
    //                 break;

    //             // Wait for reply
    //             case 1:
    //                 {

    //                     // Tx Standard Command
    //                     if (rx(twPacket.addr, twPacket.cmd, MAX_COMMANDTIMEOUT_50MS)) {
    //                         // HUB will reply immeadetely with Lengthy command. HUB send reply from sensor approx. 30mS later
    //                         if (twPacket.cmd == __rxData[1]) {
    //                             byState = 100; // Passed
    //                         }

    //                         else {
    //                             if (P2COMMAND_READ_LASTCOMMAND == __rxData[1])
    //                                 byState = 2; // Lengthly Command

    //                             else
    //                                 byState = 110; // Failed - Invalid
    //                         }
    //                     }

    //                     else {
    //                         if ((checkCRC(__rxData, 8)) && (__rxData[0] == twPacket.addr))
    //                             byState = 110; // Failed - Invalid
    //                         else
    //                             byState = 111; // Failed - Timeout
    //                     }
    //                 }
    //                 break;

    //             case 2:
    //                 {
    //                     dwTicks = getTickCount() + MAX_COMMANDTIMEOUT_25MS;
    //                     byState = 3;
    //                 }
    //                 break;

    //             // Wait
    //             case 3:
    //                 {
    //                     if (getTickCount() > dwTicks)
    //                         byState = 4;
    //                 }
    //                 break;

    //             // Tx
    //             case 4:
    //                 {
    //                     tx(twPacket.addr, P2COMMAND_READ_LASTCOMMAND, twPacket.cmd, 0, 0, 0);

    //                     byState = 5;
    //                 }
    //                 break;

    //             // Rx
    //             case 5:
    //                 {

    //                     if (rx(twPacket.addr, twPacket.cmd, MAX_COMMANDTIMEOUT_50MS)) {
    //                         if (twPacket.cmd == __rxData[1])
    //                             byState = 100; // Passed
    //                         else {
    //                             if (P2COMMANDSTATUS_BUSY == __rxData[2])
    //                                 byState = 2; // Busy
    //                         }
    //                     }
    //                     else
    //                         byState = 2; // Re Send

    //                     // Timeout
    //                     if (getTickCount() > dwTimeout)
    //                         byState = 111; // Timeout
    //                 }
    //                 break;

    //             // Passed
    //             case 100:
    //                 {
    //                     byResult = StatusCode.RESULT_OKAY;
    //                     //rxStatus = P2COMMANDSTATUS_PASSED;
    //                     byState = 200;
    //                 }
    //                 break;

    //             // Failed - Not Supported
    //             case 110:
    //                 {
    //                     byResult = StatusCode.RESULT_COMMS_FAIL;
    //                     //rxStatus = P2COMMANDSTATUS_INVALID;
    //                     byState = 200;
    //                 }
    //                 break;

    //             // Failed -Timeout
    //             case 111:
    //                 {
    //                     if (byRetries) {
    //                         byRetries--;
    //                         byBusy = 1;
    //                         byState = 0; // Restart
    //                     }

    //                     else {
    //                         byResult = StatusCode.RESULT_COMMS_FAIL;
    //                         byState = 200;
    //                     }
    //                 }
    //                 break;

    //             // End
    //             case 200:
    //                 {

    //                     twResp.packet.addr = __rxData[0];
    //                     twResp.packet.cmd = __rxData[1];
    //                     twResp.packet.data1 = __rxData[2];
    //                     twResp.packet.data2 = __rxData[3];
    //                     twResp.packet.data3 = __rxData[4];
    //                     twResp.packet.data4 = __rxData[5];

    //                     byBusy = 0;
    //                 }
    //                 break;
    //         };

    //     } while (byBusy);

    //     twResp.numTries = byTries - byRetries;
    //     twResp.timeElapsed = Date.now() - startTime;

    //     return byResult;
    // }




};

function foo() {
    console.log("Hello world");
}



exports.foo = foo;


exports.driver = driver;