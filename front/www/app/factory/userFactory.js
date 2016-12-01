angular
    .module('hypertube')
    .factory('userFactory', userFactory);

function userFactory($rootScope, requestService){
    var userFactory = {};

    userFactory.signUp = function(user, success, error){
        userFactory.checkEmail(user.email, function(){
            userFactory.checkPseudo(user.pseudo, function(){
                requestService.post('User/signUp', user, success, error);
            }, function(){
                error({pseudo: {exist: true}});
            });
        }, function(){
            error({email: {exist: true}});
        });
    };

    userFactory.signIn = function(e, success, error){
        requestService.post('User/signIn', {pass: e.password, pseudo: e.pseudo}, function(rep){
            if (rep.data.content.privateToken && rep.data.content.privateToken.length == 42)
                success(rep.data.content.privateToken);
            else
                error();
        }, error);
    };

    userFactory.checkEmail = function(e, success, error){
        requestService.get('User/emailExist', {email: e}, success, error);
    };

    userFactory.checkPseudo = function(e, success, error){
        requestService.get('User/pseudoExist', {pseudo: e}, success, error);
    };

    userFactory.confirmMail = function(e, success, error){
        requestService.put('User/confirmMail', {emailToken: e}, success, error);
    };

    userFactory.facebook = function(token, userId, success, error){
        requestService.post('User/auth', {authWay: 'Facebook', accessToken: token, clientId: userId}, success, error);
    };

    userFactory.auth = function(authWay, token, success, error){
        var args = {};
        args.authWay = authWay;
        switch (authWay) {
            case 'Github':
                args.githubToken = token;
                break;
            case 'Linkedin':
                args.linkedinToken = token;
                break;
            case 'Ecole42':
                args.ecole42Token = token;
                break;
            case 'Slack':
                args.slackToken = token;
                break;
        }
        requestService.post('User/auth', args, success, error);
    };

    userFactory.google = function(token, userId, success, error){
        requestService.post('User/signIn/google', {googleToken: token, googleId: userId}, success, error);
    };

    userFactory.lost = function(email, success, error){
        requestService.get('User/newPwd', {email: email}, success, error);
    };

    userFactory.update = function(e, success, error){
        requestService.put('User/update?privateToken=' + $rootScope.privateToken, e, success, error);
    };

    userFactory.me = function(success, error){
        requestService.get('User', {privateToken: $rootScope.privateToken}, success, error);
    };

    userFactory.user = function(pseudo, success, error){
        requestService.get('User', {pseudo: pseudo, privateToken: $rootScope.privateToken}, success, error);
    };

    userFactory.newEmail = function(newEmail, success, error){
        requestService.put('User/newEmail?privateToken=' + $rootScope.privateToken, {email: newEmail}, success, error);
    };

    userFactory.updatePwd = function(newPassword, success, error){
        requestService.put('User/updatePwd?privateToken=' + $rootScope.privateToken, {password: newPassword}, success, error);
    };

    return userFactory;
}