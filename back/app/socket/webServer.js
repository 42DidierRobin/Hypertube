/**
 * Created by rdidier on 10/8/16.
 */

const Checker = require('../Format/daddyChecker.js');
const Torrent = require('../model/Torrent');
const request = require('request');


function updateTorrentSocketTab(object) {
    return new Promise(function (fulfill) {
        if (object.torrent.state == "owned")
            clientSocket.sockets.connected[object.socketId].emit('endDownload', {
                torrentId: object.torrent.id
            });
        else if (torrentSocketTab[object.torrent.id]) {
            if (torrentSocketTab[object.torrent.id].listeningUser.indexOf(object.privateToken) == -1) {
                torrentSocketTab[object.torrent.id].listeningUser.push(object.privateToken);
                if (torrentSocketTab[object.torrent.id].playable)
                    clientSocket.sockets.connected[object.socketId].emit('canPlay', {
                        id: object.torrent.id,
                        url: object.torrent.url
                    });
            }
        }
        else {
            torrentSocketTab[object.torrent.id] = {};
            torrentSocketTab[object.torrent.id].url = object.torrent.url;
            torrentSocketTab[object.torrent.id].playable = false;
            torrentSocketTab[object.torrent.id].listeningUser = [object.privateToken];
            torrentSocket.emit('add', {torrent: object.torrent.url, id: object.torrent.id});
        }
        delete object.privateToken;
        fulfill(object);
    })
}

function middleware(object) {

    return new Promise(function (fulfill, reject) {
        for (var i in userSocketDbMatch) {
            if (userSocketDbMatch[i] == object.socketId) {
                object.privateToken = i;
                fulfill(object);
                //break;
            }
        }
        reject({socketId: object.socketId, error: "acces denied"});
    })
}

function checkId(object) {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').findOne({privateToken: object.privateToken}, function (err, res) {
            if (err) {
                reject({error: Error.formatError("Mongo", err),});
            } else {
                if (res)
                    fulfill(object);
                else
                    reject("Acces denied");
            }
        });
    })
}

function deconnection(id) {
    var index = -1;
    for (var i in userSocketDbMatch) {
        if (userSocketDbMatch[i] == id) {
            index = i;
            break
        }
    }
    if (index != -1) {
        delete userSocketDbMatch[index];
    }
}

function handleConnection(object) {
    var poulpeTab = [];
    for (var i in torrentSocketTab) {
        if (torrentSocketTab[i].listeningUser.indexOf(object.privateToken) != -1) {
            var newData = {};
            newData.url = torrentSocketTab[i].url;
            newData.playable = torrentSocketTab[i].playable;
            newData.torrentId = newData.playable ? i : undefined;
            newData.runtime = torrentSocketTab[i].runtime;
            newData.mainPicture = torrentSocketTab[i].mainPicture;
            newData.title = torrentSocketTab[i].title;
            newData.imdbToken = torrentSocketTab[i].imdbToken;
            poulpeTab.push(newData);
        }
    }
    clientSocket.sockets.connected[object.socketId].emit('poulpe', poulpeTab);
    delete poulpeTab;
    userSocketDbMatch[object.privateToken] = object.socketId;
}

function preventFlood(object) {
    return new Promise((fulfill, reject)=> {
        var count = 0;
        for (var i in torrentSocketTab){
            for (var j in torrentSocketTab[i].listeningUser)
                if (userSocketDbMatch[torrentSocketTab[i].listeningUser[j]] == object.socketId)
                    count++
        }
        if (count > maxFloodSecurity)
            reject({error: 'flood', socketId: object.socketId, url: object.sent.torrent});
        else
            fulfill(object)
    })
}

module.exports = function (io) {

    clientSocket = io;

    //console.log(io.sockets.connected);

    io.sockets.on('connection', function (socket) {


            socket.on('plop', function (data) {
                if (data && data.privateToken) {
                    var object = {};
                    object.privateToken = data.privateToken;
                    object.socketId = socket.id;
                    delete data;
                    checkId(object)
                        .then(handleConnection, function () {
                            //console.log('Connection to service socket refused because of outdated connection.');
                        });
                }
                else
                    deconnection(socket.id);
            });

            socket.on('torrentClick', function (data) {
                var required = ["privateToken", "imdbToken", "torrent"];
                Checker.socketCheck(required, data, socket.id)
                    .then(middleware)
                    .then(preventFlood)
                    .then(Torrent.new)
                    .then(updateTorrentSocketTab)
                    .then(function (d) {
                        //console.log('Adding new torrent..');
                    }, function (d) {
                        clientSocket.sockets.connected[d.socketId].emit('addRefused', {
                            url: d.url,
                            message: d.error,
                        });
                    })
            })
        }
    );
};