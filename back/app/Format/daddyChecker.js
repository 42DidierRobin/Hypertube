/**
 * Created by rdidier on 10/3/16.
 * Fichier pour gerer lensemble des check de donnes envoye a lapi
 */

const Error = require('../server/error.js');
const bigTab = require('./IllegalWords.json');

const argsCheckList = {
    "pseudo": {
        fct: checkString,
        option: {
            size: {
                min: 4,
                max: 42
            },
            char: {
                all: false,
                alpha: true,
                alphaM: true,
                num: true,
                more: ['_', '@', '-', ' ']
            }
        }
    },
    "password": {
        fct: checkPassword,
        option: {
            size: {
                min: 8,
                max: 42
            }
        }
    },
    "pass": {
        fct: none
    },
    "email": {
        fct: checkReg,
        option: {
            reg: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
        }
    },
    "emailToken": {
        fct: checkString,
        option: {
            size: {
                min: 42,
                max: 42
            },
            char: {
                all: false,
                alpha: true,
                alphaM: false,
                num: true,
            }
        }
    },
    "firstName": {
        fct: checkString,
        option: {
            size: {
                min: 2,
                max: 21
            },
            char: {
                all: false,
                alpha: true,
                alphaM: true,
                num: false,
                more: [' ']
            }
        }
    },
    "lastName": {
        fct: checkString,
        option: {
            size: {
                min: 2,
                max: 21
            },
            char: {
                all: false,
                alpha: true,
                alphaM: true,
                num: false,
                more: [' ']
            }
        }
    },
    "lang": {
        fct: isInList,
        option: {
            list: ['en', 'fr']
        }
    },
    "privateToken": {
        fct: checkString,
        option: {
            size: {
                min: 42,
                max: 42
            },
            char: {
                all: false,
                alpha: true,
                alphaM: false,
                num: true
            }
        }
    },
    "query": {
        fct: checkString,
        option: {
            size: {
                min: 0,
                max: 42
            },
            char: {
                all: false,
                alpha: true,
                alphaM: true,
                num: true,
                more: [' ']
            }
        }
    },
    "offset": {
        fct: checkNbr,
        option: {
            min: -1,
            int: true
        }
    },
    "nbrResult": {
        fct: checkNbr,
        option: {
            min: 10,
            max: 50,
            int: true
        }
    },
    "minimumRating": {
        fct: checkNbr,
        option: {
            min: 0,
            max: 10
        }
    },
    "maximumRating": {
        fct: checkNbr,
        option: {
            min: 0,
            max: 10
        }
    },
    "minimumYear": {
        fct: checkNbr,
        option: {
            min: 1800,
            max: 2020,
            int: true
        }
    },
    "maximumYear": {
        fct: checkNbr,
        option: {
            min: 1800,
            max: 2020,
            int: true
        }
    },
    "orderBy": {
        fct: isInList,
        option: {
            list: ['desc', 'asc']
        }
    },
    "sortBy": {
        fct: isInList,
        option: {
            list: ['', 'peer', 'title', 'rating', 'year']
        }
    },
    "filterBy": {
        fct: isInList,
        option: {
            list: ['', 'Action', 'Animation', 'Comedy', 'Documentary',
                'Family', 'Film-Noir', 'Horror', 'Musical', 'Romance',
                'Sport', 'War', 'Adventure', 'Biography', 'Crime',
                'Drama', 'Fantasy', 'History', 'Music', 'Mystery',
                'Sci-Fi', 'Thriller', 'Western']
        }
    },
    "imdbToken": {
        fct: checkReg,
        option: {
            reg: /^tt[0-9]{7}$/
        }
    },
    "rating": {
        fct: checkNbr,
        option: {
            min: 0,
            max: 10,
            int: false

        },
    },
    "idActor": {
        fct: checkNbr,
        option: {
            min: 0,
            int: true
        },
    },
    "movieDbId": {
        fct: checkNbr,
        option: {
            min: 0,
            int: true
        },
    },
    "base64": {
        fct: checkImg,
        option: {
            reg: /^(data:image\/)(png){0,1}(jpg){0,1}(jpeg){0,1}(;base64,){1}.*$/,
            //the size is in KB
            size: {
                min: 2,
                max: 1000
            }
        }
    },
    "torrent": {
        fct: checkReg,
        option: {
            reg: /^((https:\/\/yts\.ag\/torrent\/download\/)|(https:\/\/extratorrent\.cc\/download\/)).*$/
        }
    },
    "torrentId": {
        fct: checkString,
        option: {
            size: {
                min: 24,
                max: 24
            },
            char: {
                all: false,
                alpha: true,
                alphaM: false,
                num: true
            }
        }
    },
    "commentText": {
        fct: checkString,
        option: {
            size: {
                min: 1,
                max: 4242
            },
            char: {
                all: true
            }
        }
    },
    "time": {
        fct: checkNbr,
        option: {
            min: 0,
            max: 36000,
            int: true
        }
    },
    "commentId": {
        fct: checkString,
        option: {
            size: {
                min: 24,
                max: 24
            },
            char: {
                all: false,
                alpha: true,
                alphaM: false,
                num: true
            }
        }
    },
    "language": {
        fct: checkString,
        option: {
            size: {
                min: 2,
                max: 5
            },
            char: {
                all: false,
                alpha: true,
                alphaM: false,
                num: false,
                more: ['-', '_']
            }
        }
    },
    'data': {
        fct: none
    },
    "authWay": {
        'Facebook': ['accessToken', 'clientId'],
        'Ecole42': ['ecole42Token'],
        'Github': ['githubToken'],
        'Slack': ['slackToken'],
        'Linkedin': ['linkedinToken']
    }
};

function checkPassword(it, option) {
    var reg;
    if (it.length >= option.size.min
        && it.length <= option.size.max
        && /[0-9]/.test(it)
        && /[A-Z]/.test(it)) {
        for (var i in bigTab) {
            reg = new RegExp(bigTab[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
            if (reg.test(it))
                return false;
        }
        return (true);
    }
    else
        return false
}

function checkImg(it, option) {
    if (!(option.reg.test(it)))
        return false;
    else {
        var kbsize = (it.length * 3 / 4) / 1000;
        return (kbsize > option.size.min && kbsize < option.size.max)
    }
}

function none(it) {
    return it;
}

function checkNbr(it, option) {
    it = parseInt(it);
    return ((typeof(it) == "number")
    && (option.int ? ((it % 1) ? false : true) : true)
    && (it > option.min || it < option.max));
}

function isInList(it, option) {
    for (var i in option.list) {
        if (option.list[i] == it)
            return true;
    }
    return false;
}

function checkReg(it, option) {
    return option.reg.test(it);
}

function checkString(it, option) {

    const alpha = 'a-z';
    const alphaM = 'A-Z';
    const num = '0-9';
    var listOk = '';
    var regStr = '';
    if (!option.char || option.char.all) {
        regStr = '.';
    }
    else {
        listOk += option.char.alpha ? alpha : '';
        listOk += option.char.alphaM ? alphaM : '';
        listOk += option.char.num ? num : '';
        for (var i in option.char.more) {
            if (['^', '-', ']', '\''].indexOf(option.char.more[i]) != -1)
                listOk += '\\' + option.char.more[i];
            else
                listOk += option.char.more[i];
        }
        regStr = '[' + listOk + ']';
    }
    var reg = new RegExp('^' + regStr + '{' + option.size.min + ',' + option.size.max + '}$');
    if (option.char && option.char.less) {
        var listKO = '';
        for (var j in option.char.less) {
            if (['^', '-', ']', '\''].indexOf(option.char.less[j]) != -1)
                listKO += '\\' + option.char.less[j];
            else
                listKO += option.char.less[j];
        }
        var reg2 = new RegExp('^[^' + listKO + ']*$');
        return (reg2.test(it) && reg.test(it));
    }
    else
        return (reg.test(it));
}

module.exports.daddyCheck = (required, optional, args, res, user) => {

    return new Promise(function (fulfill, reject) {
        optional = required.concat(optional);
        //On verifi quil y a AU MOINS les argument attendu
        for (var i in required) {
            if (typeof args[required[i]] == 'undefined') {
                reject({
                    error: Error.giveError(0),
                    res: res
                });
            }
        }
        //On verifi que les arguments supplementaire sont toleres ici
        for (var j in args) {
            if (optional.indexOf(j) == -1) {
                reject({
                    error: Error.giveError(1, [j]),
                    res: res
                });
            } else {
                //On verifi si le contenu des arguments est valid
                if (!(argsCheckList[j].fct)(args[j], argsCheckList[j].option)) {
                    if (j == 'password')
                        reject({
                            error: Error.giveError(21),
                            res: res
                        });
                    else {
                        reject({
                            error: Error.giveError(2, [j]),
                            res: res
                        });
                    }
                }
            }
        }
        var obj = {};
        obj.args = args;
        obj.currentUser = user;
        obj.res = res;
        fulfill(obj);
    })
};

module.exports.socketCheck = (required, args, carryOn) => {

    return new Promise(function (fulfill, reject) {
        //On verifi quil y a les arguments attendus
        for (var i in required) {
            if (typeof args[required[i]] == 'undefined') {
                reject({error: Error.giveError(0).content, socketId: carryOn});
            }
        }
        for (var j in args) {
            //On verifi si le contenu des arguments est valid
            if (!(argsCheckList[j].fct)(args[j], argsCheckList[j].option)) {
                reject({error: Error.giveError(2, [j]).content, socketId: carryOn, url: args.torrent});
            }
        }
        fulfill({sent: args, socketId: carryOn});
    })
};

module.exports.omniauthCheck = (args, res, user) => {

    return new Promise(function (fulfill, reject) {
        if (args.authWay && argsCheckList['authWay'][args.authWay]) {
            var required = argsCheckList['authWay'][args.authWay];
            for (var i in required)
                if (!args[required[i]])
                    reject({
                        error: Error.giveError(23),
                        res: res
                    });
            var obj = {};
            obj.args = args;
            obj.currentUser = user;
            obj.res = res;
            fulfill(obj);
        }
        else
        {
            reject({
                error: Error.giveError(22),
                res: res
            });
        }
    })
};

