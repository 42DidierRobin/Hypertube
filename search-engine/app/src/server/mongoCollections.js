/**
 * Created by miku2s on 08/11/2016.
 */

const mongo                 = require('mongodb').MongoClient;
var request                 = require('request');
var formatMovieCollection   = require('../format/formatObject').formatMovieCollection;


// Global c.f docker-conpose file //

dbPort  = process.env.dbPort;
host    = process.env.ipHost;


const url = "https://yts.ag/api/v2/list_movies.jsonp?query_term=&limit=50&page=";

var recursiveAdd = function (i, index, data_movie, db, cname ,cb)
{
    return request(url + i, function (err, res, body) {

        if (!res)
            cb(true, "Error with request dependencies");
        if (!err && res.statusCode == 200)
        {
            try { var json = JSON.parse(body); }
            catch (e) { return (cb(true, "Error with  yts = " + e)) }
        }

        if (json.data.movies === undefined)
            return (cb(false, data_movie));
        for (var j = 0; j < json.data.movies.length; j++)
        {
            data_movie = formatMovieCollection(data_movie, json, j);
            index++;
            db.collection(cname).insertOne(data_movie, function (err, result) {
                if (err)
                    cb(true, "Error Mongo");
            });
        }
        i++;
        if (index >= json.data.movie_count)
            return(cb(false, data_movie));
        else
            recursiveAdd(i ,index,  data_movie,db, cname, cb);
    })
};

var insertCollection = function (db)
{
    var data_movie =  { };
    recursiveAdd(1, 0, data_movie,db, 'dataMovies', function (err, data) {
        if (err)
            console.log(err+ " ERROR MONGO ADD MOVIE COLLECTION ");
        else
            console.log("Movie collections downloaded")
    })
};

var connectMongo = function (cb)
{
    var mongoURI = 'mongodb://' + process.env.dbUserName + ':' + process.env.dbPassword + '@' + host + ':' + dbPort + '/Hypertube';
    mongo.connect(mongoURI, function (err, db) {
        if (err)
            console.log("Error to connect mongo : " + err);
        else
        {
            mongodb = db;
            cb(db);
        }
    });
};

module.exports.updateCollection = function (cb)
{
    var data_movie =  { };
    connectMongo(function (db) {
        recursiveAdd(1, 0 , data_movie, db, 'dataMoviesBis' ,function (err, data) {
            if (err)
                cb(true, err + " ERROR MONGO GET MOVIE COLLECTION ");
            else
            {
                db.collection('dataMovies').rename('toDel');
                db.collection('dataMoviesBis').rename('dataMovies');

                db.collection('toDel').drop();
                db.collection('dataMoviesBis').drop();

                cb(false, data);
            }
        })
    });
};



module.exports.initC = function ()
{
    connectMongo(function (db) {
        insertCollection(db);
    });
};
