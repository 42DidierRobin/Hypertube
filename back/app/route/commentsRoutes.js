
const userOnly = require('../route/routes.js').userOnly;
const Checker = require('../Format/daddyChecker.js');
const Parser = require('../Format/daddyParser.js');
const Error = require('../server/error.js');
const User = require('../model/User.js');
const Comments = require('../model/Comments');

module.exports = (app) => {

    app.post('/Comments', userOnly, function (req, res) {
        var required = ["commentText", "imdbToken"];
        var optional = ["time"];
        Checker.daddyCheck(required, optional, req.body, res, req.currentUser)
            .then(Parser.daddyParse)
            .then(Comments.newComment)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: {id: object.ret.id}
                })
            }, Error.send)
    });

    app.put('/Comments', userOnly, function(req, res){
        var required = ["commentId", "commentText"];
        Checker.daddyCheck(required, null, req.body, res, req.currentUser)
            .then(Parser.daddyParse)
            .then(Comments.authorized)
            .then(Comments.update)
            .then(function (object) {
                object.res.send({
                    error: false
                })
            }, Error.send)
    });

    app.delete('/Comments', userOnly, function(req, res){
        var required = ["commentId"];
        Checker.daddyCheck(required, null, req.body, res, req.currentUser)
            .then(Parser.daddyParse)
            .then(Comments.authorized)
            .then(Comments.delete)
            .then(function (object) {
                object.res.send({
                    error: false
                })
            }, Error.send)
    });

};