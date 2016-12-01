/**
 * Created by vbraeke on 11/6/16.
 */


var   listMovies    = require('../model/infoMovies').listMovies;
var   suggestMovie  = require('../model/infoMovies').suggestMovie;
var   getTorrent    = require('../model/getTorrent').getTorrent;
var   checkTorrent  = require('../model/getTorrent').checkTorrent;
var   getRating     = require('../model/infoMovies').getRating;

const hostAuthorized = "::ffff:172.17.0.*";

module.exports = function (app)
{
    app.all('*', function(req, res, next) {
        if (req.connection.remoteAddress.match(hostAuthorized))
            next();
        else
            res.send( { status: false, status_message: "Access denied dirty bitch"})
    });

    app.get('/request/suggestion', function (req, res) {
        suggestMovie(req.query, function (err, list) {
            if (err)
                list.status = false;
            else
                list.status = true;
            res.send(list);
            list = null;
        });
    });

    app.get('/request/list', function (req, res) {
        listMovies(req.query, function (err, list) {
            if (err)
                list.status = false;
            else
                list.status = true;
            res.send(list);
            list = null;
        });
    });

    app.get('/request/torrent', function (req, res) {
        var imdb = req.query.id;
        getTorrent(imdb, function (err, list) {
            if (err)
                list.status = false;
            else
                list.status = true;
            res.send(list);
            imdb = null;
            list = null;
        });
    });

    app.get('/request/check', function (req, res) {
        checkTorrent(req.query, function (err, source) {
            if (err)
            {
                if (source.status)
                {
                    var result = {
                        status : false,
                        message : source.message,
                        matching : false
                    };
                }
                var result = {
                    status : true,
                    message : source.message,
                    matching : false
                };
            }
            else
            {
                var result = {
                    status: true,
                    matching: true,
                }
            };
            res.send(result);
        });
    })

    app.get('/request/rating', function (req, res) {
        getRating(req.query, function (err, data) {
            res.send(data);
        })
    })
};