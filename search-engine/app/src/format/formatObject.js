/**
 * Created by miku2s on 08/11/2016.
 */

module.exports.pushExtraT = function (data, list, cb)
{
    list = list.results;
    for (var i = 0 ; list[i]; i++)
    {
        var link        = list[i]["torrent_link"];
        var size        = list[i]["size"];
        var title       = list[i]["title"];
        var seeds       = list[i]["seeds"];
        var leech       = list[i]["leechers"];

        data.extra_torrent.push({
            "url"       : link,
            "size"      : size,
            "title"     : title,
            "seeds"     : seeds,
            "peers"     : leech
        });
    }
    cb(false, data);
};

module.exports.pushTorrentY = function(torrents, title)
{
    var data_torrent =
    {
        yts: [],
        extra_torrent: []
    };

    data_torrent.title = title;

    for(var i in torrents)
    {
        var url         =  torrents[i]["url"];
        var seeds       =  torrents[i]["seeds"];
        var peers       =  torrents[i]["peers"];
        var size        =  torrents[i]["size"];
        var tittle      =  title +  " - "  +torrents[i]["quality"];
        var quality     =  torrents[i]["quality"];
        var rating      =  torrents[i]["rating"];

        data_torrent.yts.push(
            {
                "url"   : url,
                "size"  : size,
                "title" : tittle,
                "seeds" : seeds,
                "peers" : peers

            });
    }
    return (data_torrent);
};

module.exports.pushInfoYts = function (data_movie , item)
{
    data_movie.movies.push
    ({
        "title"         : item.title,
        "imdb"          : item.imdb,
        "pictures"      : item.pictures,
        "rating"        : item.rating,
        "year"          : item.year,
        "genres"        : item.genres
    });
    return data_movie;
};

module.exports.formatMovieCollection = function (data_movie, json, j)
{
    var title        = json.data.movies[j]["title"];
    var imdb         = json.data.movies[j]['imdb_code'];
    var pic          = json.data.movies[j]["medium_cover_image"];
    var rating       = json.data.movies[j]["rating"];
    var year         = json.data.movies[j]["year"];
    var genres       = json.data.movies[j]["genres"];
    var torrent      = json.data.movies[j].torrents;
    data_movie =
    {
        "title"     : title,
        "imdb"      : imdb,
        "pictures"  : pic,
        "rating"    : rating,
        "year"      : year,
        "genres"    : genres,
        "torrent"   : torrent
    };
    return (data_movie);
};

module.exports.formatOption = function (json)
{
    var option          =
    {
        offset          : parseInt(json.offset),
        nbrResult       : parseInt(json.nbrResult),
        orderBy         : json.orderBy,
        sortBy          : json.sortBy,
        filterBy        : json.filterBy,
        minRate         : parseFloat(json.minimumRating),
        maxRate         : parseFloat(json.maximumRating),
        min_y           : parseInt(json.minimumYear),
        max_y           : parseInt(json.maximumYear),
        query           : json.query
    };
    return option;
};
