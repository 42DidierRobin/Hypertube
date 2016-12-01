'use strict';

module.exports.go = (app) => {

    app.options('*', function(req, res, next){
        //console.log('->options');
        var headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    });

    app.get('/adminCheck', function (req, resp){
            if (req.query && req.query.privateToken && req.query.adminToken == adminToken) {
                mongodb.collection('users').findOne({privateToken: req.query.privateToken}, function (err, res) {
                    if (err) {
                        reject({
                            error: Error.formatError("Mongo", err),
                            res: res
                        });
                    } else {
                        if (res) {
                            resp.send({
                                error: false,
                                identity: true
                            })
                        } else {
                            resp.send({
                                error: false,
                                identity: false
                            })
                        }
                    }
                });
            } else {
                resp.status(401).send({error:true, content: "Access denied."});
            }
    });

    require('./userRoutes.js')(app);
    require('./commentsRoutes.js')(app);
    require('./movieRoutes.js')(app);

    app.all('*', function (req, res){
        res.status('404').send('Are you lost ?');
    })
};

module.exports.userOnly = (req, resp, next) => {
    if (req.query && req.query.privateToken) {
        mongodb.collection('users').findOne({privateToken: req.query.privateToken}, function (err, res) {
            if (err) {
                reject({
                    error: Error.formatError("Mongo", err),
                    res: res
                });
            } else {
                if (res) {
                    req.currentUser = res;
                    delete req.query.privateToken;
                    next();
                } else {
                    resp.status(401).send({error:true, content: "Access denied."});
                }
            }
        });
    } else {
        resp.status(401).send({error:true, content: "Access denied."});
    }
};

module.exports.guestOnly = (req, res, next) => {

    if (req.query && req.query.privateToken) {
        res.status(401).send('You must disconnect first');
    }
    else
        next();
};