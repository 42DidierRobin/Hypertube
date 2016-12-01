const net           = require('net');
const Buffer        = require('buffer').Buffer;
const tracker       = require('./tracker');
const util          = require('./util');
const torrentParser = require('./torrent-parser');
const fs            = require('fs');

module.exports = (torrent, path, socket, id, bitstart, bitstop) => {

    //delete old torrent file
    try {
        fs.unlinkSync(path);
    }catch (e){

    }

    var infoTorrent = {
        piecesRequested: getPiecesArray(torrent),
        piecesReceived: getPiecesArrayWithBlock(torrent),
        piecesAvailable: getPiecesArray(torrent),
        piecesStat: 0,
        nbPieceAvailable: 0,
        start: 0,
        file: fs.openSync(path, 'w'),
        torrent: torrent,
        maxPerIndex: 30,
        minPerIndex: 5,
        isFullAvailable: false,
        isStated: false,
        piecesPeers: 0,
        nbrPiece: torrent.info.pieces.length / 20,
        socket: socket,
        id: id,
        time: null,
        bitStart: bitstart,
        bitStop: bitstop,
        waitForStart: 10000,
        antiFlood: 100,
        stopWihoutStart: 100000,
        maxPeer: 200,
        antiCrash: 10000,
        antiCrashNumber: 0,
        currentPiece: 0,
        crash: 0
    };

    var trackers = [];
    var peersList = [];

    torrent['announce-list'].forEach(tracker => {
        trackers.push(tracker.toString('utf8'));
    });

    trackers.forEach(url => tracker.getPeers(url, torrent, peers => {
        if (peers != undefined) {
            peers.forEach(peer => {
                //remove les doublons dans la liste des peers
                var index = peersList.findIndex(x => x.ip == peer.ip);
                if (index === -1) {
                    peersList.push(peer);
                }
            });
        }
    }));

    setTimeout(function(){
        if (peersList.length < infoTorrent.minPerIndex) {
            //Si pas assez de peers -> retournée addRefuse
            //console.log('refuse, pas assez de peer ', peersList.length);
            infoTorrent.socket.emit('nop', {data: infoTorrent.id, message: 'peer'});
        } else {
            loop(0, peersList, infoTorrent);
        }
    }, infoTorrent.waitForStart);

    setTimeout(function(){
        if (infoTorrent.nbPieceAvailable != infoTorrent.nbrPiece) {
            //console.log('STOP - Pas assez de peer');
            infoTorrent.socket.emit('nop', {data: infoTorrent.id, message: 'peer'});
            //console.log(infoTorrent.nbPieceAvailable, infoTorrent.nbrPiece)
        }
    }, infoTorrent.waitForStart + infoTorrent.stopWihoutStart);
};

function reloadPeer(){

}

function loop(index, list, torrent){
    setTimeout(function () {
        if (index < torrent.maxPeer) {
            download(list[index], torrent);
            if (index < list.length && torrent.start == 0)
                loop(index + 1, list, torrent);
        }
    }, torrent.antiFlood);
}

function getPiecesArray(torrent){
    const nPieces = torrent.info.pieces.length / 20;
    const arr = new Array(nPieces).fill(null);
    return arr.map((_, i) => new Array().fill(i));
}

function getPiecesArrayWithBlock(torrent){
    const nPieces = torrent.info.pieces.length / 20;
    const arr = new Array(nPieces).fill(null);
    return arr.map((_, i) => new Array(torrentParser.blocksPerPiece(torrent, i)).fill(false));
}

function download(peer, infoTorrent){
    //1. send Handshake message
    //2. receive Handshake message
    //3 . send interested message

    var infoPeer = {
        queue: [],
        choked: false,
        statusHandshake: false,
        socket: new net.Socket(),
        savedBuffer: Buffer.alloc(0),
        peer: peer
    };

    //handshake request
    if (infoPeer.peer == undefined || infoPeer.peer.port == undefined || infoPeer.peer.ip == undefined)
        return ;
    infoPeer.socket.connect(infoPeer.peer.port, infoPeer.peer.ip, (res) => {
        infoPeer.socket.write(handshakeRequest(infoTorrent.torrent));
    });

    //on error
    infoPeer.socket.on('error', function(error){

    });

    //on message received
    infoPeer.socket.on('data', response => {

        //1. concat response with buffer
        infoPeer.savedBuffer = Buffer.concat([infoPeer.savedBuffer, response]);

        //2. check if response is terminate
        while (infoPeer.savedBuffer.length >= 4 && infoPeer.savedBuffer.length >= responseLength(infoPeer)) {

            //parseResponse
            parseResponse(infoPeer.savedBuffer.slice(0, responseLength(infoPeer)), infoPeer, infoTorrent);

            //reset buffer and handshake
            infoPeer.savedBuffer = infoPeer.savedBuffer.slice(responseLength(infoPeer));
            infoPeer.statusHandshake = true;
        }
    });
}

function responseLength(infoPeer){
    if (infoPeer.statusHandshake)
        return infoPeer.savedBuffer.readInt32BE(0) + 4;
    return infoPeer.savedBuffer.readUInt8(0) + 49
}

function parseResponse(response, infoPeer, infoTorrent){
    //1. detect if handshake response
    if (response.length === response.readUInt8(0) + 49 && response.toString('utf8', 1, 20) === 'BitTorrent protocol') {

        //handshake response, send interested request
        infoPeer.socket.write(interestedRequest());
    } else {

        //Another response, parse response now
        var data = {
            id: null,
            size: null,
            payload: null
        };

        //parse ID
        if (response.length > 4)
            data.id = response.readInt8(4);

        //parse Size
        data.size = response.readInt32BE(0);

        //parse payload
        if (response.length > 5) {
            var tmpPayload = response.slice(5);
            data.payload = tmpPayload;
        }

        //if id 6 7 8, payload extented
        if (data.id === 6 || data.id === 7 || data.id === 8) {
            var tmp = data.payload.slice(8);
            data.payload = {
                index: tmpPayload.readInt32BE(0),
                begin: tmpPayload.readInt32BE(4)
            };
            if (data.id === 7) {
                data.payload['block'] = tmp;
            } else {
                data.payload['length'] = tmp;
            }
        }

        //dispatch request
        if (data.id === 0){
            //choke request
            chokeResponse(infoPeer);
        } else if (data.id === 1){
            //unchock request
        } else if (data.id === 4){
            //have request
            haveResponse(infoPeer, infoTorrent, data)
        } else if (data.id === 5){
            //bitfield request
            bitfieldResponse(infoPeer, infoTorrent, data)
        } else if (data.id === 7){
            //piece request (response data)
            pieceResponse(infoTorrent, data);
        } else {
            //euh
        }
    }
}

function chokeResponse(infoPeer){
    infoPeer.choked = true;
}

function pieceResponse(infoTorrent, response){
    //check if pieces is already received
    if (infoTorrent.piecesReceived[response.payload.index][response.payload.begin / torrentParser.LEN]) {
        return;
    }
    infoTorrent.piecesReceived[response.payload.index][response.payload.begin / torrentParser.LEN] = true;

    const offset = response.payload.index * infoTorrent.torrent.info['piece length'] + response.payload.begin - infoTorrent.bitStart;
    if (offset >= 0) {
        fs.write(infoTorrent.file, response.payload.block, 0, response.payload.block.length, offset, () => {});
    } else if (offset + torrentParser.blockLen(infoTorrent.torrent, 0, 0) >= 0){
        var tmpOffset = response.payload.block.length + offset;
        fs.write(infoTorrent.file, response.payload.block.slice(-tmpOffset), 0, response.payload.block.slice(-tmpOffset).length, 0, () => {});
    } else {

    }


    //check if index is terminated
    for (var i = 0; i < torrentParser.blocksPerPiece(infoTorrent.torrent, response.payload.index); i++) {
        if (!(infoTorrent.piecesReceived[response.payload.index][i]))
            return;
    }

    //check if download is
    if (response.payload.index == infoTorrent.nbrPiece - 1){
        infoTorrent.socket.emit('endDownload', infoTorrent.id);
        console.log("\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - end download : " + infoTorrent.id);
        try { fs.closeSync(infoTorrent.file); } catch(e) {}
        return ;
    }
    infoTorrent.antiCrashNumber = 0;
    infoTorrent.currentPiece = response.payload.index + 1;
    startDownloadPiece(infoTorrent, (response.payload.index + 1));

    if (infoTorrent.time + 1000 < Date.now()){
        infoTorrent.time = Date.now();
        var prog = (100 / infoTorrent.nbrPiece) * response.payload.index;

        infoTorrent.socket.emit('onDownload', {id:infoTorrent.id, progress:prog});
        console.log("\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - download : " + infoTorrent.id + " - " + prog);
        printPercent(response.payload.index, infoTorrent.nbrPiece);
    }
}

function printPercent(index, total){
    var value = (100 / total) * index;
    //console.log('download : ' + value + '%')
}

function haveResponse(infoPeer, infoTorrent, data) {
    addIndexAvailable(data.payload.readUInt32BE(0), infoPeer, infoTorrent);
}

function bitfieldResponse(infoPeer, infoTorrent, data){
    data.payload.forEach((byte, i) => {
        for (let j = 0; j < 8; j++) {
            if (byte % 2) {
                addIndexAvailable(i*8+7-j, infoPeer, infoTorrent);
            }
            byte = Math.floor(byte / 2);
        }
    });
}

function addIndexAvailable(pieceIndex, infoPeer, infoTorrent){
    if (infoTorrent.isFullAvailable) {
        return;
    }
    const blocksPerPiece = torrentParser.blocksPerPiece(infoTorrent.torrent, pieceIndex);
    var data = Array();
    var tmp = Array();
    for (var i = 0; i < blocksPerPiece; i++) {
        data.push({
            index: pieceIndex,
            begin: i * torrentParser.LEN,
            length: torrentParser.blockLen(infoTorrent.torrent, pieceIndex, i)
        });
        tmp['socket'] = infoPeer.socket;
        tmp['index'] = pieceIndex;
        tmp['data'] = data;
    }

    //console.log(infoTorrent.piecesAvailable.length);

    //console.log(infoTorrent.piecesAvailable);
    if (infoTorrent.piecesAvailable[pieceIndex].length == infoTorrent.minPerIndex) {
        infoTorrent.nbPieceAvailable++;
    }

    //adding info to infoTorrent
    if (infoTorrent.piecesAvailable[pieceIndex].length < infoTorrent.maxPerIndex){
        infoTorrent.piecesAvailable[pieceIndex].push(tmp);
        infoTorrent.piecesPeers++;

        //console.log(infoTorrent.piecesAvailable);

        //check if torrent is full available
        if (!infoTorrent.isFullAvailable) {
            if (infoTorrent.piecesPeers / infoTorrent.maxPerIndex == infoTorrent.nbrPiece) {
                infoTorrent.isFullAvailable = true;
                //startDownload(infoTorrent);
            }
        }

        if (!infoTorrent.isStated) {
            if (infoTorrent.nbPieceAvailable == infoTorrent.nbrPiece) {
                infoTorrent.isStated = true;
                startDownload(infoTorrent);
            }
        }
    }
}

function startDownload(infoTorrent){
    infoTorrent.socket.emit('startDownload', infoTorrent.id);
    infoTorrent.time = Date.now();
    startDownloadPiece(infoTorrent, 0);
}

function startDownloadPiece(infoTorrent, index){
    const blocks = torrentParser.blocksPerPiece(infoTorrent.torrent, index);

    if (infoTorrent.crash)
        return ;
    for (var i = 0; i < blocks; i++) {
        for (var j = 0; j < infoTorrent.piecesAvailable[index].length; j++) {
            if (!infoTorrent.piecesReceived[index][j])
                infoTorrent.piecesAvailable[index][j].socket.write(pieceRequest(infoTorrent, infoTorrent.piecesAvailable[index][j].data, i));
        }
    }

    setTimeout(function () {
        for (var i = 0; i < blocks; i++) {
            for (var j = 0; j < infoTorrent.piecesReceived[index].length; j++) {
                if (infoTorrent.antiCrashNumber > 10) {
                    infoTorrent.socket.emit('nop', {data: infoTorrent.id, message: 'general'});
                    infoTorrent.crash = 1;
                    return ;
                } else {
                    if (!infoTorrent.piecesReceived[index][j]) {
                        startDownloadPiece(infoTorrent, index);
                        infoTorrent.antiCrashNumber = infoTorrent.antiCrashNumber + 1;
                        console.log('\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - antiCrash -> ' + infoTorrent.antiCrashNumber + ' ' + infoTorrent.id);
                        return;
                    }
                }
            }
        }
    }, infoTorrent.antiCrash);
}

function pieceRequest(infoTorrent, data, block){
    const buffer = Buffer.alloc(17);

    buffer.writeUInt32BE(13, 0);                        //length
    buffer.writeUInt8(6, 4);                            //ID
    buffer.writeUInt32BE(data[block].index, 5);             //Index
    buffer.writeUInt32BE(data[block].begin, 9);             //begin
    buffer.writeUInt32BE(data[block].length, 13);           //length

    return buffer;
}

function interestedRequest(){
    // https://wiki.theory.org/BitTorrentSpecification
    // interested: <len=0001><id=2>
    // The interested message is fixed-length and has no payload.

    const buffer = Buffer.alloc(5);

    buffer.writeUInt32BE(1, 0);                            //length
    buffer.writeUInt8(2, 4);                               //ID

    return buffer;
}


function handshakeRequest(torrent){
    // https://wiki.theory.org/BitTorrentSpecification#Handshake
    // handshake: <pstrlen><pstr><reserved><info_hash><peer_id>
    // The handshake is a required message and must be the first message transmitted by the client. It is (49+len(pstr)) bytes long.

    const buffer = Buffer.alloc(68);

    buffer.writeUInt8(19, 0);                              //pstrlen
    buffer.write('BitTorrent protocol', 1);                //pstr
    buffer.writeUInt32BE(0, 20);                           //reserved
    buffer.writeUInt32BE(0, 24);                           //resserved
    torrentParser.infoHash(torrent).copy(buffer, 28);      //info hash
    util.genId().copy(buffer, 48);                         //peer id

    return buffer;
}
