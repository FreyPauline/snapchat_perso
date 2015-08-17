/*jslint browser: true, node: true */
/*global $, jQuery, angular*/
"use strict";
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ['ionic', 'ngRoute']),
    StatusBar,
    cordova,
    snaps,
    FileTransfer,
    FileUploadOptions,
    Camera,
    isEmail;

app.factory('myusers', function ($q, $location, $window) {
    var data;
    return {
        data: data,
        set: function (userData) {
            data = userData;
        },
        isDisconnect: function () {
            var deferred = $q.defer();
            if (localStorage.token === undefined) {
                deferred.resolve();
            } else {
                deferred.reject();
                $location.path("/pageConnect");
            }
            return $q.promise;
        },
        isConnect: function () {
            var deferred = $q.defer();
            if (localStorage.token !== undefined) {
                deferred.resolve();
            } else {
                deferred.reject();
                $location.path("/");
            }
            return $q.promise;
        },
        save : function (userData, choice) {
            if (choice === 1) {
                $window.localStorage.setItem('token', userData.token);
                $window.localStorage.setItem('email', userData.data[0].username);
                $window.localStorage.setItem('remember', true);
            } else {
                $window.localStorage.setItem('token', userData.token);
                $window.localStorage.setItem('email', userData.data[0].username);
            }
        }
    };
});

app.config(function ($routeProvider) {

    $routeProvider
        .when('/', {
            templateUrl : 'templates/home.html',
            resolve: {
                connected : function (myusers) {
                    return myusers.isDisconnect();
                }
            }
        })
        .when('/pageConnect', {
            templateUrl : 'templates/snapchat.html',
            resolve: {
                connected : function (myusers) {
                    return myusers.isConnect();
                }
            }
        })
        .when('/mySnap', {
            templateUrl : 'templates/mySnap.html',
            resolve: {
                connected : function (myusers) {
                    return myusers.isConnect();
                }
            }
        })
        .when('/showSnap/id/:id', {
            templateUrl : 'templates/showSnap.html',
            resolve: {
                connected : function (myusers) {
                    return myusers.isConnect();
                }
            }
        })
        .otherwise({redirecTo : '/'});
});
app.controller('disconnectCtrl',  function ($scope, $location, $window) {
    $scope.disconnect = function () {
        $window.localStorage.removeItem('token');
        $window.localStorage.removeItem('email');
        $window.localStorage.removeItem('remember');
        $location.path("/");
    };
});
app.controller('CameraCtrl', function ($scope, $http, $window) {
    $scope.formDataSnap = {};
    var myImg,
        onUploadSuccess,
        onUploadFail,
        dataSend,
        image,
        onSuccess = function (imageData) {
            myImg = imageData;
            document.getElementById('formSend').style.display = "block";
            image = document.getElementById('pictureTaking');
            image.src = imageData;
            dataSend = {'email' : $window.localStorage.email, 'token': $window.localStorage.token};
            $http({
                method  : 'POST',
                url     : 'http://remikel.fr/api.php?option=toutlemonde',
                data    : dataSend
            })
                .success(function (data) {
                    console.log(data);
                    if (data.error !== false) {
                        $scope.errors = data.error;
                    } else {
                        $scope.users = data.data;
                    }
                }).
                error(function (data) {
                    $scope.errors = data.error;
                });

        },
        onFail = function (e) {
            console.log("On fail " + e);
        };
    $scope.takePic = function () {
        var options =   {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Photo Album
            correctOrientation: true,
            encodingType: 0     // 0=JPG 1=PNG
        };
        navigator.camera.getPicture(onSuccess, onFail, options);
    };
    $scope.sendSnap = function () {
        if ($scope.formDataSnap.email !== undefined && $scope.formDataSnap.timeSnap !== undefined) {
            var nbSend = $scope.formDataSnap.email.length,
                i,
                ft = new FileTransfer(),
                options = new FileUploadOptions(),
                params = {};
            onUploadSuccess = function (r) {
                image = document.getElementById('pictureTaking');
                image.src = "img/snap.jpg";
                document.getElementById('formSend').style.display = "none";
                $scope.succesSend = "Votre Snap à bien été envoyé!";
                console.log(r);
            };
            onUploadFail = function (error) {
                // error.code == FileTransferError.ABORT_ERR
                $scope.errorSend = "une erreur c'est produite votre snap n'as pas été envoyer";
                console.log("An error has occurred: Code = " + error.code);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            };
            for (i = 0; i < nbSend; i += 1) {
                options.fileKey = "file";
                options.fileName = myImg.substr(myImg.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";

                params.token = localStorage.token;
                params.email = localStorage.email;
                params.temps = $scope.formDataSnap.timeSnap;
                params.u2 = $scope.formDataSnap.email[i];
                options.params = params;

                ft.upload(myImg, encodeURI("http://remikel.fr/api.php?option=image"), onUploadSuccess, onUploadFail, options);

            }
        } else {
            $scope.errorSend = "Vous n'avez pas remplit tout les champs obligatoires";
        }
    };
});
app.controller('formCtrl', function ($scope, $http, myusers, $location) {
    $scope.formData = {};

    $scope.processFormSign = function () {
        if (isEmail($scope.formData.email)) {
            $http({
                method  : 'POST',
                url     : 'http://remikel.fr/api.php?option=connexion',
                data    : $scope.formData
            })
                .success(function (data) {
                    if (data.error !== false) {
                        $scope.errorsSign = data.error;
                    } else {
                        if ($scope.formData.stayConnect === true) {
                            myusers.set(data);
                            myusers.save(data, 1);
                            $location.path("/pageConnect");
                        } else {
                            myusers.set(data);
                            myusers.save(data, 0);
                            $location.path("/pageConnect");
                        }
                    }
                }).
                error(function (data) {
                    $scope.errorsSign = data.error;
                });
        } else {
            $scope.errorsSign = "Vous n'avez pas rentré un email";
        }
    };
    $scope.processFormRegister = function () {
        if (isEmail($scope.formData.email)) {
            $http({
                method  : 'POST',
                url     : 'http://remikel.fr/api.php?option=inscription',
                data    : $scope.formData
            })
                .success(function (data) {
                    if (data.error !== false) {
                        $scope.errors = data.error;
                    } else {
                        $scope.successInscrip = "L'inscription c'est correctement déroulé, veuillez maintenant vous inscrire";
                    }
                }).
                error(function (data) {
                    $scope.errors = data.error;
                });
        } else {
            $scope.errors = "Vous n'avez pas rentré un email";
        }
    };
});

isEmail = function (email) {

    var regEmail = new RegExp('^[0-9a-z._-]+@{1}[0-9a-z.-]{2,}[.]{1}[a-z]{2,5}$', 'i');

    return regEmail.test(email);
};
app.controller('mySnap', function ($scope, $http) {

    $http({
        method  : 'POST',
        url     : 'http://remikel.fr/api.php?option=newsnap',
        data    : { 'email': localStorage.email, 'token' : localStorage.token }
    })
        .success(function (data) {
            if (data.error !== false) {
                $scope.errorsSign = data.error;
            } else {
                $scope.snaps = data.data;
                snaps = data.data;
                console.log(data);
            }
        }).
        error(function (data) {
            $scope.errorsSign = data.error;
        });
});
app.controller('showSnap',  function ($scope, $http, $location, $routeParams, $timeout) {
    var id = $routeParams.id,
        time,
        i,
        snapVu = function (snaps) {
            if (id === snaps[i].id) {
                time = snaps[i].temps * 1000;
                $scope.show = snaps[i];
                $http({
                    method  : 'POST',
                    url     : 'http://remikel.fr/api.php?option=vu',
                    data    : { 'email': localStorage.email, 'token' : localStorage.token, 'id': snaps[i].id }
                })
                    .success(function (data) {
                        if (data.error !== false) {
                            $scope.errorsSign = data.error;
                        } else {
                            console.log(data);
                        }
                    }).
                    error(function (data) {
                        $scope.errorsSign = data.error;
                    });
            }
        };
    for (i = 0; i < snaps.length; i += 1) {
        snapVu(snaps);
    }
    $timeout(function () {
        $location.path("/mySnap");
    }, time);
});
app.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
        document.addEventListener('deviceready', function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    });
});