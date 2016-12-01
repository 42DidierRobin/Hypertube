/**
 * Created by vbraeke on 11/6/16.
 */


module.exports.parse_rating = function (data, option , off, cb)
{
    var count  = 0;

    for (var i = off; i < data.length; i++)
    {
        if (parseFloat(data[i]["rating"]) < parseInt(option.minRate) || parseFloat(data[i]["rating"]) > parseInt(option.maxRate))
        {
            data.splice(i, 1);
            i--;
            count++;

        }
    }

    cb(data, count);
};

module.exports.sortSeeds = function (data, cb ) {
    console.log("enter")
    for (var i = 0 ; i < data.results.length; i++)
        data.results[i]["seeds"] = parseInt(data.results[i]["seeds"])
    i--
    for (i ; i > 0; i--)
    {

        if (i - 1 == 0) {
            cb(data)
        }
        else
        {

            if (data.results[i]["seeds"] > data.results[i - 1]["seeds"]) {
                var tmp = data.results[i];
                data.results[i] = data.results[i - 1];
                data.results[i - 1] = tmp;
            }
        }


    }

};

module.exports.parseSeeds = function (data, cb)
{
    for (var i = 0; i < data.length ; i++)
    {

        if (parseInt(data[i]["seeds"]) < 50)
            data.slice(i, 1);
    }
    cb(data);
};

module.exports.parseBytes = function (data, cb) {
    for (var i = 0; i < data.length ; i++)
    {
        if ((parseFloat(data[i]["size"]) / 1000000) < 500 || (parseFloat(data[i]["size"]) / 1000000) > 5000)
        {
            data.splice(i, 1);
            i--;
        }
        else
        {
            data[i]["size"] = (parseFloat(data[i]["size"]) / 1000000);
            data[i]["size"] = Math.floor(data[i]["size"]);
            if (data[i]["size"] < 1000)
                data[i]["size"] = data[i]["size"] + " MB";
            else
            {
                data[i]["size"] = data[i]["size"] / 1000;
                data[i]["size"] = data[i]["size"] + " GB";
            }
        }
    }
    cb(data);
};

module.exports.parse_min = function(data, options, offset, cb)
{
    var count  = 0;
    for (var i = offset; i < data.length; i++)
    {
        if (parseInt(data[i]["year"]) < parseInt(options.min_y) || parseInt(data[i]["year"]) > parseInt(options.max_y))
        {
            data.splice(i , 1);
            i--;
            count++;
        }

    }
    cb(data, count);
};

module.exports.matchExtra = function (list , url,  cb)
{
    var c = 0;
    url = url.replace(/https/, "http");
    url = url.replace(/ /g, '+');
    for (var i = 0; i < list.length; i++)
    {
        if (url === decodeURI(list[i]["torrent"]))
            c = 1;
    }
    if (c == 1)
        cb(1);
    else
        cb(0);
};