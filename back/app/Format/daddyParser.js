/**
 * Created by rdidier on 10/3/16.
 * Ici on parsera/rangera/formatera les donnees
 * format des noms Majsucule + reste en miniscule / hashage du password / stringifiation du commentaire etc.
 */

const Generator = require('../tools/generator');
const xss = require('xss');
const ObjectId = require('mongodb').ObjectID;

var argsParseList = {
    "pseudo": {
        fct: stringClean
    },
    "password": {
        fct: hashPassword
    },
    "email": {
        fct: none
    },
    "emailToken": {
        fct: none
    },
    "firstName": {
        fct: firstMajRestLow
    },
    "lastName": {
        fct: toMaj
    },
    "lang": {
        fct: none
    },
    "base64": {
        fct: base64Reg
    },
    "time": {
        fct: none
    },
    "imdbToken": {
        fct: none
    },
    "commentText": {
        fct: stringClean
    },
    "commentId": {
        fct: mongoId
    }
};

function base64Reg (it) {
    return it.replace(/ /g,'+');
}

function mongoId (it){
    return ObjectId(it);
}

function firstMajRestLow(str) {
    return str[0].toUpperCase() + (str.substring(1, str.length)).toLowerCase();
}

function toMaj(str) {
    return str.toUpperCase();
}

function hashPassword(pass) {
    var password = {};
    password.salt = Generator.rdmString(21);
    password.password = Generator.hashIt(pass, password.salt);
    return password;
}

function stringClean(string) {
    return xss(string.toLowerCase());
}

function none(thing) {
    return thing;
}

module.exports.daddyParse = (data) => {

    return new Promise(function (fulfill) {
        for (var i in data.args) {
            data.args[i] = (argsParseList[i]).fct(data.args[i]);
        }
        fulfill(data);
    })
};