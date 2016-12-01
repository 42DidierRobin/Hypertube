'use strict';

const dgram         = require('dgram');
const Buffer        = require('buffer').Buffer;
const urlParse      = require('url').parse;
const crypto        = require('crypto');
const torrentParser = require('./torrent-parser');
const util          = require('./util');

module.exports.getPeers = (url, torrent, callback) => {

    //console.log('getPeer module call');

    const socket    = dgram.createSocket('udp4');
    //const url       = torrent.announce.toString('utf8');

    // send connect request
    try {
        udpSend(socket, connectRequest(), url);
    } catch(e){
        //console.log('tracker probleme : ' + url);
    }

    socket.on('message', response => {
        const type = typeResponse(response);

        //debug
        //console.log('-------------------');
        //console.log('UDP Resp : ' + type);
        //console.log(response);

        if (type == 'connect') {
            //connection success
            const jsonConnect = connectResponse(response);
            //console.log('connectionID : ' + jsonConnect.connectionId);
            //send request announce
            //console.log('connect', url);
            udpSend(socket, announceRequest(jsonConnect.connectionId, torrent), url);
        } else if (type == 'announce') {
            const jsonAnnounce = announceResponse(response);
            //console.log('announce', url, jsonAnnounce);
            callback(jsonAnnounce.peers);
        } else {
            //console.log('CRASH');
        }
    });
};

function udpSend(socket, message, url2, callback = () => {}) {
    const url = urlParse(url2);
    if (url.port == null) {
        url.port = 6881;
    }
    socket.send(message, 0, message.length, url.port, url.hostname, callback);

    //debug
    //console.log('-------------------');
    //console.log('UDP Send : ' + url.hostname + ':' + url.port);
    //console.log(message)
}

function typeResponse(response){
    //http://www.bittorrent.org/beps/bep_0015.html
    //bytes 0 = 0 : connect
    //bytes 0 = 1 : announce

    const type = response.readUInt32BE(0);
    if (type == 0) return 'connect';
    if (type == 1) return 'announce';
    return 'error';
}

function connectRequest(){
    //http://www.bittorrent.org/beps/bep_0015.html
    //return : <Buffer 00 00 04 17 27 10 19 80 00 00 00 00 a6 ec 6b 7d>

    const buffer = Buffer.alloc(16);            //buffer of 16 Bytes
    buffer.writeUInt32BE(0x417, 0);             //connection ID
    buffer.writeUInt32BE(0x27101980, 4);        //connection ID
    buffer.writeUInt32BE(0, 8);                 //action
    crypto.randomBytes(4).copy(buffer, 12);     //transaction ID
    return buffer;
}

function connectResponse(response){
    // http://www.bittorrent.org/beps/bep_0015.html
    // Offset  Size            Name            Value
    // 0       32-bit integer  action          0 // connect
    // 4       32-bit integer  transaction_id
    // 8       64-bit integer  connection_id
    // 16

    var data = {};

    data.action = response.readUInt32BE(0);
    data.transactionId = response.readUInt32BE(4);
    data.connectionId = response.slice(8);

    //debug
    //console.log('-------------------');
    //console.log('connectResponse :');
    //console.log(data);

    return data;
}

function announceRequest(connectionId, torrent, port=6881){
    // http://www.bittorrent.org/beps/bep_0015.html
    // Offset  Size    Name    Value
    // 0       64-bit integer  connection_id
    // 8       32-bit integer  action          1 // announce
    // 12      32-bit integer  transaction_id
    // 16      20-byte string  info_hash
    // 36      20-byte string  peer_id
    // 56      64-bit integer  downloaded
    // 64      64-bit integer  left
    // 72      64-bit integer  uploaded
    // 80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
    // 84      32-bit integer  IP address      0 // default
    // 88      32-bit integer  key
    // 92      32-bit integer  num_want        -1 // default
    // 96      16-bit integer  port
    // 98

    const buffer = Buffer.allocUnsafe(98);

    //console.log(connectionId);

    connectionId.copy(buffer, 0);                       //connection ID
    buffer.writeUInt32BE(1, 8);                         //action
    crypto.randomBytes(4).copy(buffer, 12);             //transaction ID
    torrentParser.infoHash(torrent).copy(buffer, 16);   //info hash
    util.genId().copy(buffer, 36);                      //peer ID
    Buffer.alloc(8).copy(buffer, 56);                   //downloaded
    torrentParser.size(torrent).copy(buffer, 64);       //left
    Buffer.alloc(8).copy(buffer, 72);                   //uploaded
    buffer.writeUInt32BE(0, 80);                        //event
    buffer.writeUInt32BE(0, 80);                        //IP Address
    crypto.randomBytes(4).copy(buffer, 88);             //key
    buffer.writeInt32BE(-1, 92);                        //num_want
    buffer.writeUInt16BE(port, 96);                     //port
    return buffer;
}

function announceResponse(response){
    // http://www.bittorrent.org/beps/bep_0015.html
    // Offset      Size            Name            Value
    // 0           32-bit integer  action          1 // announce
    // 4           32-bit integer  transaction_id
    // 8           32-bit integer  interval
    // 12          32-bit integer  leechers
    // 16          32-bit integer  seeders
    // 20 + 6 * n  32-bit integer  IP address
    // 24 + 6 * n  16-bit integer  TCP port
    // 20 + 6 * N

    var data = {};
    try {
        data.action = response.readUInt32BE(0);
        data.transactionId = response.readUInt32BE(4);
        data.leechers = response.readUInt32BE(8);
        data.seeders = response.readUInt32BE(12);
        data.peers = [];
        response = response.slice(20);
        for (var i = 0; i < response.length; i += 6) {
            data.peers.push({
                ip: response.slice(i, i + 6).slice(0, 4).join('.'),
                port: response.slice(i, i + 6).readUInt16BE(4)
            });
        }
    } catch(e){

    }
    //debug
    //console.log('-------------------');
    //console.log('announceResponse :');
    //console.log(data);

    return data;
}