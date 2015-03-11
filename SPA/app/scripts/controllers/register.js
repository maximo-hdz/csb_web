'use strict';

angular.module('spaApp').controller('RegisterCtrl', ['$scope','$location', 'userProvider', '$rootScope' , function ($scope, $location, userProvider, $rootScope) {

    // the register-flow's current-step
	$scope.selection = 1;
    
    // stores the register's data inputed by the user
    $scope.registerData = {};

    // is there an error in the register flow
    $scope.error = false;

    // the error's message (is incorrectData is true)
    $scope.errorMessage = null;
    
    /**
     * initialize the scope with the model's data (coming from the preRegister operation)
     */
    $scope.init = function() {
        var preRegisterData = userProvider.getPreRegistrationData();
        if(!preRegisterData) {
          $scope.gotoLogin();
          return;
        }
        $scope.contract = preRegisterData.contract;
        $scope.nameClient = $scope.contract.name;
        $scope.clientNumber = $scope.contract.client_id;
        $scope.bankBranch = $scope.contract.branch_name;
        $scope.date = $scope.contract.created_at;
        $scope.roleID = $scope.contract.role_id;
        $scope.rfc = $scope.contract.rfc;
        $scope.identifiers = preRegisterData.identifiers;

        // This is at this moment the default option of identifiers
        $scope.registerData.identifier = $scope.identifiers[0];

        $scope.images = {};
        for (var i = 0; i < preRegisterData.images.length; i++) {
            $scope.images[i] = { 'id' : preRegisterData.images[i].image_id, 'url' : $rootScope.restAPIBaseUrl + '/' + preRegisterData.images[i].url };
        }
    };
    
	/**
	 * go to the next flow's step
	 */
    $scope.completeStep = function(nextStep){
      $scope.error = false;
      $scope.errorMessage = null;
      $scope.selection = nextStep;
    }

	/**
	 * go back to the login page
	 */
	$scope.gotoLogin =function(){
        $scope.selection = 1;
        $scope.registerData = {};
        $scope.error = false;
        $scope.errorMessage = null;
    userProvider.resetRegistrationToken();
		$location.path( '/login' );
	 };

  $scope.invalidPassword = true;

  $scope.validatePassword = function() {
    $scope.error = false;
    $scope.invalidPassword = true;
    var password = $scope.registerData.password;
    if(password) {
      var pattern = /[A-Za-z0-9]{8,20}/g;
      if(!pattern.test(password)) {
        setError("La contraseña deberá tener carácteres alfanuméricos y con un mínimo de 8 carácteres");
        return;
      }

      var rexUser1 = new RegExp($scope.clientNumber, "g");
      if(rexUser1.test(password)) {
        setError("No puede usar su id de usuario como contraseña");
        return;
      }

      var rexInstName1 = new RegExp("consubanco", "i");
      if(rexInstName1.test(password)) {
        setError("No puede usar el nombre de la institución como contraseña");
        return;
      }

      var rexRfc = new RegExp($scope.rfc, "i");
      //console.log(lcs(password.toLowerCase(), $scope.rfc.toLowerCase()));
      if(rexRfc.test(password)) {
        setError("No puede usar su RFC como contraseña");
        return;
      }

      $scope.invalidPassword = false;

      // TODO: Enhance these validations
    }
  }

  function lcs(a, b) {
    var aSub = a.substr(0, a.length-1);
    var bSub = b.substr(0, b.length-1);

    if (a.length == 0 || b.length == 0) {
      return "";
    } else if (a.charAt(a.length-1) == b.charAt(b.length-1)) {
      return lcs(aSub, bSub) + a.charAt(a.length-1);
    } else {
      var x = lcs(a, bSub);
      var y = lcs(aSub, b);
      return (x.length > y.length) ? x : y;
    }
  }

	/**
	 * validate the client's password
	 */
	$scope.confirmPassword = function () {
		if(! $scope.registerData.password){
            setError("Las contraseñas no puede estar vacías");
		}else if($scope.registerData.password != $scope.registerData.repeatPass){
            setError("Las contraseñas ingresadas no coinciden");
        }else{
            // set the model and go to the next step
            userProvider.setPassword($scope.registerData.password);
            userProvider.setIdentifier($scope.registerData.identifier);
            $scope.completeStep(3);
        }
	};

	/**
	 * assign image
	 */
  $scope.selectImage = function(imageId) {
    $scope.registerData.selectedImage = imageId;
  };

	/**
	 * validate the client's image
	 */
	$scope.confirmImage = function () {
        if($scope.registerData.selectedImage){
            // set the model and go to the next step
        	userProvider.setImageId($scope.registerData.selectedImage);
        	$scope.completeStep(4);
        }else{
            setError("Debe elegir una imagen");
        }
	};

	/**
	 * validate the client's contact-information (phone number and email)
	 */
	$scope.confirmContactInformation = function () {
        var error =false;
        if($scope.registerData.email){
          if($scope.registerData.email != $scope.registerData.repeatEmail){
            error = true;
            setError("Los correos electrónicos no coinciden");
          }
        }else{
          if($scope.registerData.contactType == "byEmail"){
            error = true;
            setError("Debes ingresar una dirección de correo electrónico");
          }
        }
        if($scope.registerData.cellphone){
          if($scope.registerData.cellphone != $scope.registerData.repeatCellphone){
            error = true;
            setError("Los numeros de celular ingresados no coinciden");
          }
        }else{
          if($scope.registerData.contactType == "byCellPhone"){
            error = true;
            setError("Debe ingresar un número de celular");
          }
        }

        //we could use the $scope.incorrectData instead of a local variable "error", but it show more clarity this way
        if(! error){
            userProvider.setEmail($scope.registerData.email);
            userProvider.setPhoneNumber($scope.registerData.cellphone);
            if($scope.roleID === 1) {
              $scope.completeStep(5);
            } else {
              registerUser();
            }
        }
	};

    /**
     * confirm token 
     */
    $scope.confirmToken = function () {
        if(! $scope.registerData.acceptLegalMention){
            setError("Debe aceptar los términos de Consubanco");
        }else{
          userProvider.setCardId($scope.registerData.token);
          userProvider.setOtp1($scope.registerData.otp1);
          userProvider.setOtp2($scope.registerData.otp2);
          registerUser();
        }
    };

    /**
     * Register user
     */
    function registerUser() {
      $scope.isRegistering = true;
      userProvider.registerUser().then(
          function(data) {
            console.log("register succeed");
            $scope.isRegistering = false;
            $scope.completeStep(6);
          },
          function(data, status) {
            $scope.isRegistering = false;
            $scope.setServiceError("Ha ocurrido un error en el registro");
          }
        );

    }

    /**
     * private method: set an error on the register flow
     */
    function setError(errorMessage){
        $scope.error = true;
        $scope.errorMessage = errorMessage;
    };

  if(!userProvider.getRegistrationToken()) {
    $scope.gotoLogin();
    return;
  }
}]);
