'use strict';

const Buffer = require('buffer').Buffer;
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.buildHandshake = torrent => {
    const buf = Buffer.alloc(68);
    // pstrlen
    buf.writeUInt8(19, 0);
    // pstr
    buf.write('BitTorrent protocol', 1);
    // reserved
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);
    // info hash
    torrentParser.infoHash(torrent).copy(buf, 28);
    // peer id
    util.genId().copy(buf, 48);
    return buf;
};