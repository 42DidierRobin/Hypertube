/**
 * Created by rdidier on 11/16/16.
 */

module.exports.connectToDb = (mongo) => {
    var mongoURI = mongoURI = 'mongodb://' + process.env.dbUserName + ':' + process.env.dbPassword + '@' + host + ':' + dbPort + '/Hypertube';

    mongo.connect(mongoURI, function (err, db) {
        if (err) {
            //console.log('error connecting to MongoDB');
            //console.log(err);
        } else {
            mongodb = db;
            console.log('====>  BACK UP AND READY !!')
        }
    })


};