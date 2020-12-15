




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
        this.result = StatusCode.RESULT_UNDEFINED;
        this.packet = new TwPacket();
        this.numTries = 0;
        this.timeElapsed = 0;
    }
}

const StatusCode = {
    RESULT_OKAY: 0,
    RESULT_COMMS_FAIL: 1,
    RESULT_FAIL_INVALID_REQUEST: 2,
    RESULT_FAIL_UNSUPPORTED_REQUEST: 3,
    RESULT_UNDEFINED: 4
}


// variables

const BIT0 = 0x00000001;

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


var __rxData = new Uint8Array(100);
var __txData = new Uint8Array(100);

let twResp = new TwResp();


// private functions

function getTickCount() {
    return Date.now();
}

function generateCRC(buffer, size) {

    let wCRC = 0xffff;
    let byByte, byLoop;

    //for (byByte = 0; byByte < (SIZE_COMMSCOMMAND_BYTES-2); byByte++)
    for (byByte = 0; byByte < (size - 2); byByte++) {
        wCRC ^= buffer[byByte];
        for (byLoop = 0; byLoop < 8; byLoop++) {
            if (wCRC & BIT0) {
                wCRC >>= 1;
                wCRC ^= CRC_POLYNOMIAL;
            }
            else
                wCRC >>= 1;
        }
    }
    return wCRC;
}



function checkCRC(buffer, cmdSize) {
    /*
  Return:
  0 = Fail
  1 = Pass
  */
    let wCRC;

    wCRC = buffer[cmdSize - 1]; // MSB
    wCRC = wCRC << 8;
    wCRC += buffer[cmdSize - 2]; // LSB

    if (wCRC == generateCRC(buffer, cmdSize)) {
        return 1;
    }
    else {
        return 0;
    }
}

function tx(twPacket) {
    let wData;

    //Clear Rx Data
    __rxData = new Uint8Array(100);

    // Prepare 2-wire command format
    __txData[0] = twPacket.addr;
    __txData[1] = twPacket.cmd;
    __txData[2] = twPacket.d1;
    __txData[3] = twPacket.d2;
    __txData[4] = twPacket.d3;
    __txData[5] = twPacket.d4;
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
        // console.log("message written");
    });
}


async function rx(addr, byCommand, wWaitmS) {

    return new Promise(function (res, rej) {

        let endTime = Date.now() + wWaitmS;

        let id = setInterval(function () {
            let twRes = port.read(8);
            if (twRes != null) {
                clearInterval(id);

                __rxData[0] = twRes[0];
                __rxData[1] = twRes[1];
                __rxData[2] = twRes[2];
                __rxData[3] = twRes[3];
                __rxData[4] = twRes[4];
                __rxData[5] = twRes[5];
                __rxData[6] = twRes[6];
                __rxData[7] = twRes[7];

                if ((checkCRC(__rxData, SIZE_COMMSCOMMAND_BYTES)) && (__rxData[0] == addr) &&
                    ((__rxData[1] == byCommand) || (__rxData[1] == P2COMMAND_READ_LASTCOMMAND))) {
                    res(1);
                }

                else {
                    console.log("Error invalid tw resp");
                    res(0);
                }
            }

            if (Date.now() > endTime) {
                clearInterval(id);
                res(0);
            }
        }, 5);
    })
    // 
}






// public functions


var driver = {

    init: function () {
        port = new SerialPort('/dev/ttyS6', { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 });
    },


    // returns a promise 
    write: function (twPacket, numTries, waitMs) {
        return new Promise(async function (resolve, reject) {

            let dwTicks, dwTimeout;
            let byRetries;
            let byState = 0, byBusy;
            let byResult;

            byRetries = numTries;

            let startTime = Date.now();

            do {

                switch (byState) {

                    default:
                    case 0:
                        {

                            dwTimeout = getTickCount() + waitMs;
                            byBusy = 1;
                            byResult = StatusCode.RESULT_COMMS_FAIL;

                            tx(twPacket);

                            byState = 1;
                        }
                        break;

                    // Wait for reply
                    case 1:
                        {

                            // Tx Standard Command
                            if (await rx(twPacket.addr, twPacket.cmd, waitMs)) {
                                // HUB will reply immeadetely with Lengthy command. HUB send reply from sensor approx. 30mS later
                                if (twPacket.cmd == __rxData[1]) {
                                    byState = 100; // Passed
                                }

                                else {
                                    if (P2COMMAND_READ_LASTCOMMAND == __rxData[1])
                                        byState = 2; // Lengthly Command

                                    else
                                        byState = 110; // Failed - Invalid
                                }
                            }

                            else {
                                if ((checkCRC(__rxData, 8)) && (__rxData[0] == twPacket.addr))
                                    byState = 110; // Failed - Invalid
                                else
                                    byState = 111; // Failed - Timeout
                            }
                        }
                        break;

                    case 2:
                        {
                            dwTicks = getTickCount() + MAX_COMMANDTIMEOUT_25MS;
                            byState = 3;
                        }
                        break;

                    // Wait
                    case 3:
                        {
                            if (getTickCount() > dwTicks)
                                byState = 4;
                        }
                        break;

                    // Tx
                    case 4:
                        {
                            tx(twPacket.addr, P2COMMAND_READ_LASTCOMMAND, twPacket.cmd, 0, 0, 0);

                            byState = 5;
                        }
                        break;

                    // Rx
                    case 5:
                        {

                            if (await rx(twPacket.addr, twPacket.cmd, MAX_COMMANDTIMEOUT_50MS)) {
                                if (twPacket.cmd == __rxData[1])
                                    byState = 100; // Passed
                                else {
                                    if (P2COMMANDSTATUS_BUSY == __rxData[2])
                                        byState = 2; // Busy
                                }
                            }
                            else
                                byState = 2; // Re Send

                            // Timeout
                            if (getTickCount() > dwTimeout)
                                byState = 111; // Timeout
                        }
                        break;

                    // Passed
                    case 100:
                        {
                            byResult = StatusCode.RESULT_OKAY;
                            //rxStatus = P2COMMANDSTATUS_PASSED;
                            byState = 200;
                        }
                        break;

                    // Failed - Not Supported
                    case 110:
                        {
                            byResult = StatusCode.RESULT_COMMS_FAIL;
                            //rxStatus = P2COMMANDSTATUS_INVALID;
                            byState = 200;
                        }
                        break;

                    // Failed -Timeout
                    case 111:
                        {
                            if (byRetries) {
                                byRetries--;
                                byBusy = 1;
                                byState = 0; // Restart
                            }

                            else {
                                byResult = StatusCode.RESULT_COMMS_FAIL;
                                byState = 200;
                            }
                        }
                        break;

                    // End
                    case 200:
                        {
                            twResp.packet.addr = __rxData[0];
                            twResp.packet.cmd = __rxData[1];
                            twResp.packet.d1 = __rxData[2];
                            twResp.packet.d2 = __rxData[3];
                            twResp.packet.d3 = __rxData[4];
                            twResp.packet.d4 = __rxData[5];

                            byBusy = 0;
                        }
                        break;
                };

            } while (byBusy);

            twResp.result = byResult;
            twResp.numTries = numTries - byRetries;
            twResp.timeElapsed = Date.now() - startTime;

            resolve(twResp);
        });
    }




};

function foo() {
    console.log("Hello world");
}



// exports.foo = foo;
exports.driver = driver;

exports.TwResp = TwResp;
exports.TwPacket = TwPacket;
exports.StatusCode = StatusCode;