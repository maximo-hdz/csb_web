'use strict';

/**
 * login controller
 * inject a login function in the scope
 */
angular.module('spaApp')
.controller('LoginCtrl', ['$scope', '$http', '$location', 'api', '$rootScope', '$window', 'userProvider', function ($scope,$http,$location, api, $rootScope, $window, userProvider) {
  /**
   * If user has a valid session token keep him in dashboard
   */

  if($rootScope.session_token && $location.$$path === '/login') {
    $location.path('/accounts');
  }
  /**
   * the login function connect the Rest-API: if the response status is OK, redirect to route "accounts",
   * else put an error message in the scope
   */
  $scope.loginData = {};

  /**
   * the error boolean
   */
  $scope.incorrectData = false;

  /**
   * the flow step : 0= checkLogin, 1=login
   */
  $scope.step = 0;

  //for the loader
  $scope.checkingUser = false;
  $scope.isLogin = false;

  /**
    * cancel the authentication flow and go back to the first step
    */
  $scope.reset=function(){
    resetError();
    $scope.loginData = {};
    $scope.step = 0;
  }


  /************************ Navigation ***********************************/
  /**
    Function for verify if exist user
  **/
  $scope.checkUser = function(){
    resetError();
    console.log($scope.loginData.username);
    if(!$scope.loginData.username.trim()) {
      setError('!Usuario incorrecto¡ favor de verificarlo');
    }else{
      var json = JSON.stringify({'user_login':$scope.loginData.username,'client_application_id': 'PROSA-DIG'});
      console.log(json);
      $scope.checkingUser = true;
      $http({
        url: $scope.restAPIBaseUrl+'/checkLogin',
        method: 'POST',
        data: json,
        headers: {'Content-Type': 'application/json','X-BANK-TOKEN': '4'}
      }).
      success(function(data, status, headers) {
        $scope.step = 1;
        console.log(data);
        $scope.client_name = data.client_name;
        $scope.images = data.images;
        $scope.checkingUser = false;
      }).
      error(function(data, status) {
        console.log("Status : ", status);
        setError('Error en el servicio, intente más tarde');
        $scope.checkingUser = false;
      });
    
    }
  }

  /**
    Function for authenticate user through middleware
  **/
  $scope.login = function(){
    resetError();
    console.log("usuario, password, selectedImage", $scope.username, $scope.password, $scope.selectedImage);
    if(!$scope.loginData.password.trim() || !$scope.loginData.selectedImage) {
      setError('Por favor, seleccione su imagen e introduzca su contraseña');
    }else{
      if(!$scope.loginData.selectedImage) {
        setError('Por favor, seleccione una imagen');
      }else{
        $scope.isLogin = true;
        $http({
          url: $scope.restAPIBaseUrl+'/login',
          method: 'POST',
          data: JSON.stringify({'user_login':$scope.loginData.username, 'password':$scope.loginData.password,'client_application_id': 'PROSA-DIG' , 'image_id': $scope.loginData.selectedImage.toString() }) ,
          headers: {'Content-Type': 'application/json','X-BANK-TOKEN': '4'}
        }).
          success(function(data, status, headers) {
          $scope.isLogin = false;
          var token = headers('X-AUTH-TOKEN');
          $rootScope.session_token = token;
          $rootScope.last_access_date = data.last_access_date
          $rootScope.last_access_media = data.last_client_application_id;
          $rootScope.client_name = data.client_name;
          api.init();
          $location.path( '/accounts' );
        }).
          error(function(data, status) {
          //put an error message in the scope
          $scope.isLogin = false;
          console.log("HttpStatus code : ", status);
          setError('Error en el servicio, intente más tarde');
          if(status === 403){
            setError('El password o imagen son incorrectos');
          }else if(status === 409){
            setError('Existe una sesión vigente en otra aplicación');
          }else if(status === 423){
            setError('Usuario bloqueado');
          }else if(status === 504){
            setError('Tiempo de respuesta excedido, por favor intente más tarde');
          }
        });
      }
    }
  };

  /**
   * Function for validate data before register
   */
  $scope.preRegister = function(client,contract){
      //TODO:Veryfy with REST service if exists contract?
      userProvider.setClientId(client);
      userProvider.preRegisterUser(contract).then(
        function(data) {
          $location.path( '/register');
        },
        function(data, status) {
            setError("Ha ocurrido un error en el registro");
        });
  }

  if($window.username) {
    $scope.loginData.username = $window.username;

    $scope.checkUser();

    // get errors from backend
    $scope.setLoginErrorMessages(parseInt($window.status), parseInt($window.code));
  }

  function setError(message){
    $scope.error = true;
    $scope.errorMessage = message;
  }

  function resetError(){
    $scope.error = false;
  }

}]);


