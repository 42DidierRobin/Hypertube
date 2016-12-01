/**
 * Created by rdidier on 10/3/16.
 */

const userOnly = require('../route/routes.js').userOnly;
const Checker = require('../Format/daddyChecker.js');
const Comments = require('../model/Comments');
const Subtitle = require('../tools/subtitle');
const Error = require('../server/error.js');
const Torrent = require('../model/Torrent');
const Movie = require('../model/Movie.js');
const User = require('../model/User');

module.exports = (app) => {

    app.get('/Movies/player', userOnly, function (req, res) {
        var required = ["torrentId"];
        Checker.daddyCheck(required, null, req.query, res, req.currentUser)
            .then(Torrent.getOwned)
            .then(Movie.about)
            .then(User.addSeenMovie)
            .then(Movie.getCrew)
            .then(Movie.getImdbRating)
            .then(Subtitle.getListSubtitle)
            .then(Comments.getFromImdb)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: object.about
                })
            }, Error.send)
    });

    app.get('/Movies/search', userOnly, function (req, res) {
        var required = ["query"];
        var optional = ["offset", "nbrResult", "orderBy", "sortBy", "filterBy",
            "minimumRating", "maximumRating", "minimumYear", "maximumYear", "filter"];
        Checker.daddyCheck(required, optional, req.query, res, req.currentUser)
            .then(User.getSeenList)
            .then(Movie.search)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: object.listFilms
                })
            }, Error.send)
    });

    app.get('/Movies/about', userOnly, function (req, res) {
        var required = [];
        var optional = ["movieDbId", "imdbToken"];
        if (!req.query) {
            Error.send({error: Error.giveError(14), res: res});
        }
        else {
            Checker.daddyCheck(required, optional, req.query, res, req.currentUser)
                .then(Movie.about)
                .then(Movie.getCrew)
                .then(Movie.getTrailer)
                .then(Movie.getTorrent)
                .then(Movie.getImdbRating)
                .then(Movie.getDownloadImdb)
                .then(Movie.isTorrentDownload)
                .then(function (object) {
                    delete object.about.id;
                    object.res.send({
                        error: false,
                        content: object.about
                    })
                }, Error.send)
        }
    });

    app.get('/Actor', userOnly, function (req, res) {
        var required = ["idActor"];
        Checker.daddyCheck(required, null, req.query, res, req.currentUser)
            .then(Movie.getActor)
            .then(Movie.getActorMovies)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: object.actor
                })
            }, Error.send)
    });

    app.get('/Subtitle', userOnly, function (req, res) {
        var required = ["imdbToken", "language"];
        Checker.daddyCheck(required, null, req.query, res, req.currentUser)
            .then((d) => {
                Subtitle.checkIfOwned(d)
                    .then(Subtitle.sendSubtitle, (d) => {
                        Subtitle.getSubUrl(d)
                            .then(Subtitle.downloadSub)
                            .then(Subtitle.unzipSub)
                            .then(Subtitle.srtToVtt)
                            .then(Subtitle.clean)
                            .then(Subtitle.sendSubtitle, Subtitle.sendError);

                    })
            }, Error.send)


    });
};