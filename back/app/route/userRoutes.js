"use strict";


const guestOnly = require('../route/routes.js').guestOnly;
const userOnly = require('../route/routes.js').userOnly;
const Checker = require('../Format/daddyChecker.js');
const Omniauth = require('../Omniauth/omniauth.js');
const Parser = require('../Format/daddyParser.js');
const Error = require('../server/error.js');
const User = require('../model/User.js');

module.exports = (app) => {

    app.post('/User/signUp', guestOnly, function (req, res) {
        var required = ['pseudo', 'email', 'password', 'lastName', 'firstName', 'base64'];
        var optional = ['lang'];
        req.body.lang = req.body.lang ? req.body.lang : 'en';
        Checker.daddyCheck(required, optional, req.body, res)
            .then(Parser.daddyParse)
            .then(User.mailExist)
            .then(User.pseudoExist)
            .then(User.createPrivateToken)
            .then(User.createEmailToken)
            .then(User.newUser)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: 'user ' + object.args.pseudo + ' successfully signed up.'
                })
            }, Error.send)

    });

    app.post('/User/signIn', guestOnly, function (req, res) {
        var required = ['pseudo', 'pass'];
        Checker.daddyCheck(required, null, req.body, res)
            .then(User.checkEmailVerifyAndOmniauth)
            .then(User.connect)
            .then(function (object) {
                object.res.send({
                    error: false,
                    content: {
                        privateToken: object.result
                    }
                })
            }, Error.send)
    });

    app.get('/User/emailExist', function (req, res) {
        var required = ['email'];
        Checker.daddyCheck(required, null, req.query, res)
            .then(User.mailExist)
            .then(function (obj) {
                obj.res.send({error: false, content: {exist: false}})
            }, function (obj) {
                Error.send(obj);
            })
    });

    app.get('/User/pseudoExist', function (req, res) {
        var required = ['pseudo'];
        Checker.daddyCheck(required, null, req.query, res)
            .then(User.pseudoExist)
            .then(function (obj) {
                obj.res.send({error: false, content: {exist: false}})
            }, function (obj) {
                Error.send(obj);
            })
    });

    app.put('/User/confirmMail', guestOnly, function (req, res) {
        var required = ['emailToken'];
        Checker.daddyCheck(required, null, req.body, res)
            .then(User.checkEmailToken)
            .then(User.deleteEmailToken)
            .then(function (obj) {
                obj.res.send({error: false})
            }, Error.send)

    });

    app.put('/User/update', userOnly, function (req, res) {
        var optional = ['lang', 'firstName', 'lastName', 'base64'];
        if (req.currentUser.omniauth && (req.body.firstName || req.body.lastName || req.body.lastName))
            Error.send({error: Error.giveError(20), res: res});
        else {
            if (!Object.keys(req.body).length) {
                res.send({error: false, content: "no change made."})
            }
            else {
                Checker.daddyCheck([], optional, req.body, res, req.currentUser)
                    .then(Parser.daddyParse)
                    .then(User.update)
                    .then(function (obj) {
                        obj.res.send({error: false})
                    }, Error.send)
            }
        }
    });

    app.put('/User/newEmail', userOnly, function (req, res) {
        var required = ['email'];
        if (req.currentUser.ecole42Id || req.currentUser.facebookId)
            Error.send({error: Error.giveError(20), res: res});
        else {
            Checker.daddyCheck(required, null, req.body, res, req.currentUser)
                .then(User.mailExist)
                .then(User.createEmailToken)
                .then(User.updateEmail)
                .then(function (obj) {
                    obj.res.send({error: false})
                }, Error.send)
        }
    });

    app.get('/User/newPwd', guestOnly, function (req, res) {
        var required = ['email'];
        Checker.daddyCheck(required, null, req.query, res, req.currentUser)
            .then(Parser.daddyParse)
            .then(User.newPass)
            .then(function (obj) {
                obj.res.send({error: false})
            }, Error.send)
    });

    app.get('/User', userOnly, function (req, res) {
        var optional = ['pseudo'];
        Checker.daddyCheck([], optional, req.query, res, req.currentUser)
            .then(User.getByPseudo)
            .then(function (obj) {
                obj.res.send({error: false, content: obj.user})
            }, Error.send)
    });

    app.put('/User/updatePwd', userOnly, function (req, res) {
        var required = ['password'];
        if (req.currentUser.omniauth)
            Error.send({error: Error.giveError(20), res: res});
        else {
        Checker.daddyCheck(required, null, req.body, res, req.currentUser)
            .then(Parser.daddyParse)
            .then(User.updatePass)
            .then(function (obj) {
                obj.res.send({error: false})
            }, Error.send)
        }
    });

    app.post('/User/auth', guestOnly, function(req, res){
        Checker.omniauthCheck(req.body, res, req.currentUser)
            .then(Omniauth.dispatch)
            .then((data)=>{
                User.alreadyExist(data)
                    .then(User.updateFromAuth, User.newFromAuth)
                    .then((data) => {
                        data.res.send({privateToken: data.privateToken})
                    }, Error.send)
            }, Error.send)
    });
}
;