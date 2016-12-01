'use strict';

const fs        = require('fs');
const bencode   = require('bencode');
const crypto    = require('crypto');
const bignum    = require('bignum');

module.exports.LEN = Math.pow(2, 14);

module.exports.open = (filePath) => {
    return bencode.decode(fs.readFileSync(filePath));
};

module.exports.size = torrent => {
    //return : buffer of 8 bytes
    //bignum if torrent is larger than a 32-bit integer
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
        torrent.info.length;

    return bignum.toBuffer(size, {size: 8});
};

module.exports.infoHash = torrent => {
    //return : buffer of 20 bytes -> <Buffer 11 7e 3a 66 65 e8 ff 1b 15 7e 5e c3 78 23 57 8a db 8a 71 2b>
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
    const pieceLength = this.pieceLen(torrent, pieceIndex);
    return Math.ceil(pieceLength / this.LEN);
};

module.exports.pieceLen = (torrent, pieceIndex) => {
    const totalLength = bignum.fromBuffer(this.size(torrent)).toNumber();
    const pieceLength = torrent.info['piece length'];

    const lastPieceLength = totalLength % pieceLength;
    const lastPieceIndex = Math.floor(totalLength / pieceLength);

    return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};

module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
    const pieceLength = this.pieceLen(torrent, pieceIndex);

    const lastPieceLength = pieceLength % this.LEN;
    const lastPieceIndex = Math.floor(pieceLength / this.LEN);

    return blockIndex === lastPieceIndex ? lastPieceLength : this.LEN;
};