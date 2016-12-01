const http          = require('http');
const https         = require('https');
const io            = require('socket.io');
const server        = http.createServer();
const socket        = io.listen(server);
const fs            = require('fs');
const download      = require('./src/download');
const torrentParser = require('./src/torrent-parser');
const streaming     = require('./src/streaming');
const url           = require('url');

const hostAuthorized = "::ffff:172.17.0.*";

sizeTorrent = [];

var extensionsAuthorized = ['mp4', 'mkv', 'webm', 'Ogg'];

http.createServer(function(req, res){
    streaming(req, res);
}).listen(5003);


socket.on('connection', function(socket){
    if (!socket.conn.remoteAddress.match(hostAuthorized)) {
        socket.emit('end');
        console.log("\033[41m\033[30m[ x ] TORRENT\033[49m\033[39m - connection refuse " + socket.conn.remoteAddress + ' =! ' + hostAuthorized);

        return ;
    }
    console.log("\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - connection accepted");

    socket.on('plop', function(){
        socket.emit('polp');
    });

    socket.on('polp', function(){
        socket.emit('plop');
    });

    socket.on('add', function(data){
        console.log("\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - call add");
        if (data.id == undefined) {
            socket.emit('nop', 'null');
            return;
        }

        if (data.torrent == undefined) {
            socket.emit('nop', data.id);
            return ;
        }

        try{
            var file = fs.createWriteStream(data.id);
        } catch (e) {
            socket.emit('nop', {data: data.id, message: 'general'});
            return;
        }

        //console.log(url.parse(data.torrent).protocol);

        if (!(url.parse(data.torrent).protocol == 'http:' || url.parse(data.torrent).protocol == 'https:')) {
            socket.emit('nop', {data: data.id, message: 'protocole'});
            return ;
        }

        adapterFor(data.torrent).get({
            host: url.parse(data.torrent).host,
            path: url.parse(data.torrent).path,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13',
                //replace with your YTW session cookie to be able to download yts files wich need to be connected
                'Cookie' : 'XXX'
            }}, function(resp){
            try{
                var stream = resp.pipe(file);
            } catch (e) {
                socket.emit('nop', {data: data.id, message: 'general'});
                return;
            }
            //console.log(resp.statusCode);

            //finish download file
            stream.on('finish', function() {
                try {
                    var torrent = torrentParser.open(data.id);
                    if (torrent.announce == undefined) {
                        //on dois etre co pour le torrent (beug depuis mercredi soir)

                        throw "file";
                    } else {
                        a();
                    }

                    function a () {

                        /*
                         * CEHCK FILE OR FILES
                         */

                        var bitStart = 0;
                        var bitStop = 0;
                        var extension;
                        var name;

                        if (torrent.info.files !== undefined) {
                            var idFile;
                            var lengthMaxFile = 0;
                            for (k in torrent.info.files) {
                                if (torrent.info.files[k].length > lengthMaxFile) {
                                    lengthMaxFile = torrent.info.files[k].length;
                                    idFile = k;
                                }
                            }
                            for (var i = 0; i < idFile; i++) {
                                bitStart += torrent.info.files[i].length;
                            }
                            bitStop = bitStart + torrent.info.files[idFile].length;
                            name = torrent.info.files[idFile].path.toString('utf8');
                            extension = name.slice(-3);
                        } else {
                            //console.log('oneFile');
                            name = torrent.info.name;
                            extension = name.slice(-3);
                            bitStart = 0;
                            bitStop = torrent.info.length;
                        }

                        //Check extension
                        //console.log(extension.toString('utf8'));
                        if (extensionsAuthorized.indexOf(extension.toString('utf8')) == -1) {
                            console.log("\033[41m\033[30m[ x ] TORRENT\033[49m\033[39m - extension " + extension.toString('utf8'));
                            throw "extension";
                        }

                        /*var extension = torrent.info.files.path.slice(-3);
                         console.log(torrent.info.name.toString('utf8'));
                         if (extensionsAuthorized.indexOf(extension.toString('utf8')) == -1) {
                         throw "extension";
                         }*/
                        //console.log(bitStart, bitStop);
                        sizeTorrent[data.id + '.' + extension] = bitStop - bitStart;
                        //console.log(sizeTorrent);
                        console.log("\033[42m\033[30m[ ✔ ] TORRENT\033[49m\033[39m - add accepted : " + data.id);
                        socket.emit('addAccepted', {id: data.id, extension: extension.toString('utf8')});
                        download(torrent, data.id + '.' + extension, socket, data.id, bitStart, bitStop);
                    }
                }catch (e){
                    //console.log(e);
                    if (e == 'extension') {
                        socket.emit('nop', {data: data.id, message: 'extension'});
                    } else {
                        socket.emit('nop', {data: data.id, message: 'general'});
                    }
                }
            })
        });
    });

    socket.on('remove', function(data){
        try {
            if (extensionsAuthorized.indexOf(data.slice(-3)) != -1) {
                fs.unlinkSync(data);
            }
        }catch (e){

        }
    });
});

server.listen(5002);

var adapterFor = (function() {
    const url           = require('url');
    const http          = require('http');
    const https         = require('https');
    const adapters = {
        'http:': require('follow-redirects').http,
        'https:' : require('follow-redirects').https
    };

    return function (inputUrl) {
        return adapters[url.parse(inputUrl).protocol];
    }
}());
