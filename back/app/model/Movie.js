/**
 * Created by rdidier on 10/3/16.
 */


const Error = require('../server/error.js');
const request = require('request');

module.exports.search = (data) => {
    if (data.args.query == '')
        return this.suggest(data);
    else {
        return new Promise(function (fulfill, reject) {
            request({
                url: 'http://' + host + ':' + searchPort + '/request/list?',
                qs: data.args
            }, function (error, response, body) {
                //TODO: status error
                var temp = body ? JSON.parse(body) : {};
                if (!temp.status)
                    reject({error: Error.formatError('search-engine', temp.message? temp.message : 'no message'), res: data.res});
                if (error)
                    reject({error: Error.giveError(11, error), res: data.res});
                else {
                    data.listFilms = temp;
                    for (var i in data.listFilms.movies) {
                        for (var j in data.seenList){
                            data.listFilms.movies[i].seen = (data.seenList[j].imdbToken == data.listFilms.movies[i].imdb);
                        }

                    }
                    fulfill(data);
                }
            });

        })
    }
};

module.exports.suggest = (data) => {
    return new Promise(function (fulfill, reject) {
        data.args.offset = data.args.offset ? data.args.offset : 0;
        //TODO: faire ca autre part
        //data.args.minimumRating = data.args.minimumRating == 10 ? data.args.minimumRating : 9;
        //data.args.maximumRating = data.args.maximumRating == 0 ? data.args.maximumRating : 1;
        request({
            url: 'http://' + host + ':' + searchPort + '/request/suggestion?',
            qs: data.args
        }, function (error, response, body) {
            var temp = body ? JSON.parse(body) : {};
            if (!temp.status)
                reject({error: Error.formatError('search-engine', temp.message? temp.message : 'no message'), res: data.res});
            if (error || !temp.status)
                reject({error: Error.giveError(11, error), res: data.res});
            else {
                data.listFilms = temp;
                for (var i in data.listFilms.movies) {
                    data.listFilms.movies[i].seen = (data.currentUser.seenList.indexOf(data.listFilms.movies[i].imdb) != -1);
                }
                fulfill(data);
            }
        });

    })
};

module.exports.about = (data) => {
    return new Promise(function (fulfill, reject) {

        var id = data.args.imdbToken ? data.args.imdbToken : data.args.movieDbId;
        request({
            url: 'https://api.themoviedb.org/3/movie/' + id + '?api_key=' + movieDbApiKey,
            qs: data.args
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error), res: data.res});
            else {
                content = JSON.parse(body);
                data.args.imdbToken = data.args.imdbToken ? data.args.imdbToken : content.imdb_id;
                if (content.status_code)
                    reject({error: Error.giveError(12, {status: content.status_message}), res: data.res});
                data.about = content;
                data.about.mainPicture = 'http://image.tmdb.org/t/p/original/' + data.about.poster_path;
                data.about.backPicture = 'http://image.tmdb.org/t/p/original/' + data.about.backdrop_path;
                //On rentre ici seulement dans le cas dun appel a movie/player et non movie/about
                if (data.format) {
                    data.about.format = data.format;
                    data.about.imdbToken = data.args.imdbToken ? data.args.imdbToken : data.about.imdb_id;
                    delete data.format;
                }
                delete data.about.poster_path;
                delete data.about.backdrop_path;
                delete data.about.belongs_to_collection;
                delete data.about.popularity;
                delete data.about.vote_count;
                delete data.about.vote_average;
                delete data.about.imdb_id;
                delete data.about.video;
                delete data.about.production_countries;
                fulfill(data);
            }
        });

    })
};

module.exports.getTrailer = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'https://api.themoviedb.org/3/movie/' + data.about.id + '/videos?api_key=' + movieDbApiKey
            + '&site=Youtube&type=Trailer',
            qs: data.args
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error), res: data.res});
            else {
                var respons = JSON.parse(body);
                if (respons.results.length) {
                    var bestOne = respons.results[0];
                    for (var i = 1; i < respons.results.length; i++) {
                        if (bestOne.size < respons.results[i].size)
                            bestOne = respons.results[i];
                    }
                    data.about.trailer = bestOne.key
                }
                fulfill(data);
            }
        });

    })
};

module.exports.getCrew = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'https://api.themoviedb.org/3/movie/' + data.about.id + '/credits?api_key=' + movieDbApiKey,
            qs: data.args
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error), res: data.res});
            else {
                var respons = JSON.parse(body);
                if (respons.status_code)
                    reject({error: Error.giveError(12, {status: content.status_message}), res: data.res});
                if (respons.cast.length) {
                    for (var i in respons.cast) {
                        respons.cast[i].mainPicture = (respons.cast[i].profile_path && respons.cast[i].profile_path != 'null') ? ('http://image.tmdb.org/t/p/w150/' + respons.cast[i].profile_path) : undefined;
                        delete respons.cast[i].profile_path;
                        delete respons.cast[i].credit_id;
                    }
                    data.about.cast = respons.cast;
                }
                if (respons.crew.length) {
                    for (var i in respons.crew) {
                        respons.crew[i].mainPicture = (respons.crew[i].profile_path && respons.crew[i].profile_path != 'null') ? ('http://image.tmdb.org/t/p/w150/' + respons.crew[i].profile_path) : undefined;
                        delete respons.crew[i].profile_path;
                        delete respons.crew[i].credit_id;
                    }
                    data.about.crew = respons.crew;
                }
                fulfill(data);
            }
        });

    })
};

module.exports.getTorrent = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'http://' + host + ':' + searchPort + '/request/torrent?',
            qs: {id: data.args.imdbToken}
        }, function (error, response, body) {
            //TODO: gerer erreur avec status
            var temp = body ? JSON.parse(body) : {};
            if (!temp.status)
                reject({error: Error.formatError('search-engine', temp.message? temp.message : 'no message'), res: data.res});
            if (error)
                reject({error: Error.giveError(11, error), res: data.res});
            else {
                data.about.torrents = temp;
                fulfill(data);
            }
        });
    })
};

module.exports.getImdbRating = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'http://' + host + ':' + searchPort + '/request/rating?',
            qs: {imdb: data.args.imdbToken}
        }, function (error, response, body) {
            var temp = body ? JSON.parse(body) : {};
            if (!temp.status)
                reject({error: Error.formatError('search-engine', temp.message? temp.message : 'no message'), res: data.res});
            if (error)
                reject({error: Error.giveError(11, error), res: data.res});
            else {
                data.about.rating = temp.rating;
                fulfill(data);
            }
        });
    })
};

module.exports.getActor = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'https://api.themoviedb.org/3/person/' + data.args.idActor + '?api_key=' + movieDbApiKey,
            qs: data.args.idActor
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error), res: data.res});
            else {
                var content = JSON.parse(body);
                if (content.status_code)
                    reject({error: Error.giveError(12, {status: content.status_message}), res: data.res});
                data.actor = content;
                data.actor.mainPicture = (content.profile_path && content.profile_path != 'null') ? 'http://image.tmdb.org/t/p/w500/' + content.profile_path : undefined;
                delete data.actor.profile_path;
                fulfill(data);
            }
        });
    })
};

module.exports.getActorMovies = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'https://api.themoviedb.org/3/person/' + data.args.idActor + '/movie_credits?api_key=' + movieDbApiKey,
            qs: data.args.idActor
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error), res: data.res});
            else {
                var content = JSON.parse(body);
                if (content.status_code)
                    reject({error: Error.giveError(12, {status: content.status_message}), res: data.res});
                data.actor.movies = content;
                delete data.actor.movies.id;
                for (var i in data.actor.movies.crew) {
                    data.actor.movies.crew[i].mainPicture = 'http://image.tmdb.org/t/p/w1000/' + data.actor.movies.crew[i].poster_path;
                    delete data.actor.movies.crew[i].poster_path;
                    delete data.actor.movies.crew[i].credit_id
                }
                for (var i in data.actor.movies.cast) {
                    data.actor.movies.cast[i].mainPicture = 'http://image.tmdb.org/t/p/w1000/' + data.actor.movies.cast[i].poster_path;
                    delete data.actor.movies.cast[i].poster_path;
                    delete data.actor.movies.cast[i].credit_id;
                }
                fulfill(data);
            }
        });
    })
};

module.exports.getDownloadImdb = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('torrents').find({imdbToken: data.args.imdbToken, state: "owned"}, function (err, cursor) {
            if (err)
                reject({error: Error.formatError('MongoDb', err)});
            else
                cursor.toArray(function (err, d) {
                    if (err)
                        reject({error: Error.formatError('toArray', err)});
                    else {
                        var owned = {};
                        //on creer un json url->id pour plus de performence dans la prochaine promise
                        for (var i in d)
                            owned[d[i].url] = {id: d[i]._id, format: d[i].format};
                        data.owned = owned;
                        fulfill(data);
                    }
                })
        })
    })
};

module.exports.isTorrentDownload = (data) => {
    return new Promise(function (fulfill) {
        var temp;
        for (var i in data.about.torrents.yts) {
            if (temp = data.owned[data.about.torrents.yts[i].url]) {
                data.about.torrents.yts[i].download = temp.id;
                data.about.torrents.yts[i].format = temp.format;
            }
        }
        for (var j in data.about.torrents.extra_torrent) {
            if (temp = data.owned[data.about.torrents.extra_torrent[j].url]) {
                data.about.torrents.extra_torrent[j].download = temp.id;
                data.about.torrents.extra_torrent[j].format = temp.format;
            }
        }
        delete data.owned;
        fulfill(data);
    })
};

module.exports.getSmallInfo = (data) => {
    return new Promise(function (fulfill, reject) {
        request({
            url: 'https://api.themoviedb.org/3/movie/' + data.imdbToken + '?api_key=' + movieDbApiKey
        }, function (error, response, body) {
            if (error && response.statusCode != 200)
                reject({error: Error.giveError(12, error)});
            else {
                body = JSON.parse(body);
                data.runtime = body.runtime ? Math.floor(body.runtime * 60) : 21600;
                data.runtime = data.runtime * (1 + moviePlayableSecurityLevel / 10);
                data.title = body.original_title;
                data.mainPicture = 'http://image.tmdb.org/t/p/original/' + body.poster_path;
                fulfill(data);
            }
        });

    })
};
