'use strict';

const fs            = require('fs');
const request       = require('request');
const http          = require('http');

module.exports = (req, res) => {

    //console.log(getParams(req));

    var params = getParams(req);

    if (params.movie == undefined) {
        //console.log('error');
        return;
    }

    fs.access(params.movie, fs.constants.R_OK, (err) => {
        if (err != null) {
            //console.log('error');
            return ;
        }
        var stat = fs.statSync(params.movie);
        var total = stat.size;
        var total2 = total;
        if (sizeTorrent[params.movie] != undefined)
            total = sizeTorrent[params.movie];

        //console.log(stat.size);
         if (req.headers['range']) {
             var range = req.headers.range;
             var parts = range.replace(/bytes=/, "").split("-");
             var partialstart = parts[0];
             var partialend = parts[1];

             var start = parseInt(partialstart, 10);
             var end = partialend ? parseInt(partialend, 10) : total-1;
             var chunksize = (end-start)+1;
            //console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
             if (start >= total2){
                 //console.log('euh2', start, total2, total);
                 res.writeHead(400);
                 res.end();
             } else if (start <= end) {
                 var file = fs.createReadStream(params.movie, {start: start, end: end, autoClose:true});
                 //console.log(start, end);
                 var stat = fs.statSync(params.movie);
                 var total = stat.size;

                 if (sizeTorrent[params.movie] != undefined)
                     total = sizeTorrent[params.movie];
                 res.writeHead(206, {
                     'transferMode.dlna.org': 'Streaming',
                     'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
                     'Expires' : '-1',
                     'Access-Control-Allow-Origin' : '*',
                     'Pragma' : 'no-cache',
                     'Content-Range': 'bytes ' + start + '-' + end + '/' + total ,
                     'Accept-Ranges': 'bytes',
                     'Content-Length': chunksize,
                     'Content-Type': 'video/x-matroska',
                     'Connection': 'keep-alive'
                 });
                 file.pipe(res);
             } else {
                 //console.log('euh');
                 res.writeHead(400);
                 res.end();
             }
         } else {
             //console.log('ALL: ' + total);
             res.writeHead(200, {
                 'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
                 'Expires' : '-1',
                 'Pragma' : 'no-cache',
                 'Access-Control-Allow-Origin' : '*',
                 'Content-Length': total,
                 'Content-Type': 'video/x-matroska'
             });
             fs.createReadStream(params.movie).pipe(res);
         }
    });
};

function getParams(req){
    let q=req.url.split('?'),result={};
    if(q.length>=2){
        q[1].split('&').forEach((item)=>{
            try {
                result[item.split('=')[0]]=item.split('=')[1];
            } catch (e) {
                result[item.split('=')[0]]='';
            }
        })
    }
    return result;
}