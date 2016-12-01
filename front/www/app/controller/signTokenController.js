angular
    .module('hypertube')
    .controller('signTokenController', signTokenController);

function signTokenController($scope, $rootScope, userFactory, $routeParams){

    $scope.verify = false;

    userFactory.confirmMail($routeParams.emailToken, function(res) {
        $scope.verify = true;
    }, function(err){
        $scope.verify = true;
    })
}