angular
    .module('hypertube')
    .factory('commentFactory', commentFactory);

function commentFactory($rootScope, requestService){
    var commentFactory = {};

    commentFactory.add = function(e, success, error){
        if (e.commentText.length <= 0 || e.commentText >= 128) {
            error();
        } else {
            requestService.post('Comments?privateToken=' + $rootScope.privateToken, e, success, error);
        }
    };

    commentFactory.delete = function(e, success, error){
        requestService.delete('Comments?privateToken=' + $rootScope.privateToken, e, success, error);
    };

    return commentFactory;
}