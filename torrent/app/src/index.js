'use strict';

const download          = require('./download');
const torrentParser     = require('./torrent-parser');


const torrent = torrentParser.open(process.argv[2]);

download(torrent, '/var/www/html/a.mkv');