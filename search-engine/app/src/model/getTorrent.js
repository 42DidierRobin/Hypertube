/**
 * Created by vbraeke on 11/6/16.
 */

var pushTorrentY         = require('../format/formatObject').pushTorrentY;
var pushExtraT           = require('../format/formatObject').pushExtraT;
var matchExtra           = require('../format/parseResult').matchExtra;
var extraClass           = require('../scrapper/extraScap');
var extraTorrentAPI      = new extraClass;

var checkArg = function (imdb)
{
    if(imdb == undefined || imdb == "")
        return 0;
    else
        return 1;
};
//
module.exports.getTorrent = function (imdb, cb)
{
    var cursor       = mongodb.collection('dataMovies').find( { imdb : imdb } );
    var data_torrent =
    {
        title         : "",
        rating        : 0,
        yts           : [],
        extra_torrent : []
    };
    if(!checkArg(imdb))
        cb(true, {status : false, status_message: "bad request"});
    cursor.each(function(err, item)
    {
        if(item != null)
        {
            data_torrent.title  = item.title;
            data_torrent        = pushTorrentY(item.torrent, item.title);
            data_torrent.rating = item.rating;
        }
        else
        {
            searchExtra(data_torrent.title , function(err, list) {
                if (err)
                    cb(true, list);
                else
                {
                    pushExtraT(data_torrent, list, function (err, data) {
                        cb(false, data);
                    });
                }
            });
        }
    });
};

module.exports.checkTorrent = function (query, cb)
{
    var i  = 0;
    if (query.url == undefined || query.url == '')
        cb(true, {"message" : "url parameter is required"} );
    else if (query.imdb == undefined || query.url == '')
        cb(true, {"message": "imdb parameter is required"} );
    else
    {
        var cursor = mongodb.collection('dataMovies').find(
            {
                $and: [
                    {imdb: query.id},
                    {torrent: {$elemMatch: {url: query.url}}}
                ]
            });

        cursor.each(function (err, item) {
            if (item == null) {
                if (i > 0)
                    cb(false, true);
                else
                {
                    mongodb.collection('dataMovies').findOne({imdb: query.imdb}, function (err, res) {
                        if (err)
                            cb(true, {"message" : "Eroor with mongodb" , "status" : false } );
                        if (!res)
                            cb(true, {"message": "Imdb token invalid"});
                        else {
                            var title = res.title;
                            searchExtra(title, function (err, list) {
                                if (err)
                                    cb(true, false);
                                else
                                {
                                    matchExtra(list, query.url, function (nb) {
                                        if (nb == 1)
                                            cb(false, true);
                                        else
                                            cb(true, false);
                                    })
                                }
                            })
                        }
                    })
                }
            }
            i++;
        })
    }
};


var searchExtra = function (title, cb)
{
    extraTorrentAPI.search(
        {
            with_words  : title,
            category : "movies",
            seeds_from  : 30,
            size_from   :  100000000,
            size_to     : 5000000000
        }).then(function (res) {
            cb(false, res);
        })
        .catch(function(err){
            cb(true, err);
        });
};
