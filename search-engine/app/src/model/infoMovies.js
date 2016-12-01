/**
 * Created by vbraeke on 11/6/16.
 */
var pushInfoYts = require('../format/formatObject').pushInfoYts;

var checkArgs = function (option)
{
    if (option.nbrResult == "" || option.nbrResult == undefined || isNaN(option.nbrResult))
        option.nbrResult = 50;
    if (option.offset == "" || option.offset == undefined || isNaN(option.offset))
        option.offset = 0;
    if (option.sortBy == "" || option.sortBy == undefined)
        option.sortBy = "title";
    if (option.orderBy == "asc")
        option.orderBy = 1;
    if (option.orderBy == "desc")
        option.orderBy = -1;
    if (option.orderBy == "" || option.orderBy == undefined)
        option.orderBy = 1;
    if (option.minRate == "" || isNaN(option.minRate) || option.minRate == undefined && option.maxRate == ""|| isNaN(option.maxRate)  || option.maxRate == undefined)
    {
        option.minRate = 1;
        option.maxRate = 10;
    }
    if (option.min_y == ""   || option.min_y == undefined|| isNaN(option.min_y)   && option.max_y == "" || isNaN(option.max_y)   || option.max_y == undefined)
    {
        option.min_y = 1900;
        option.max_y = 2020;
    }
    if (option.filterBy == ""   || option.filterBy == undefined)
    {
        option.filterBy = [ 'Action', 'Animation', 'Comedy', 'Documentary',
            'Family', 'Film-Noir', 'Horror', 'Musical', 'Romance',
            'Sport', 'War', 'Adventure', 'Biography', 'Crime',
            'Drama', 'Fantasy', 'History', 'Music', 'Mystery',
            'Sci-fi', 'Thriller', 'Western' ];
    }
    else
        option.filterBy = [option.filterBy];
    return (option);
};

module.exports.listMovies  = function (json, cb)
{
    if (json.query == undefined)
        cb(true, "Bad request");
    else {
        var option = require('../format/formatObject').formatOption(json);
        var data_movie =
        {
            nbr_res: 0,
            status: "",
            movies: []
        };

        option = checkArgs(option);
        var cursor = mongodb.collection('dataMovies')
            .find({
                $and: [
                    {title: {$regex: option.query, $options: "i"}},
                    {year: {$gte: option.min_y, $lte: option.max_y}},
                    {rating: {$gte: option.minRate, $lte: option.maxRate}},
                    {genres: {$in: option.filterBy}}
                ]
            })
            .skip(option.offset)
            .limit(option.nbrResult);
        option.sortBy == "title" ? cursor.sort({title: option.orderBy}) : 0;
        option.sortBy == "year" ? cursor.sort({year: option.orderBy}) : 0;
        option.sortBy == "rating" ? cursor.sort({rating: option.orderBy}) : 0;
        option.sortBy == "category" ? cursor.sort({genres: option.orderBy}) : 0;

        cursor.each(function (err, item) {
            if (item == null) {
                data_movie.nbr_res = data_movie.movies.length;
                cb(false, data_movie);
            }
            else
                data_movie = pushInfoYts(data_movie, item);

        });
    }
};

module.exports.suggestMovie = function (json, cb)
{
    var option      = require('../format/formatObject').formatOption(json);
    var data_movie =
    {
        nbr_res     : 0,
        status      : "",
        movies      : []
    };//

    option = checkArgs(option);
    var cursor = mongodb.collection('dataMovies')
        .find({
            $and:
            [
                { year   :  { $gte   : option.min_y ,  $lte     : option.max_y } },
                { rating :  { $gte   : option.minRate, $lte     : option.maxRate } },
                { genres :  { $in    : option.filterBy } }
            ]
        })
        .skip(option.offset)
        .limit(option.nbrResult);


    cursor.each(function(err, item) {

        if(item == null)
        {
            data_movie.nbr_res = data_movie.movies.length;
            cb(false, data_movie);
        }
        else
            pushInfoYts(data_movie, item);
    });
};

module.exports.getRating = function (req, cb)
{
    if (req.imdb == "" || req.imdb == undefined)
        cb (false, { "status" : false, "message" : "Invalid parameter" } );
    else
    {
        mongodb.collection('dataMovies').findOne({imdb: req.imdb}, function (err, res) {
            if (err)
            {
                var list = {"status": false, "message": "Error connect mongo"};
                cb(false, list);
            }
            else
            {
                if (res)
                {
                    var list = {"rating": res.rating, "status": true};
                    cb(false, list);
                }
                else
                    cb(true, {"status": false, "message": "Incorrret imdb"});
            }
        });
    }
};