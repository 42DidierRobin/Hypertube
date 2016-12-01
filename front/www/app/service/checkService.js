angular
    .module('checkService', [])
    .service('checkService', ['$rootScope', function($rootScope) {

        const checkService = {};

        const argsCheckList = {
            "pseudo": {
                option: {
                    size: {
                        min: 4,
                        max: 42
                    },
                    char: {
                        all: false,
                        alpha: true,
                        alphaM: true,
                        num: true,
                        more: ['_@-']
                    }
                }
            },
            "firstName": {
                option: {
                    size: {
                        min: 4,
                        max: 21
                    },
                    char: {
                        all: false,
                        alpha: true,
                        alphaM: true,
                        num: false,
                        more: ['- ']
                    }
                }
            },
            "lastName": {
                option: {
                    size: {
                        min: 4,
                        max: 21
                    },
                    char: {
                        all: false,
                        alpha: true,
                        alphaM: true,
                        num: false,
                        more: ['- ']
                    }
                }
            },
            "password": {
                option: {
                    size: {
                        min: 4,
                        max: 32
                    }
                }
            },
            "email": {
                option: {
                    reg: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
                }
            },
            "picture": {
                option: {
                    file: {
                        type: ['image/jpeg', 'image/png'],
                        size: {
                            min: 1000,
                            max: 1000000
                        }
                    }
                }
            }
        };

        const alpha = "qwertyuiopasdfghjklzxcvbnm";
        const alphaM = "QWERTYUIOPASDFGHJKLZXCVBNM";
        const num = "0123456789";

        checkService.check = function(data) {
            var error = new Array();
            error['error'] = false;
            for (var k in data) {
                error[k] = new Array();
                var checkPattern = argsCheckList[k];
                if (checkPattern === undefined){

                } else {
                    //check size
                    if (checkPattern.option.reg !== undefined) {
                        var pattern = new RegExp(checkPattern.option.reg)
                        if (!pattern.test(data[k])) {
                            error['error'] = true;
                            error[k]['error'] = true;
                            error[k]['reg'] = true;
                        }
                    }

                    //check file
                    if (checkPattern.option.file !== undefined) {
                        if (data[k] == undefined || data[k].constructor != File) {
                            error['error'] = true;
                            error[k]['error'] = true;
                            error[k]['file'] = true;
                        } else {
                            if (checkPattern.option.file.type.indexOf(data[k].type) == -1) {
                                error['error'] = true;
                                error[k]['error'] = true;
                                error[k]['type'] = true;
                            } else {
                                if (checkPattern.option.file.size.min > data[k].size || checkPattern.option.file.size.max < data[k].size) {
                                    error['error'] = true;
                                    error[k]['error'] = true;
                                    error[k]['size'] = {min: checkPattern.option.file.size.min, max: checkPattern.option.file.size.max};
                                }
                            }
                        }
                    }

                    //check size
                    if (checkPattern.option.size !== undefined) {
                        if (data[k].length < checkPattern.option.size.min || data[k].length > checkPattern.option.size.max) {
                            error['error'] = true;
                            error[k]['error'] = true;
                            error[k]['size'] = {min: checkPattern.option.size.min, max: checkPattern.option.size.max};
                        }
                    }

                    //check char
                    if (checkPattern.option.char !== undefined) {
                        var charPattern = '';
                        if (checkPattern.option.char.alpha === true)
                            charPattern = charPattern + alpha;
                        if (checkPattern.option.char.alphaM === true)
                            charPattern = charPattern + alphaM;
                        if (checkPattern.option.char.num === true)
                            charPattern = charPattern + num;
                        if (checkPattern.option.char.more !== undefined)
                            charPattern = charPattern + checkPattern.option.char.more;
                        for(var i = 0; i < data[k].length; i++) {
                            if (charPattern.indexOf(data[k].charAt(i)) == -1) {
                                error['error'] = true;
                                error[k]['error'] = true;
                                error[k]['char'] = true;
                            }
                        }
                    }
                }
                if (!error[k].error){
                    delete error[k];
                }
            }
            if (error['error'])
                return (error);
            return null;
        };
        return checkService;
}]);