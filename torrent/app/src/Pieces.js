'use strict';

const tp            = require('./torrent-parser');

module.exports.init = (torrent) => {
    var data = {
        requested:null,
        received:null
    };

    data.received = createArray(torrent);
};

function createArray(torrent){
    return
};