/**
 * Created by rdidier on 10/3/16.
 */

const Generator = require('../tools/generator.js');
const Error = require('../server/error.js');
const Mail = require('../server/mail');
const request = require('request');

function giveMongoError(err, res) {
    return ({
        error: Error.formatError("Mongo", err),
        res: res
    });
}

module.exports.newUser = (data) => {
    return new Promise(function (fulfill, reject) {
        data.args.mailReplace = {};
        data.args.mailReplace.content = 'http://' + host + '/sign/' + data.args.emailToken;
        data.args.mailReplace.link = 'confirm account';
        Mail.sendMail("newUser", data, function (err) {
            if (err) {
                reject({
                    error: Error.formatError("NodeMailer", err),
                    res: data.res
                });
            }
            else {
                data.args.seenList = [];
                delete data.args.mailReplace;
                mongodb.collection('users').insertOne(data.args, function (err) {
                    if (err)
                        reject(giveMongoError(err, data.res));
                    else {
                        fulfill(data);
                    }
                });
            }
        });
    })
};

module.exports.connect = (data) => {
    return new Promise(function (fulfill, reject) {

        mongodb.collection('users').findOne({pseudo: data.args.pseudo.toLowerCase()}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res) {
                    data.result = res.privateToken;
                    var hash = Generator.hashIt(data.args.pass, res.password.salt);
                    if (hash == res.password.password)
                        fulfill(data);
                    else
                        reject({error: Error.giveError(7), res: data.res});
                } else
                    reject({error: Error.giveError(5), res: data.res});
            }
        });
    })

};

module.exports.mailExist = (data) => {

    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').findOne({email: data.args.email}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res)
                    reject({error: Error.giveError(4), res: data.res});
                else
                    fulfill(data);
            }
        });
    })
};

module.exports.pseudoExist = (data) => {

    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').findOne({pseudo: data.args.pseudo.toLowerCase()}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res)
                    reject({error: Error.giveError(3), res: data.res});
                else
                    fulfill(data);
            }
        });
    })
};

module.exports.checkEmailVerifyAndOmniauth = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').findOne({pseudo: data.args.pseudo.toLowerCase()}, function (err, res) {
            if (err) {
                reject(giveMongoError(err, data.res));
            } else {
                if (res && res.emailToken) {
                    reject({error: Error.giveError(13), res: data.res});
                } else if (res && res.omniauth)
                    reject({error: Error.giveError(24), res: data.res});
                else
                    fulfill(data);
            }
        });
    })
};

module.exports.checkEmailToken = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').findOne({emailToken: data.args.emailToken}, function (err, res) {
            if (err) {
                reject(giveMongoError(err, data.res));
            } else {
                if (res) {
                    fulfill(data);
                } else
                    reject({error: Error.giveError(6), res: data.res});
            }
        });
    })
};

module.exports.deleteEmailToken = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').update({emailToken: data.args.emailToken},
            {$set: {emailToken: undefined}}, function (err, res) {
                if (err)
                    reject(giveMongoError(err, data.res));
                else {
                    if (res.result.nModified == 1) {
                        fulfill(data)
                    } else
                        reject(giveMongoError("cant updata after finding :" + res, data.res));
                }
            });
    })
};

module.exports.update = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').update({_id: data.currentUser._id}, {$set: data.args}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                delete data.currentUser;
                fulfill(data)
            }
        });
    })
};

createPrivateToken = (data) => {
    return new Promise(function (fulfill, reject) {
        var privateToken = Generator.rdmString(42);
        mongodb.collection('users').findOne({privateToken: privateToken}, function (err, res) {
            if (err) {
                reject(giveMongoError(err, data.res));
            } else {
                if (res) {
                    this.createPrivateToken(data);
                } else {
                    data.args.privateToken = privateToken;
                    fulfill(data);
                }
            }
        });
    })
};
module.exports.createPrivateToken = createPrivateToken;

module.exports.createEmailToken = (data) => {
    return new Promise(function (fulfill, reject) {
        var emailToken = Generator.rdmString(42);
        mongodb.collection('users').findOne({emailToken: emailToken}, function (err, res) {
            if (err) {
                reject(giveMongoError(err, data.res));
            } else {
                if (res) {
                    this.createEmailToken(data);
                } else {
                    data.args.emailToken = emailToken;
                    fulfill(data);
                }
            }
        });
    })
};

module.exports.updateEmail = (data) => {
    return new Promise(function (fulfill, reject) {
        data.args.mailReplace = {};
        data.args.mailReplace.content = 'http://' + host + '/email/' + data.args.emailToken;
        data.args.mailReplace.link = 'Confirm mail';
        Mail.sendMail("newMail", data, function (err) {
            if (err) {
                reject({
                    error: Error.formatError("NodeMailer", err),
                    res: data.res
                });
            }
            else {
                mongodb.collection('users').update({_id: data.currentUser._id}, {$set: data.args}, function (err, res) {
                    if (err)
                        reject(giveMongoError(err, data.res));
                    else {
                        if (res.result.nModified == 1) {
                            delete data.currentUser;
                            fulfill(data)
                        } else
                            reject(giveMongoError("cant update after finding :" + res, data.res));
                    }
                });
            }
        });
    })
};

module.exports.updatePass = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').update({_id: data.currentUser._id}, {$set: {password: data.args.password}}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res.result.nModified == 1) {
                    delete data.currentUser;
                    fulfill(data)
                } else
                    reject(giveMongoError("cant update after finding :" + res, data.res));
            }
        });
    })
};

module.exports.newPass = (data) => {
    return new Promise(function (fulfill, reject) {
        var newPass = Generator.rdmString(12);
        var password = {};
        password.salt = Generator.rdmString(21);
        password.password = Generator.hashIt(newPass, password.salt);
        mongodb.collection('users').findOne({email: data.args.email}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                if (res) {
                    data.currentUser = res;
                    data.args.mailReplace = {};
                    data.args.mailReplace.content = newPass;
                    Mail.sendMail("newPass", data, function (err) {
                        if (err) {
                            reject({
                                error: Error.formatError("NodeMailer", err),
                                res: data.res
                            });
                        } else {
                            delete data.args.mailReplace;
                            mongodb.collection('users').update({_id: data.currentUser._id}, {$set: {password: password}},
                                function (err, res2) {
                                    if (err)
                                        reject(giveMongoError(err, data.res));
                                    else {
                                        if (res2.result.nModified == 1) {
                                            delete data.currentUser;
                                            fulfill(data)
                                        } else
                                            reject(giveMongoError("cant update after finding :" + res, data.res));
                                    }
                                });
                        }
                    });
                } else
                    reject({error: Error.giveError(8), res: data.res});
            }
        });
    })
};

module.exports.getByPseudo = (data) => {
    return new Promise(function (fulfill, reject) {
        if (!data.args.pseudo) {
            delete data.currentUser.emailToken;
            delete data.currentUser.password;
            delete data.currentUser._id;
            data.user = data.currentUser;
            fulfill(data);
        }
        else {
            mongodb.collection('users').findOne({pseudo: data.args.pseudo}, function (err, res) {
                if (err)
                    reject(giveMongoError(err, data.res));
                else {
                    if (res) {
                        delete res.email;
                        delete res.privateToken;
                        delete res.password;
                        delete res._id;
                        delete res.emailToken;
                        data.user = res;
                        fulfill(data);
                    } else
                        reject({error: Error.giveError(9), res: data.res});
                }
            });
        }
    })
};

module.exports.addSeenMovie = (data) => {
    return new Promise(function (fulfill, reject) {
        mongodb.collection('users').update({_id: data.currentUser._id},
            {
                $addToSet: {
                    seenList: {
                        imdbToken: data.args.imdbToken,
                        title: data.about.original_title,
                        mainPicture: data.about.mainPicture
                    }
                }
            },
            function (err, res) {
                if (err)
                    reject(giveMongoError(err, data.res));
                else {
                    delete data.res._id;
                    fulfill(data);
                }
            });
    })
};

module.exports.alreadyExist = (data) => {
    return new Promise((fulfill, reject) => {
        mongodb.collection('users').findOne(data.tempUser.identify, function (err, res) {
            if (res) {
                data.privateToken = res.privateToken;
                fulfill(data);
            } else
                reject(data);

        });
    })
};

module.exports.updateFromAuth = (data) => {
    return new Promise(function (fulfill, reject) {
        var set = {};
        set.lastName = data.tempUser.lastName;
        set.firstName = data.tempUser.firstName;
        if (data.tempUser.base64)
            set.base64 = data.tempUser.base64;
        mongodb.collection('users').update(data.tempUser.identify, {$set: set}, function (err, res) {
            if (err)
                reject(giveMongoError(err, data.res));
            else {
                delete data.tempUser;
                fulfill(data)
            }
        });
    })
};

generateAuthPseudo = (data) => {
    return new Promise(function (fulfill, reject) {
            mongodb.collection('users').findOne({pseudo: data.tempUser.pseudo}, function (err, res) {
                if (err) {
                    reject(giveMongoError(err, data.res));
                }
                else {
                    if (res) {
                        data.tempUser.pseudo = data.tempUser.pseudo + Math.floor(Math.random() * 10);
                        generateAuthPseudo(data).then(fulfill, reject);
                    } else {
                        fulfill(data);
                    }
                }
            });
        }
    )
};

module.exports.newFromAuth = (data) => {
    return new Promise((fulfill, reject) => {
        createPrivateToken(data)
            .then(generateAuthPseudo)
            .then((data)=> {
                return new Promise((fulfill, reject)=> {
                    delete data.tempUser.identify;
                    data.tempUser.seenList = [];
                    data.tempUser.omniauth = true;
                    data.tempUser.lang = 'en';
                    data.tempUser.privateToken = data.args.privateToken;
                    data.privateToken = data.args.privateToken;
                    mongodb.collection('users').insertOne(data.tempUser, function (err) {
                        if (err)
                            reject(giveMongoError(err, data.res));
                        else {
                            delete data.tempUser;
                            fulfill(data);
                        }
                    });
                })
            })
            .then(fulfill, reject)
    })
};

module.exports.getSeenList = (data) => {
    return new Promise((fulfill, reject) => {
        mongodb.collection('users').findOne({pseudo: data.currentUser.pseudo}, function (err, res) {
            if (res) {
                data.seenList = res.seenList;
                fulfill(data);
            } else
                reject({
                    error: Error.giveError(9),
                    res: data.res
                });
        });
    })
};



