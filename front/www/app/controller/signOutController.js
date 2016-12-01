angular
    .module('hypertube')
    .controller('signOutController', signOutController);

function signOutController($rootScope, $location, $cookies, socketService){
    $cookies.remove('privateToken');
    delete($rootScope.privateToken);
    $rootScope.privateToken = null;
    $rootScope.me = null;
    $rootScope.notificationOpen = false;
    $rootScope.indexInDownload = [];
    $rootScope.torrentInDownload = [];
    socketService.plop();
    $location.path('/sign');
}