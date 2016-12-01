/**
 * Created by rdidier on 10/8/16.
 */

const Torrent = require('../model/Torrent');
const Movie = require('../model/Movie');

function broadcastToListener(id, event, data) {
    for (var i in torrentSocketTab[id].listeningUser)
        //protection if the user disconnect while downloading
        if (userSocketDbMatch[torrentSocketTab[id].listeningUser[i]] && clientSocket.sockets.connected[userSocketDbMatch[torrentSocketTab[id].listeningUser[i]]])
            clientSocket.sockets.connected[userSocketDbMatch[torrentSocketTab[id].listeningUser[i]]].emit(event, data);
}

function isPlayable(data) {
    if (data.progress > 1 + moviePlayableSecurityLevel) {
        var timeSpent = new Date().getTime() - torrentSocketTab[data.id].startTime;
        if (timeSpent / 1000 < (torrentSocketTab[data.id].runtime * data.progress / 100)) {
            torrentSocketTab[data.id].playable = true;
            //console.log('Can play !');
            Torrent.update(data.id, {state: "playable"});
            broadcastToListener(data.id, 'canPlay', {
                url: torrentSocketTab[data.id].url,
                id: data.id
            })
        }

    }
}


module.exports = function (socket) {

    torrentSocket = socket;

    socket.emit('plop');

    socket.on('nop', function (data) {
        if (data && data.data && torrentSocketTab[data.data]) {
            broadcastToListener(data.data, 'addRefused', {
                url: torrentSocketTab[data.data].url,
                message: data.message
            });
            delete torrentSocketTab[data.data];
            Torrent.deleteOne(data.data);
        }
    });

    socket.on('addAccepted', function (data) {
        if (data.id && torrentSocketTab[data.id]){
            var d = {};
            d.torrentId = data.id;
            Torrent.update(data.id, {state: "accepted", format: data.extension});
            torrentSocketTab[data.id].format = data.extension;
            Torrent.getImdbToken(d)
                .then(Movie.getSmallInfo)
                .then(function (d) {
                    torrentSocketTab[data.id].runtime = d.runtime;
                    torrentSocketTab[data.id].mainPicture = d.mainPicture;
                    torrentSocketTab[data.id].title = d.title;
                    torrentSocketTab[data.id].imdbToken = d.imdbToken;
                    broadcastToListener(data.id, 'addAccepted', {
                        url: torrentSocketTab[data.id].url,
                        runtime: d.runtime,
                        mainPicture: d.mainPicture,
                        title: d.title,
                        imdbToken: d.imdbToken
                    })
                }, function (d) {
                    //console.log('error while asking movieDb for small information');
                    //console.log(d);
                    torrentSocketTab[data.id].runtime = 21600;
                });
        }
    });

    socket.on('onDownload', function (data) {
        if (data.id && torrentSocketTab[data.id]){
            broadcastToListener(data.id, 'onDownload', {
                url: torrentSocketTab[data.id].url,
                progress: data.progress
            });
            if (torrentSocketTab[data.id].format != 'mkv' && !torrentSocketTab[data.id].playable)
                isPlayable(data)
        }
    });

    socket.on('startDownload', function (id) {
        if (id && torrentSocketTab[id]){
            Torrent.update(id, {state: "onDownload"});
            broadcastToListener(id, 'startDownload', {
                url: torrentSocketTab[id].url
            });
            torrentSocketTab[id].startTime = new Date().getTime();
        }
    });

    socket.on('endDownload', function (id) {
        if (id && torrentSocketTab[id]) {
            Torrent.update(id, {state: "owned"});
            broadcastToListener(id, 'endDownload', {
                id: id,
                url: torrentSocketTab[id].url
            });
            if (torrentSocketTab.format == 'mkv')
                broadcastToListener(id, 'canPlay', {
                    id: id,
                    url: torrentSocketTab[id].url
                });
            delete torrentSocketTab[id];
        }
    })

};