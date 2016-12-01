angular
    .module('requestService', [])
    .service('requestService', ['$http', '$rootScope', function($http, $rootScope) {

        const requestService = {};

        requestService.post = function (url, data, success, error) {
            $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
            $http.post($rootScope.constants.hostApi + url, this.transformData(data)).then(success, error);
        };

        requestService.get = function (url, data, success, error) {
            $http.get($rootScope.constants.hostApi + url + '?' + this.transformData(data)).then(success, error);
        };

        requestService.delete = function (url, data, success, error) {
            $http({
                method: 'DELETE',
                url: $rootScope.constants.hostApi + url,
                data: data,
                headers: {
                    'Content-type': 'application/json;charset=utf-8'
                }
            }).success(success).error(error);
        };

        requestService.put = function (url, data, success, error) {
            $http({
                method: 'PUT',
                url: $rootScope.constants.hostApi + url,
                data: data
            }).success(success).error(error);
        };

        requestService.transformData = function(data) {
            var ret = '';
            for (k in data) {
                ret = ret + k + '=' + encodeURIComponent(data[k]) + '&';
            }
            return ret.slice(0, -1);
        };

        return requestService;
}]);