angular
    .module('translationService', [])
    .service('translationService', ['$rootScope', '$cookies', '$resource', 'userFactory', function($rootScope, $cookies, $resource, userFactory) {

    var translationService = {};
    const languageAvailable = ['fr', 'en'];

    translationService.getTranslation = function() {

        var language = 'en';

        if (languageAvailable.indexOf($cookies.get('lang')) != -1) {
            language = $cookies.get('lang');
        }

        var languageFilePath = '/i18n/' + language + '.json';
        $resource(languageFilePath).get(function (data) {
            $rootScope.translate = data;
        });

        $rootScope.language = language;
    };

    translationService.changeLanguage = function(lang) {
        if (languageAvailable.indexOf(lang) != -1) {
            $cookies.put('lang', lang);
            if ($rootScope.privateToken != null) {
                userFactory.update({lang: lang}, function (res) {
                }, function (err) {
                });
            }
            translationService.getTranslation();
        }
    };

    return translationService;
}]);