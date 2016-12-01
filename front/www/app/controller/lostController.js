angular
    .module('hypertube')
    .controller('lostController', lostController);

function lostController($scope, $rootScope, $location, $cookies, userFactory, checkService, socketService){
    $scope.email = '';
    $scope.done = false;

    $scope.lost = function(email){
        userFactory.lost(email, function(res){
            $scope.done = true;
        }, function(err){
            $scope.done = true;
        })
    };
}