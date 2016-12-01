angular
    .module('hypertube')
    .controller('emailTokenController', emailTokenController);

function emailTokenController($scope, $rootScope, userFactory, $routeParams){

    $scope.verify = false;

    userFactory.confirmMail($routeParams.emailToken, function(res) {
        $scope.verify = true;
    }, function(err){
        $scope.verify = true;
    })
}