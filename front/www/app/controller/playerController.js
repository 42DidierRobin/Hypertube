angular
    .module('hypertube')
    .controller('playerController', playerController);

function playerController($scope, $rootScope, $routeParams, movieFactory, commentFactory, $location){

    $scope.idMovie = $routeParams.idMovie;
    $scope.data = [];
    $rootScope.loading = true;

    $scope.comment = {
        time: 0,
        comment: '',
        timer: true,
        error: false
    };

    $scope.player = {
        livefeed: true,
        timer: 0
    };

    $scope.progress = 20;

    $scope.getURLSubtitle = function(imdbToken, subtitle) {
        return('http://' + HOST + ':4201/subtitle?imdbToken=' + imdbToken + '&language=' + subtitle + '&privateToken=' + $rootScope.privateToken);
    };

    $scope.getInfo = function(){
        movieFactory.player({torrentId: $scope.idMovie, privateToken: $rootScope.privateToken}, function(rep){
            $scope.data = rep.data.content;
            $scope.source = $rootScope.constants.urlStreaming + $routeParams.idMovie + '.' + $scope.data.format;
            $rootScope.loading = false;
        }, function(err){
            $rootScope.loading = false;
            $location.path('/');
        });
    };

    $scope.$watch('source', function() {
        $('video').attr('src', $scope.source);
    });

    $scope.sendComment = function(){
        $scope.comment.error = false;
        var data = {imdbToken:$scope.data.imdbToken, commentText:$scope.comment.comment};
        if ($scope.comment.timer)
            data.time = $scope.comment.time;
        commentFactory.add(data, function(res){
            if (!$scope.comment.timer)
                data.time = "0";
            data.id = res.data.content.id;
            data.user = $rootScope.pseudo;
            $scope.data.comments.push(data);
            $scope.comment.comment = '';
        }, function(err){
            $scope.comment.error = true;
        })
    };

    $scope.deleteComment = function(id, key){
        commentFactory.delete({commentId: id}, function(res){
            $scope.data.comments.splice(key, 1);
        }, function(err){

        })
    };

    $scope.getInfo();

}