/**
 * Created by vbraeke on 11/6/16.
 */
// INIT SERVER  //

const express           = require('express');
const bodyParser        = require('body-parser');
const app               = express();
const mongo             = require('mongodb').MongoClient;
const CronJob           = require('cron').CronJob;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(function (req,res) {
//     res.setHeader('Access-Control-Allow-Origin', 'http://XXX.XXX:4201');
// });
// GLOBAL c.f docker-compose //
dbPort                  = process.env.dbPort;
host                    = process.env.ipHost;
mongodb                 = {};

// INIT MONGO //

var mongoURI = 'mongodb://' + process.env.dbUserName + ':' + process.env.dbPassword + '@' + host + ':' + dbPort + '/Hypertube';
mongo.connect(mongoURI, function (err, db) {
    if (err)
    {
        console.log('error connecting to MongoDB ');
        console.log(err);
    }
    else
    {
        mongodb = db;
        var test = mongodb.collection('dataMovies').find({});
        var i = 0;
        test.each(function (err, item) {
            if (err)
                console.log("Error for parse cursor collections");
            if (item == null)
            {
                if (i > 0)
                    console.log("Movies collection is up to date");
                else
                {
                    console.log("Downloading movies collection ");
                    require('./mongoCollections').initC();
                }
            }
            i++;
        });
    }
});

// ROUTES //

require('../route/route')(app);

// CRON JOB TO COMPARE LOCAL MONGO COLLECTION WITH YTS API //

new CronJob('00 42 04 * * 1-7', function() {
    console.log("Updatating DataCollection");
    var updateCollection = require('./mongoCollections').updateCollection;
    updateCollection(function (err, data) {
        if(err)
            console.log(data);
        else
            console.log("Update Done");
    });
}, null, true, 'Europe/Paris');

app.listen(6002);
