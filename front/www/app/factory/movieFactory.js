angular
    .module('hypertube')
    .factory('movieFactory', movieFactory);

function movieFactory($rootScope, requestService){
    var movieFactory = {};

    movieFactory.search = function(e, success, error){
        requestService.get('Movies/search', e, success, error);
    };

    movieFactory.about = function(e, success, error){
        requestService.get('Movies/about', e, success, error);
    };

    movieFactory.player = function(e, success, error){
        requestService.get('Movies/player', e, success, error);
    };

    return movieFactory;
}