/**
 * Created by rdidier on 10/3/16.
 */


const Error = require('../server/error.js');

function giveMongoError(err, res) {
    return ({
        error: Error.formatError("Mongo", err),
        res: res
    });
}

module.exports.newComment = (data) => {

    return new Promise(function (fulfill, reject) {
        data.args.user = data.currentUser.pseudo;
        data.args.time = data.args.time ? data.args.time : "0";
        mongodb.collection('comments').insertOne(data.args, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                data.ret = {};
                data.ret.id = res.insertedId;
                fulfill(data);
            }
        });
    })
};

module.exports.authorized = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('comments').findOne({_id: data.args.commentId}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res && res.user == data.currentUser.pseudo)
                    fulfill(data);
                else {
                    if (res)
                        reject({error: Error.giveError(17), res: data.res});
                    else
                        reject({error: Error.giveError(18), res: data.res});
                }

            }
        });
    })
};

module.exports.update = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('comments').update({_id: data.args.commentId}, {$set: {commentText: data.args.commentText}}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                fulfill(data);
            }
        });
    })
};

module.exports.delete = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('comments').remove({_id: data.args.commentId}, function (err) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                fulfill(data);
            }
        });
    })
};

module.exports.getFromImdb = (data) => {
    return new Promise(function(fulfill, reject){
        mongodb.collection('comments').find({imdbToken: data.args.imdbToken}, function(err, cursor){
            if (err)
                reject({error: Error.formatError('MongoDb', err)});
            else
                cursor.toArray(function(err, d){
                    if (err)
                        reject({error: Error.formatError('toArray', err)});
                    else {
                        var comments = [];
                        for (var i in d){
                            comments.push({
                                user: d[i].user,
                                id: d[i]._id,
                                time: parseInt(d[i].time),
                                commentText: d[i].commentText
                            })
                        }
                        comments.sort(function(a,b){
                            if (parseInt(a.time) <= parseInt(b.time))
                                return -1;
                            else
                                return 1
                        });
                        data.about.comments = comments;
                        fulfill(data);
                    }
                })
        })
    })
};



