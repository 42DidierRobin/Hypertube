angular
    .module('torrentService', [])
    .service('torrentService', ['$rootScope', 'socketService', function($rootScope, socketService) {

        const torrentService = {};

        torrentService.add = function(url, imdb) {
            socketService.emit('torrentClick', {imdbToken:imdb, privateToken: $rootScope.privateToken, torrent: url});
            $rootScope.torrentInDownload[url] = {state: 'load'};
        };

        $rootScope.socket.on('addAccepted', function (data){
            $rootScope.torrentInDownload[data.url] = {};
            $rootScope.torrentInDownload[data.url].imdbToken = data.imdbToken;
            $rootScope.torrentInDownload[data.url].mainPicture = data.mainPicture;
            $rootScope.torrentInDownload[data.url].canPlay = false;
            $rootScope.torrentInDownload[data.url].title = data.title;
            $rootScope.torrentInDownload[data.url].state = 'loadAccepted';
            $rootScope.$apply();
        });

        $rootScope.socket.on('startDownload', function (data){
            if ($rootScope.torrentInDownload[data.url] == undefined)
                $rootScope.torrentInDownload[data.url] = {};
            $rootScope.torrentInDownload[data.url].state = 'onDownload';
            $rootScope.torrentInDownload[data.url].progress = 0;
            $rootScope.torrentInDownload[data.url].canPlay = false;
            $rootScope.$apply();
        });

        $rootScope.socket.on('onDownload', function (data){
            if ($rootScope.torrentInDownload[data.url] == undefined)
                $rootScope.torrentInDownload[data.url] = {};
            $rootScope.torrentInDownload[data.url].state = 'onDownload';
            $rootScope.torrentInDownload[data.url].progress = parseFloat(data.progress);
            $rootScope.$apply();
        });

        $rootScope.socket.on('endDownload', function (data){
            $rootScope.torrentInDownload[data.url].state = 'endDownload';
            $rootScope.torrentInDownload[data.url].id = data.id;
            $rootScope.torrentInDownload[data.url].progress = 100;
            $rootScope.$apply();
        });

        $rootScope.socket.on('canPlay', function (data){
            $rootScope.torrentInDownload[data.url].canPlay = true;
            $rootScope.torrentInDownload[data.url].id = data.id;
            $rootScope.$apply();
        });

        $rootScope.socket.on('addRefused', function (data){
            $rootScope.torrentInDownload[data.url].state = 'refuse';
            $rootScope.torrentInDownload[data.url].refuse = data.message;
            $rootScope.$apply();
        });

        $rootScope.socket.on('poulpe', function (data){
            //console.log('poulpe recu -> BRUT : ', data);
            for (torrent in data){
                $rootScope.torrentInDownload[data[torrent].url] = {};
                $rootScope.torrentInDownload[data[torrent].url].imdbToken = data[torrent].imdbToken;
                $rootScope.torrentInDownload[data[torrent].url].mainPicture = data[torrent].mainPicture;
                $rootScope.torrentInDownload[data[torrent].url].canPlay = data[torrent].playable;
                $rootScope.torrentInDownload[data[torrent].url].title = data[torrent].title;
                $rootScope.torrentInDownload[data[torrent].url].id = data[torrent].torrentId;
                $rootScope.torrentInDownload[data[torrent].url].state = 'loadAccepted';
            }
            //console.log('poulpe recu -> TRAITEMENT : ', $rootScope.torrentInDownload);
        });

        $rootScope.getIndex = function(){
            var index = [];
            for (var i in $rootScope.torrentInDownload) {
                index.push(i);
            }
            return index;
        };

        return torrentService;
}]);

//imdbToken, privateToken, torrent(url)

//si deja download -> endDownload
//si en cours de downlaod ->


//torrentClick -> addAccepted(url)
//             -> addRefuse(url)
//             -> startDownload(url)
//             -> onDownload(url)
//             -> endDownload(url)
//             -> canPlay(url)