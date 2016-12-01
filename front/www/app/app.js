//SEUL ET UNIQUE VARIABLE CHANGER SI TU CHANGE d'HOST ! #RobinTuViensDeGagner3Secondes
const HOST = 'XXX.XXX';
//CEST PAS VRAI YA AUSSI CELLE DE LINDEX
//====================================================================================

var app = angular.module('hypertube', [
    'ngRoute',
    'ngCookies',
    'ngResource',
    'translationService',
    'checkService',
    'requestService',
    'socketService',
    'torrentService'
]);

app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://www.youtube.com/**',
        'http://' + HOST + ':5003/**',
        'http://' + HOST + ':4201/**',
        'https://googleads.g.doubleclick.net/pagead/id',
        'https//www.facebook.com/**',
        'https://apis.google.com/**'
    ]);
});

app.run(function($rootScope, $cookies, $resource, $location, translationService, socketService, userFactory){
    $rootScope.constants = new Array();

    $rootScope.constants['host'] = HOST;
    $rootScope.constants['hostApi'] = 'http://' + $rootScope.constants['host'] + ':4201/';
    $rootScope.constants['hostSocket'] = $rootScope.constants['host'] + ':4204';
    $rootScope.constants['urlStreaming'] = 'http://' + $rootScope.constants['host'] + ':5003?movie=';

    $rootScope.torrentInDownload = [];
    $rootScope.indexInDownload = [];

    $rootScope.privateToken = null;
    $rootScope.me = null;

    $rootScope.searchValue = '';
    $rootScope.notificationOpen = 0;

    socketService.connection();

    $rootScope.panelFilterOpen = function(){

    };

    $rootScope.nextPage = function(){

    };

    $rootScope.rootSearch = function(value){
        $location.path('/');
        $rootScope.search(value);
    };

    $rootScope.notificationToggle = function(){
        $rootScope.notificationOpen = 1;
    };

    $rootScope.changeLanguage = function(lang){
        translationService.changeLanguage(lang);
    };

    $rootScope.loadMe = function(){
        userFactory.me(function(res){
            $rootScope.me = res.data.content;
            $rootScope.pseudo = res.data.content.pseudo;
        }, function(err){
        });
    };

    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {

        //check auth
        if (nextRoute.access && nextRoute.access.rule == 'onlyMember') {
            var privateToken = $cookies.get('privateToken');
            if (privateToken && privateToken.length == 42) {
                $rootScope.privateToken = privateToken;
                if ($rootScope.me == null){
                    $rootScope.loadMe();
                }
            } else {
                $location.path(nextRoute.access.redirection);
            }
        }

        if (nextRoute.access && nextRoute.access.rule == 'onlyGuest') {
            var privateToken = $cookies.get('privateToken');
            if (privateToken)
                $location.path(nextRoute.access.redirection);
        }

        //check params
        if (nextRoute.params.emailToken !== undefined && nextRoute.params.emailToken.length != 42) {
            $location.path(nextRoute.access.redirection);
        }
    });

    translationService.getTranslation();
});

app.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    scope.fileread = changeEvent.target.files[0];
                });
            });
        }
    }
}]);

app.directive('errSrc', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
        }
    }
});

app.filter('timeFilter', function() {
    return function(date) {
        var tmp = Math.floor(date / 60) + ':';
        if ((date % 60) < 10)
            tmp = tmp + '0';
        tmp = tmp + (date % 60);
        return (tmp);
    }
});
