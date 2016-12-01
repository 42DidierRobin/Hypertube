/**
 * Created by Mathiisss on 26/10/2016.
 */

const subConverter = require('srt-to-vtt');
const Error = require('../server/error');
const YFsubs = require('yify-subs');
const AdmZip = require('adm-zip');
const mkdirp = require('mkdirp');
const http = require('http');
const url = require('url');
const fs = require('fs');

module.exports.clean = (data) => {
    return new Promise(function (fulfill, reject) {
        fs.unlink(data.fileName + '.srt');
        fs.rmdirSync(data.fileName);
        fulfill(data);
    })
};

module.exports.sendError = (data) => {
    data.res.sendFile('/subtitle/error/all.vtt');
};

module.exports.sendSubtitle = (data) => {
    data.res.sendFile(data.fileName + '.vtt');
};

module.exports.getListSubtitle = (data) => {
    return new Promise(function (fulfill, reject) {
        YFsubs.getSubs(data.args.imdbToken)
            .then(function (results) {
                data.about.subtitles = results.languages;
                fulfill(data);
            }, function (err) {
                reject({res: data.res, error: Error.formatError('Yify', err)});
            });
    });
};

module.exports.checkIfOwned = (data) => {
    return new Promise(function (fulfill, reject) {
        var dir = "/subtitle" + '/' + data.args.language;
        data.fileName = '/subtitle/' + data.args.language + '/' + data.args.imdbToken;
        if (fs.existsSync(dir)) {
            if (fs.existsSync(data.fileName + '.vtt'))
                fulfill(data);
            else
                reject(data);
        }
        else {
            mkdirp(dir, function (e) {
                if (e) {
                    //console.log('MKDIRP: error creating new directory for subtitle download');
                    //console.log(e);
                }
            });
            reject(data);
        }
    })
};

module.exports.getSubUrl = (data) => {
    return new Promise(function (fulfill, reject) {
        YFsubs.getSubs(data.args.imdbToken)
            .then(function (results) {
                if (results.subs[data.args.language] && results.subs[data.args.language][0]) {
                    data.subUrl = results.subs[data.args.language][0].url;
                    fulfill(data);
                } else {
                    reject({res: data.res, error: Error.giveError(19)})
                }
            }, function (err) {
                //console.log('No result from Yify API');
                reject({res: data.res});
            });
    });
};

module.exports.downloadSub = (data) => {
    return new Promise(function (fulfill, reject) {
        var file = fs.createWriteStream(data.fileName + '.zip');
        var options = {
            host: url.parse(data.subUrl).host,
            port: 80,
            path: url.parse(data.subUrl).pathname
        };
        http.get(options, function (res) {
            res.on('data', function (data) {
                file.write(data);
            }).on('end', function () {
                file.end();
                file.on('finish', function () {
                    fulfill(data)
                });
            }).on('error', function () {
                //console.log('ecriture du .zip failed');
                reject(data);
            })
        });
    });
};

module.exports.unzipSub = (data) => {
    return new Promise(function (fulfill, reject) {
        var zip = new AdmZip(data.fileName + '.zip');
        var zipEntries = zip.getEntries();
        for (i in zipEntries) {
            if ((/^.*(.srt)$/).test(zipEntries[i].entryName)) {
                zip.extractEntryTo(zipEntries[i].entryName, data.fileName, false, true);
                fs.unlink(data.fileName + '.zip');
                fs.rename(data.fileName + '/' + zipEntries[i].entryName, data.fileName + '.srt')
                fulfill(data);
                break;
            }
            if (!zipEntries[i + 1]) {
                //console.log('zip subtitle zip contains no srt file.');
                reject(data);
                break;
            }
        }
    })
};

module.exports.srtToVtt = (data) => {
    return new Promise(function (fulfill, reject) {
        fs.createReadStream(data.fileName + '.srt')
            .pipe(subConverter())
            .pipe(fs.createWriteStream(data.fileName + '.vtt')
                .on('finish', () => {
                    fulfill(data)
                }).on('error', () => {
                    reject(data)
                 }))
    })
};

