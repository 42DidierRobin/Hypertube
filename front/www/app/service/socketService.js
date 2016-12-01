angular
    .module('socketService', [])
    .service('socketService', ['$rootScope', function($rootScope) {

        const socketService = {};

        socketService.connection = function(){
            $rootScope.socket = io.connect($rootScope.constants['hostSocket']);
            $rootScope.socket.connect($rootScope.constants['hostSocket'], { autoConnect: true});

            $rootScope.socket.on('connect', function () {
                socketService.plop();
            });
        };

        socketService.plop = function(){
            if ($rootScope.privateToken)
                socketService.emit('plop', {privateToken: $rootScope.privateToken});
            else
                socketService.emit('plop');
        };

        socketService.emit = function(event, data){
            $rootScope.socket.emit(event, data)
        };

        return socketService ;
}]);