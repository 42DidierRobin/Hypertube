/**
 * Created by rdidier on 10/3/16.
 */

var errorList = {
    0: "CHECK ERROR: List of required args incomplete.",
    1: "CHECK ERROR: args ? is not possible in this request.",
    2: "CHECK ERROR: value of ? is not valid.",
    3: "This pseudo is already taken.",
    4: "This email is already taken.",
    5: "No user exist with this pseudo.",
    6: "Invalid email token.",
    7: "Wrong password",
    8: "This email doesnt exist",
    9: "no user with this pseudo",
    10: "you already have seen this movie",
    11: "Error with search engine: ?",
    12: "Error from the movie db : ?",
    13: "email not verify",
    14: "no id for the movie",
    15: "this torrent doesnt exist",
    16: "this torrent is not playable yet (wait for download)",
    17: "This comment is not yours to modify",
    18: "This comment does not exist.",
    19: "No subtitle found with this argument",
    20: "You cannot update this information having an omniauth-linked account",
    21: "Not enough secure password, please choose an other one.",
    22: "authWay parameter is either missing or incorrect",
    23: "missing authWay corresponding arguments. Please check your request",
    24: "This account is an omniauth link account"
};

module.exports.giveError = (nbr, listArgs) => {

    var error = {};
    error.errno = nbr;
    error.content = errorList[nbr];
    for (var i in listArgs)
        error.content = error.content.replace('?', listArgs[i]);
    return error;
};

module.exports.formatError = (from, err) => {

    var error = {};
    error.errno = 666;
    error.content = "Error from external module or dependency. From: "+ from + " -> " + err;
    return error;
};

module.exports.send = (obj) => {
    obj.res.status(400).send({error: obj.error.errno, content: obj.error.content});
};