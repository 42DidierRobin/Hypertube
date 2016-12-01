angular
    .module('hypertube')
    .controller('profilController', profilController);

function profilController($scope, $rootScope, $location, $cookies, userFactory, checkService, $routeParams){
    $scope.pseudo = $routeParams.pseudo;
    $scope.type = null;

    if ($scope.pseudo == undefined) {
        //me
        $scope.type = 'me';
    } else {
        //another
        userFactory.user($scope.pseudo, function(res) {
            $scope.type = 'user';
            $scope.user = res.data.content;
        }, function(err){
            $location.path('/profil');
        });
    }

    $scope.changeEmail = function(newEmail) {
        $scope.emailSuccess = false;
        $scope.emailError = checkService.check(newEmail);

        if ($scope.emailError) {
            return ;
        }

        userFactory.checkEmail(newEmail, function(res){
            userFactory.newEmail(newEmail, function(res){
                $scope.emailSuccess = true;
            }, function(err){
                $scope.emailError = err;
            });
        }, function(err){
            $scope.emailError = [];
            $scope.emailError['exist'] = true;
        });
    };

    $scope.changePassword = function(newPassword){
        $scope.passwordError = null;
        $scope.passwordSuccess = false;

        if (newPassword == undefined) {
            $scope.passwordError = true;
            return ;
        }

        $scope.passwordError = checkService.check({password:newPassword});

        if ($scope.passwordError) {
            return ;
        }

        userFactory.updatePwd(newPassword, function(res){
            $scope.passwordSuccess = true;
        }, function(err){
            $scope.passwordError = err;
        });
    };

    $scope.changeInfo = function(firstname, lastname){
        $scope.infoSuccess = false;
        $scope.infoError = checkService.check({lastName:lastname, firstName:firstname});

        if ($scope.infoError) {
            return ;
        }

        userFactory.update({firstName:firstname, lastName:lastname}, function(res){
            $scope.infoSuccess = true;
        }, function(err){
        });
    };

    $scope.changePicture = function(picture) {

        $scope.pictureError = checkService.check({picture : picture});
        $scope.pictureSuccess = null;

        if ($scope.pictureError) {
            return ;
        }

        var reader = new FileReader();
        var base64 = null;

        reader.readAsDataURL(picture, "UTF-8");

        reader.onload = function (r) {

            base64 = r.target.result;

            userFactory.update({base64: base64}, function(res){
                $scope.pictureSuccess = true;
                $rootScope.me.base64 = base64;
            }, function (err){

            });
        };
    };

    $scope.openMovie = function(imdbToken) {
        $location.path('/t/' + imdbToken);
    };
}