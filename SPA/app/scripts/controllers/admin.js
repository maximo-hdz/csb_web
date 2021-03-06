angular.module('spaApp').controller('AdminCtrl', ['$rootScope', '$scope', 'adminProvider', 'userProvider', 'thirdAccountProvider', 'codeStatusErrors', '$stateParams',
function ($rootScope, $scope, adminProvider, userProvider, thirdAccountProvider, codeStatusErrors, $stateParams) {

	function init(){
		$scope.page = -1;
		$scope.size = 10;
		$scope.status = true;
		$scope.totalItems = 0;
		$scope.totalPages = 0;
		$scope.disableAnt = false;
		$scope.disableSig = false;
		$scope.asktoken = false;
		$scope.selection = 1;
		$scope.action = $scope.adminOpt === 4 ? 3 : 1;
		$scope.stage = 1;
		$scope.adminOpt = 5;
		$scope.errorMessage = null;
		$scope.today = new Date();
		$scope.beneficiary = {};
		$scope.activity('sig');

		if(userProvider.isCompleteUser()){
			$scope.adminOpt = $stateParams.opt;
			$scope.option = 1;
			getLimits();
			loadBeneficiary();
		}
	};

	$scope.activity = function(option) {
		if(($scope.disableSig && option === 'sig' ) || ($scope.disableAnt && option === 'ant')){
			return;
		}
		$scope.page = option === 'ant' ? $scope.page-1 : $scope.page+1 ;
		adminProvider.getUserActivity($scope.page, $scope.size).then(
			function(data) {
				$scope.userActivities = data.user_activities;
				$scope.totalPages = Math.ceil(data.total_items / $scope.size);
				$scope.disableAnt = $scope.page === 0 ? true : false;
				$scope.disableSig = $scope.page+1 === $scope.totalPages ? true : false;
			},
			function() {
				$scope.disableAnt = true;
				$scope.disableSig = true;
			}
		);
	};

	$scope.selectBeneficiary = function(account){
		$scope.action = 2;
		$scope.stage = 1;
		$scope.selectedAccount = account;
		$scope.delete.otp = '';
	};

	$scope.siguiente = function(){
		$scope.stage += 1;
	};

	$scope.regresar = function(){
		$scope.action = 1;
		$scope.stage = 1;
		$scope.delete.otp = '';
	};

	$scope.delete = function(){
		thirdAccountProvider.unregisterThirdAccount($scope.selectedAccount._account_id, $scope.delete.otp).then(
			function(data){
				dispatchThirdAccountByType(data);
				$scope.stage += 1;
				$scope.delete.otp = '';
			},
			function(errorObject) {
				$scope.delete.otp = '';
				var status = errorObject.status;
				if(status === 403){
					$scope.manageOtpErrorMessage(errorObject.response);
				} else {
					var msg = codeStatusErrors.errorMessage(status);
					if (status === 500){
						$scope.setServiceError(msg + errorObject.response.message);
					} else {
						$scope.setServiceError(msg);
					}
				}
			}
		);
	};

	$scope.isCompleteUser = function(){
		return userProvider.isCompleteUser();
	};

	$scope.addBeneficary = function(){
		$scope.action = 3;
	};

	$scope.completeStep = function(nextStep) {
		$scope.selection = nextStep;
		if (nextStep === 1) {
			$scope.beneficiary = {};
			$scope.payment = {};
			$scope.transfer = {};
		}
	};

	$scope.validateThirdAccount = function(){
		thirdAccountProvider.validateThirdAccount($scope.beneficiary.account).then(
			function(data) {
				$scope.beneficiary._account_id = data._account_id;
				$scope.beneficiary.bank_name = data.bank_name;
				$scope.beneficiary.same_bank = data.same_bank;
				if($scope.beneficiary.same_bank){
					$scope.beneficiary.name = data.client_name;
				}
				$scope.selection = 2;
			},
			function(errorObject) {
				var status = errorObject.status;
				var msg = codeStatusErrors.errorMessage(status);
				if (status === 500){
					$scope.setServiceError(msg + errorObject.response.message);
				} else if(status === 406){
					if(errorObject.response.code){
						msg = getError(errorObject.response.code);
					}
					$scope.setServiceError(msg);
				}else {
					$scope.setServiceError(msg);
				}
			}
		);
	};

	function getError(validationErrorCode){
		var msg = "";
		switch(validationErrorCode){
			case 100:
				msg="El Formato es invalido";
				break;
			case 101:
				msg="La CLABE es invalida";
				break;
			case 102:
				msg="El número de tarjeta de credito es invalido";
				break;
			case 103:
				msg="El número de cuenta es invalido";
				break;
			case 200:
				msg="El número de cuenta no está registrado en el sistema";
				break;
			default:
				break;
		}
		return msg;
	}

	$scope.sendBeneficiary = function() {
		thirdAccountProvider.registerThirdAccount($scope.beneficiary.aka, $scope.beneficiary.name, $scope.beneficiary.email, $scope.beneficiary.phone, $scope.beneficiary._account_id, $scope.beneficiary.token).then(
			function() {
				loadBeneficiary();
				$scope.selection = 4;
			},
			function(errorObject) {
				var status = errorObject.status;
				if(status === 403){
					$scope.manageOtpErrorMessage(errorObject.response);
				} else {
					var msg = codeStatusErrors.errorMessage(status);
					if (status === 500){
						$scope.setServiceError(msg + errorObject.response.message);
					} else {
						$scope.setServiceError(msg);
					}
				}
			}
		);
	};

	$scope.setLimits = function(amount, type, otp){
		adminProvider.setLimits(amount, type, otp).then(
			function(){
				adminProvider.getLimits().then(
					function(){
						var limits= $rootScope.limits;
						for(var i=0; i <  limits.length; i++){
							var type_name = limits[i].type;
							if(type_name === "PAYCARD_CONSUBANCO"){
								limits[i].type_name="Pago a TDC Terceros Consubanco";
							}else if (type_name === "TRANSFER_CONSUBANCO") {
								limits[i].type_name="Transferencia Terceros Consubanco";
							}else if (type_name === "TRANSFER_SPEI"){
								limits[i].type_name="Transferencia Terceros Otro Banco";
							}
						}
						$scope.limits = $rootScope.limits;
					}
				);
			},
			function(errorObject){
				$scope.setServiceError(errorObject.response.message);
				adminProvider.getLimits().then(
					function(){
						$scope.limits = $rootScope.limits;
					}
				);
			}
		);
	};

	$scope.mapUserActivity = function(activity) {
		var activityName = activity;

		var userActions = {
			'checkLogin': 'Pre Login',
			'authenticateUser': 'Login',
			'logout': 'Logout',
			'getAccounts': 'Consulta de Cuentas',
			'setAccountsLimits': 'Modificación de Límites',
			'getFile': 'Consulta de Estado de Cuenta',
			'getInvestmentProductsForUser': 'Consulta de Inversiones',
			'getThirdAccounts': 'Consulta de Cuentas de Terceros',
			'saveThirdAccount': 'Alta de Beneficiario',
			'removeThirdAccount': 'Baja de Beneficiario',
			'activateSecurityToken': 'Activación de Token',
			'disableSecurityToken': 'Baja de Token',
			'synchronizeSecurityToken': 'Sincronización de Token',
			'transfer': 'Transferencia',
			'changePassword': 'Cambio de Password',
			'updateCommunicationInfo': 'Cambio de Medio de Comunicación',
			'updateDigitalBankServicesState': 'Cambio de Status en Banca Digital'
		};

		if(userActions[activity]) {
			activityName = userActions[activity];
		}

		return activityName;
	};

	$scope.mapActivityStatus = function(activityStatus) {
		var statuses = {
			true : 'exitoso',
			false: 'fallo'
		};
		return statuses[activityStatus];
	};

	function dispatchThirdAccountByType(data){
		$scope.third_accounts = data;
		var third_accounts_own = [];
		var third_accounts_others = [];
		var account_type;
		if (typeof $scope.third_accounts !== 'undefined'){
			$scope.third_accounts.forEach(function(acc){
				if(acc.same_bank){
					third_accounts_own.push(acc);
				}else{
					third_accounts_others.push(acc);
				}
			});
		}
		if(third_accounts_own.length > 0){
			for(var i=0; i <  third_accounts_own.length; i++){
				account_type= third_accounts_own[i].account_type;
				if(account_type === 'TDC_T'){
					third_accounts_own[i].account_type_name = 'Tarjeta de Crédito Propia Mismo Banco';
				}else if(account_type === 'DEB_T'){
					third_accounts_own[i].account_type_name = 'Débito Propia Mismo Banco';
				}
			}
		}//End if validate
		if(third_accounts_others.length > 0){
			for(var y=0; y < third_accounts_others.length; y++){
				account_type = third_accounts_others[y].account_type;
				if(account_type === 'DEB_T') {
					third_accounts_others[y].account_type_name = 'Débito Propia Otros Bancos';
				}
			}
		}//End if validate
		$scope.third_accounts_own = third_accounts_own;
		$scope.third_accounts_others = third_accounts_others;
	};

	function loadBeneficiary(){
		thirdAccountProvider.getThirdAccounts().then(
			function(data) {
				dispatchThirdAccountByType(data);
			},function(errorObject) {
				var status = errorObject.status;
				if(status === 403){
				$scope.manageOtpErrorMessage(errorObject.response.message);
				} else {
					var msg = codeStatusErrors.errorMessage(status);
					if (status === 500){
						$scope.setServiceError(msg + errorObject.response.message);
					} else {
						$scope.setServiceError(msg);
					}
				}
			}
		)
	};

	function getLimits(){
		adminProvider.getLimits().then(
			function(){
				if($rootScope.limits.length > 0){
					for(var i=0; i <  $rootScope.limits.length; i++){
						var type_name = $rootScope.limits[i].type;
						if(type_name === "PAYCARD_CONSUBANCO"){
							$rootScope.limits[i].type_name="Pago a TDC Terceros Consubanco";
						}else if (type_name === "TRANSFER_CONSUBANCO") {
							$rootScope.limits[i].type_name="Transferencia Terceros Consubanco";
						}else if (type_name === "TRANSFER_SPEI"){
							$rootScope.limits[i].type_name="Transferencia Terceros Otro Banco";
						}
					}
				}
			}
		);
	};

	init();

}]);
