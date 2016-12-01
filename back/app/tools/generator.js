/**
 * Created by rdidier on 10/4/16.
 */

var crypto = require('crypto');

module.exports.rdmString = (size) => {

    return crypto.randomBytes(Math.ceil(size/2))
        .toString('hex')
        .slice(0, size);
};

module.exports.rdmNbr = (size) => {

    var res = '';
    while (size-- > 0)
        res += Math.floor(Math.random() * 10);
    return res;
};

module.exports.hashIt = (pass, salt) => {
    var hash = crypto.createHmac('sha512', salt);
    /** Hashing algorithm sha512 */
    hash.update(pass);
    return hash.digest('hex');
};