angular
    .module('hypertube')
    .controller('signController', signController);

function signController($scope, $rootScope, $location, $cookies, userFactory, checkService, socketService, $routeParams){

    $scope.user = {
        signUp : {
            email: '',
            pseudo: '',
            firstName: '',
            lastName: '',
            password: '',
            picture: ''
        },
        signIn : {
            pseudo: '',
            password: ''
        }
    };

    $scope.signIn = function (user) {
        userFactory.signIn(user, function(res){
            $scope.signInError = false;

            //creation du cookie
            $rootScope.privateToken = res;
            $cookies.put('privateToken', res);
            userFactory.me(function(res){
                $rootScope.me = res.data.content;
                socketService.plop();
                $location.path('/');
            }, function(err){

            });
        }, function (err){
            $scope.signInError = 1;
            if (err.data && err.data.error == 13)
                $scope.signInError = 2;
        })
    };

    $scope.facebook = function(token, userId) {
        $rootScope.loading = true;
        userFactory.facebook(token, userId, function(res){
            $rootScope.privateToken = res.data.privateToken;
            $cookies.put('privateToken', res.data.privateToken);
            userFactory.me(function(res){
                $rootScope.me = res.data.content;
                socketService.plop();
                $location.path('/');
            }, function(err){
            });
        }, function(err){
            console.log(err);
        });
    };

    $scope.signUp = function (user) {

        $scope.SignUpError = checkService.check(user);
        $scope.SignUpSuccess = null;

        if ($scope.SignUpError) {
            return ;
        }

        var reader = new FileReader();

        reader.readAsDataURL(user.picture, "UTF-8");

        reader.onload = function (r) {

            user.base64 = r.target.result;

            userFactory.signUp({email:user.email, pseudo: user.pseudo, firstName:user.firstName, lastName: user.lastName, password : user.password, base64 : user.base64}, function(res){
                $scope.SignUpSuccess = {pseudo: user.pseudo};
            }, function (err){
                $scope.SignUpError = err;
                if (err.data.error == 21)
                    $scope.SignUpError.password = {'secure' : true};
            })
        };
    };


    auth = (param) => {
        $rootScope.loading = true;
        userFactory.auth(param.from, param.code, function(res){
            $rootScope.privateToken = res.data.privateToken;
            $cookies.put('privateToken', res.data.privateToken);
            userFactory.me(function(res){
                $rootScope.me = res.data.content;
                socketService.plop();
                $location.url('/');
            }, function(err){
                $rootScope.loading = false;
                $location.url('/');
            });
        }, function(err){
            $location.url('/');
            $rootScope.loading = false;
        });
    };

    if ($routeParams.from != undefined && $routeParams.code != undefined){
        auth($routeParams);
        $rootScope.loading = true;
    }
}