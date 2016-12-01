//  -------------------------------------------------------------- GLOBALE CONSTANTE (cf docker-compose)
maxDayOldMovie = 30;
maxFloodSecurity = 1;
host = process.env.ipHost;
apiPort = process.env.apiPort;
dbPort = process.env.dbPort;
mailPort = process.env.mailPort;
searchPort = process.env.searchPort;
torrentPort = process.env.torrentPort;
apiSocketPort = process.env.apiSocketPort;
movieDbApiKey = '1e65a36a240f876c520b63985ef037b0';
adminToken = '42patrickSebastienRocksDuPoney42';
moviePlayableSecurityLevel = 2; //Plus cest grand plus 'canPlay' mettera du temps a etre emit

//  -------------------------------------------------------------- GLOBALE VARIABLE (sockets)
mongodb = {};
clientSocket = {};
torrentSocket = {};
userSocketDbMatch = {};
torrentSocketTab = {};

//  -------------------------------------------------------------- DEPENDENCIES
const express = require('express');
const bodyParser = require('body-parser');
const router = require('../route/routes.js');
const mongo = require('mongodb').MongoClient;
const nodeMailer = require("nodemailer");
const CronJob = require('cron').CronJob;
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ioClient = require('socket.io-client');
const socketClient = ioClient.connect('http://' + host + ':' + torrentPort, {reconnect: true});

//  -------------------------------------------------------------- SERVER LAUNCH
app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    next();
});
require('../tools/dbConnection').connectToDb(mongo);

//  -------------------------------------------------------------- Sockets
require('../socket/torrentClient')(socketClient);
require('../socket/webServer')(io);


//  -------------------------------------------------------------- Sending all request to routes
router.go(app);


//  -------------------------------------------------------------- Mailing
smtpTransport = nodeMailer.createTransport("SMTP", {
    host: host,
    port: mailPort,
    ignoreLS: true
});
module.exports.sendMail = function (args, cb) {
    smtpTransport.sendMail(args, cb);
};

//  -------------------------------------------------------------- Cron job to delete 1 month old movie
new CronJob('00 42 04 * * 1-7', function() {
    console.log('Deleting one month old movie');
    tmp = function (){
        require('../model/Torrent').cleanOldMovie(maxDayOldMovie);
    };
    setTimeout(tmp, 2000);
}, null, true, 'Europe/Paris');



//  -------------------------------------------------------------- Listening
// request http
app.listen(apiPort);
// sockets request
http.listen(apiSocketPort);


