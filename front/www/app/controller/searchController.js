angular
    .module('hypertube')
    .controller('searchController', searchController);

function searchController($scope, $rootScope, $location, $cookies, movieFactory, socketService, torrentService, $routeParams){

    $scope.idMovieOpen = false;
    $scope.type = null;

    socketService.plop();

    $scope.idYoutubeOpen = false;
    $scope.panelFilter = false;
    $scope.movies = [];

    $rootScope.loading = true;

    $scope.filter = {
        sortBy: 'title',
        orderBy: 'asc',
        filterBy: '',
        nbrResult: 50,
        minimumRating: 0,
        maximumRating: 10,
        minimumYear: 1900,
        maximumYear: 2020,
        offset: 0
    };

    $scope.filterError = {
        rating: false,
        year: false
    };

    $scope.categories = ['Action', 'Animation', 'Comedy', 'Documentary',
        'Family', 'Film-Noir', 'Horror', 'Musical', 'Romance',
        'Sport', 'War', 'Adventure', 'Biography', 'Crime',
        'Drama', 'Fantasy', 'History', 'Music', 'Mystery',
        'Sci-Fi', 'Thriller', 'Western'];

    $scope.sorts = ['title', 'year', 'rating'];

    $scope.getStateTorrent = function(url) {
        if ($rootScope.torrentInDownload[url]) {
            return $rootScope.torrentInDownload[url].state;
        }
        return null;
    };

    $rootScope.search = function(value){
        $scope.movies = [];
        $rootScope.searchValue = value;
        $scope.filter.offset = 0;
        $scope.search();
    };

    $scope.nextPage = function(){
        $scope.filter.offset += $scope.filter.nbrResult;
        $scope.search();
    };

    $scope.filterChange = function(){
        if ($scope.filter.minimumRating !== '' &&
            $scope.filter.maximumRating !== '' &&
            $scope.filter.minimumRating >= 0 && $scope.filter.minimumRating <= $scope.filter.maximumRating &&
            $scope.filter.maximumRating <= 10 && $scope.filter.maximumRating >= $scope.filter.minimumRating) {
            $scope.filterError.rating = false;
        } else {
            $scope.filterError.rating = true;
        }

        if ($scope.filter.minimumYear !== '' &&
            $scope.filter.maximumYear !== '' &&
            $scope.filter.minimumYear >= 1900 && $scope.filter.minimumYear <= $scope.filter.maximumYear &&
            $scope.filter.maximumYear <= 2020 && $scope.filter.maximumYear >= $scope.filter.minimumYear) {
            $scope.filterError.year = false;
        } else {
            $scope.filterError.year = true;
        }
        if (!$scope.filterError.rating && !$scope.filterError.year) {
            $rootScope.loading = true;
            $scope.filter.offset = 0;
            $scope.movies = [];
            $scope.search();
        }
    };

    $scope.orderChange = function(){
        if ($scope.filter.orderBy == 'asc')
            $scope.filter.orderBy = 'desc';
        else
            $scope.filter.orderBy = 'asc';
        $rootScope.loading = true;
        $scope.movies = [];
        $scope.search();
    };

    $scope.categoryChange = function(category){
        $scope.filter.filterBy = category;
        $scope.movies = [];
        $scope.filter.offset = 0;
        $rootScope.loading = true;
        $scope.search();
    };

    $scope.search = function() {
        movieFactory.search(
            Object.assign({
                privateToken: $rootScope.privateToken,
                query:$rootScope.searchValue,
            }, $scope.filter), function(rep){

                if ($routeParams.imdbToken == undefined)
                    $rootScope.loading = false;

            if ($scope.movies.length == 0)
                $scope.movies = rep.data.content.movies;
            else if (rep.data.content.movies.length != 0) {
                Array.prototype.push.apply($scope.movies, rep.data.content.movies);
                //$scope.$apply();
            }
        }, function(err){
            $rootScope.loading = false;
        });
    };

    $scope.movieOpen = function (id) {
        $rootScope.loading = true;
        movieFactory.about({privateToken: $rootScope.privateToken, imdbToken:id}, function(rep){
            $rootScope.loading = false;
            $scope.idMovieOpen = id;
            $scope.watch = false;
            $scope.movie = rep.data.content;
            $scope.panelFilter = false;
        }, function(err){
            $rootScope.loading = false;
            $scope.idMovieOpen = false;
        });
    };

    $scope.addTorrent = function (url, imdb){
        torrentService.add(url, imdb);
    };

    $scope.movieClose = function () {
        $scope.idMovieOpen = false;
    };

    $scope.youtubeClose = function () {
        $scope.idYoutubeOpen = false;
    };

    $scope.panelFilterOpen = function(){
        if ($scope.idMovieOpen)
            return;
        $scope.panelFilter = true;
        $scope.$apply();
    };

    $scope.panelFilterClose = function(){
        $scope.panelFilter = false;
        $scope.$apply();
    };

    $scope.watchNow = function(){
        $scope.watch = 1;
    };

    $scope.search();

    if ($routeParams.imdbToken != undefined) {
        $rootScope.loading = true;
        $scope.movieOpen($routeParams.imdbToken);
    }
}