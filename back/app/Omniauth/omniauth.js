/**
 * Created by rdidier on 11/21/16.
 */

const Error = require('../server/error');
const request = require('request');
const pickRequest = require('request').defaults({encoding: null});
const keys = require('./authKeys');
const User = require('../model/User');

fromUrlToBase64 = (data) => {
    return new Promise((fulfill) => {
        data.tempUser.base64 = undefined;
        if (data.tempUser.picUrl) {
            var r = pickRequest.get(data.tempUser.picUrl, function (error, response, body) {
                if (!error)
                    data.tempUser.base64 = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
            });
        }
        setTimeout(() => {
            if (!data.tempUser.base64) {
                if (r)
                    r.abort();
            }
            delete data.tempUser.picUrl;
            fulfill(data);
        }, 500);
    })
};

facebookRequest = (data) => {
    return new Promise((fulfill, reject) => {
        var args = keys.facebook;
        args.access_token = data.args.accessToken;
        request({
            url: 'https://graph.facebook.com/v2.8/' + data.args.clientId + '?',
            qs: args
        }, function (error, response, body) {
            if (error)
                reject({res: data.res, error: Error.formatError('facebook', error)});
            else {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    body = {};
                    reject({res: data.res, error: Error.formatError('facebook', 'no result')});
                }
                try {
                    data.tempUser = {};
                    data.tempUser.lastName = body.last_name;
                    data.tempUser.firstName = body.first_name;
                    data.tempUser.pseudo = (data.tempUser.lastName + data.tempUser.firstName).toLowerCase();
                    data.tempUser.facebookId = body.id;
                    data.tempUser.picUrl = body.picture.data.url;
                    data.tempUser.identify = {facebookId: body.id};
                    fromUrlToBase64(data)
                        .then(fulfill)
                }
                catch(e){
                    reject({res: data.res, error: Error.formatError('Facebook', 'data unreachable')})
                }
            }
        });
    })
};

ecole42Request = (data) => {
    return new Promise((fulfill, reject) => {
        args = keys.ecole42;
        args.code = data.args.ecole42Token;
        request.post({
            url: 'https://api.intra.42.fr/oauth/token',
            qs: args
        }, function (error, resp, body) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
                reject({res: data.res, error: Error.formatError('Ecole 42', 'no result')});
            }
            if (body.error)
                reject({res: data.res, error: Error.formatError('Ecole 42', body.error_description)});
            else {
                request({
                    url: 'https://api.intra.42.fr/v2/me',
                    qs: {access_token: body.access_token}
                }, function (er2, resp2, body2) {
                    try {
                        body2 = JSON.parse(body2);
                    } catch (e) {
                        body2 = {};
                        reject({res: data.res, error: Error.formatError('Ecole 42', 'no result')});
                    }
                    if (body2.error)
                        reject({res: data.res, error: Error.formatError('Ecole 42', body2.error_description)});
                    else {
                        try {
                            data.tempUser = {};
                            data.tempUser.lastName = body2.last_name;
                            data.tempUser.firstName = body2.first_name;
                            data.tempUser.pseudo = body2.login.toLowerCase();
                            data.tempUser.ecole42Id = body2.id;
                            data.tempUser.picUrl = body2.image_url;
                            data.tempUser.identify = {ecole42Id: body2.id};
                            fromUrlToBase64(data)
                                .then(fulfill)
                        }
                        catch(e){
                            reject({res: data.res, error: Error.formatError('Ecole 42', 'data unreachable')})
                        }
                    }
                })
            }
        })
    })
};

githubRequest = (data) => {
    return new Promise((fulfill, reject) => {
        var args = keys.github;
        args.code = data.args.githubToken;
        request.post({
            url: 'https://github.com/login/oauth/access_token',
            qs: args
        }, function (error, response, body) {
            var res = {};
            try {
                var tab = body.split('&');
                var temp;
                for (var i in tab) {
                    temp = tab[i].split('=');
                    res[temp[0]] = temp[1];
                }
            } catch (e) {
                reject({res: data.res, error: Error.formatError('Github', 'no result')});
            }
            if (res.error)
                reject({res: data.res, error: Error.formatError('Github', res.error_description)});
            else {
                request({
                    headers: {
                        'User-Agent': 'Mathiisss',
                        'Authorization': 'token ' + res.access_token
                    },
                    url: 'https://api.github.com/user'
                }, function (er2, resp2, body2) {
                    try {
                        body2 = JSON.parse(body2);
                    } catch (e) {
                        body2 = {};
                        reject({res: data.res, error: Error.formatError('Github', 'no result')});
                    }
                    if (body2.error)
                        reject({res: data.res, error: Error.formatError('Github', body2.error_description)});
                    else {
                        try {
                            data.tempUser = {};
                            data.tempUser.lastName = body2.name ? body2.name : 'GithubNoName';
                            data.tempUser.firstName = data.tempUser.lastName;
                            data.tempUser.pseudo = body2.login.toLowerCase();
                            data.tempUser.github42Id = body2.id;
                            data.tempUser.picUrl = body2.avatar_url;
                            data.tempUser.identify = {github42Id: body2.id};
                            fromUrlToBase64(data)
                                .then(fulfill)
                        }
                        catch(e){
                            reject({res: data.res, error: Error.formatError('Github', 'data unreachable')})
                        }
                    }
                })
            }
        });
    })
};

slackRequest = (data) => {
    return new Promise((fulfill, reject) => {
        var args = keys.slack;
        args.code = data.args.slackToken;
        request.post({
            url: 'https://slack.com/api/oauth.access',
            qs: args
        }, function (error, response, body) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
                reject({res: data.res, error: Error.formatError('Slack', 'no result')});
            }
            if (!body.ok)
                reject({res: data.res, error: Error.formatError('Slack', body.error)});
            else {
                request({
                    url: 'https://slack.com/api/users.identity?',
                    qs: {token: body.access_token}
                }, function (er2, resp2, body2) {
                    try {
                        body2 = JSON.parse(body2);
                    } catch (e) {
                        body2 = {};
                        reject({res: data.res, error: Error.formatError('Slack', 'no result')});
                    }
                    if (!body2.ok)
                        reject({res: data.res, error: Error.formatError('Slack', body2.error)});
                    else {
                        try{
                            data.tempUser = {};
                            data.tempUser.lastName = 'SlackNoName';
                            data.tempUser.firstName = 'SlackNoName';
                            data.tempUser.pseudo = body2.user.name.toLowerCase();
                            data.tempUser.slackId = body2.user.id;
                            data.tempUser.picUrl = body2.user.image_48;
                            data.tempUser.identify = {slackId: body2.user.id};
                            fromUrlToBase64(data)
                                .then(fulfill)
                        } catch(e){
                            reject({res: data.res, error: Error.formatError('Slack', 'data unreachable')});
                        }
                    }
                })
            }
        });
    })
};

linkedinRequest = (data) => {
    return new Promise((fulfill, reject) => {
        var args = keys.linkedin;
        args.code = data.args.linkedinToken;
        request.post({
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            url: 'https://www.linkedin.com/oauth/v2/accessToken',
            qs: args
        }, function (error, response, body) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
                reject({res: data.res, error: Error.formatError('Linkedin', 'no result')});
            }
            if (body.error)
                reject({res: data.res, error: Error.formatError('Linkedin', body.error_description)});
            else {
                request({
                    headers: {'Authorization': 'Bearer ' + body.access_token},
                    url: 'https://api.linkedin.com/v1/people/~:(id,firstName,LastName,picture-url)?format=json',
                }, function (er2, resp2, body2) {
                    try {
                        body2 = JSON.parse(body2);
                    } catch (e) {
                        body2 = {};
                        reject({res: data.res, error: Error.formatError('Linkedin', 'no result')});
                    }
                    if (body2.error)
                        reject({res: data.res, error: Error.formatError('Linkedin', body2.error_description)});
                    else {
                        try {

                            data.tempUser = {};
                            data.tempUser.lastName = body2.lastName;
                            data.tempUser.firstName = body2.firstName;
                            data.tempUser.pseudo = (data.tempUser.lastName + data.tempUser.firstName).toLowerCase();
                            data.tempUser.linkedinId = body2.id;
                            data.tempUser.picUrl = body2.pictureUrl;
                            data.tempUser.identify = {linkedinId: body2.id};
                            fromUrlToBase64(data)
                                .then(fulfill)
                        }catch(e) {
                            reject({res: data.res, error: Error.formatError('Linkedin', 'data unreachable')});
                    }
                    }
                })
            }
        });
    })
};

const match = {
    'Facebook': facebookRequest,
    'Ecole42': ecole42Request,
    'Github': githubRequest,
    'Slack': slackRequest,
    'Linkedin': linkedinRequest
};

module.exports.dispatch = (data) => {
    return match[data.args.authWay](data);
};

