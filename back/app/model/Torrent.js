/**
 * Created by rdidier on 10/9/16.
 */

const ObjectId = require('mongodb').ObjectID;
const Error = require('../server/error');
const moment = require('moment');

function giveMongoError(err) {
    return ({
        error: Error.formatError("Mongo", err),
    });
}

module.exports.new = (data) => {

    return new Promise(function (fulfill, reject) {
        mongodb.collection('torrents').findOne({
            imdbToken: data.sent.imdbToken,
            url: data.sent.torrent
        }, function (err, res) {
            if (err)
                reject({error: giveMongoError(err).content, socketId: data.socketId, url: data.sent.torrent});
            else {
                if (res) {
                    delete data.sent;
                    data.torrent = res;
                    data.torrent.id = res._id;
                    delete data.torrent._id;
                    fulfill(data);
                }
                else {
                    var torrent = {};
                    torrent.imdbToken = data.sent.imdbToken;
                    torrent.url = data.sent.torrent;
                    torrent.state = "onWait";
                    torrent.addingDate = new Date();
                    data.torrent = torrent;
                    mongodb.collection('torrents').insertOne(torrent, function (err, docInserted) {
                        if (err){
                            delete data.torrent;
                            reject({url: torrent.url, error: giveMongoError(err).content, socketId: data.socketId});
                        }
                        else {
                            data.torrent.id = docInserted.insertedId;
                            fulfill(data);
                        }
                    })
                }
            }
        });
    })
};

module.exports.update = (id, data) => {
    mongodb.collection('torrents').update({_id: ObjectId(id)}, {$set: data}, function (err, res) {
        if (err)
            reject(giveMongoError(err));
        else {
            //console.log('state in mongo changed');
        }
    });
};

deleteOne = (id) => {
    mongodb.collection('torrents').remove({_id: ObjectId(id)},
    function(err){
        // if (err)
        //     console.log('error in deleting torrent in mongoDb')
        // else
        //     console.log('instance of torrent deleted');
    });
};

module.exports.getOwned = (data) => {
    return new Promise(function(fulfill, reject) {
        mongodb.collection('torrents').findOne({_id: ObjectId(data.args.torrentId)}, function (err, res) {
            if (err)
                reject(giveMongoError(err));
            else {
                if (res && (res.state == "owned" || res.state == "playable")) {
                    data.format = res.format;
                    data.args.imdbToken = res.imdbToken;
                    fulfill(data);
                }
                else {
                    if (res)
                        reject({error: Error.giveError(16), res: data.res});
                    else
                        reject({error: Error.giveError(15), res: data.res});
                }
            }
        });
    });
};

module.exports.getImdbToken = (data) => {
    return new Promise(function(fulfill, reject) {
        mongodb.collection('torrents').findOne({_id: ObjectId(data.torrentId)}, function (err, res) {
            if (err)
                reject(giveMongoError(err));
            else {
                data.imdbToken = res.imdbToken;
                fulfill(data)
            }
        });
    });
};

module.exports.cleanOldMovie = (nbDay) => {
    var collection = mongodb.collection('torrents').find();
    var now = moment(new Date());
    var toDeleteIds = [];
    var added;

    var deleteThem = function (){

        for (i in toDeleteIds){
            deleteOne(toDeleteIds[i].id);
            torrentSocket.emit('remove', toDeleteIds[i].id + '.' + toDeleteIds[i].format )
        }
    };

    collection.each((err, elem) => {
        if (!err && elem){
            added = moment(elem.addingDate);
            if (-added.diff(now, 'days') > nbDay)
                toDeleteIds.push({id: elem._id, format: elem.format});
        }
        if (!elem)
            deleteThem();
    })
};

module.exports.deleteOne = deleteOne;