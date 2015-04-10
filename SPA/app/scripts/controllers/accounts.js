'use strict';

/**
 * The accounts controller. Gets accounts passing auth parameters
 */
 angular.module('spaApp').controller('AccountsCtrl', ['$rootScope', '$scope', '$location', 'accountsProvider', 'codeStatusErrors', function ( $rootScope, $scope, $location, accountsProvider, codeStatusErrors) {

    $scope.statementStatus = [];
    $scope.showTDCAccount = false;
    $scope.showInvestmentAccount = false;
    $scope.showSavingAccount = false;
    $scope.showCreditAccount = false;
	console.log('Load account dashboard information');
	  accountsProvider.getAccounts().then(
          function(data) {
            $scope.accounts = $rootScope.accounts;
            $scope.selectNavigatOption('products'); 
            $scope.selectAccount( $scope.accounts[0]);
            console.log('Getting accounts ......');
            console.log($scope.accounts);
            verifyExistAccount();
          },
          function(errorObject) {
            var status = errorObject.status;
            var msg = codeStatusErrors.errorMessage(status);
            if (status === 500){
                $scope.setServiceError(msg + errorObject.response.message);
            } else {
                $scope.setServiceError(msg);
            }
        }
    );

    function verifyExistAccount(){
        var length=$scope.accounts.length;
        for(var i=0 ;i < length ; i++){
            switch($scope.accounts[i].account_type){
                case 'TDC' : $scope.showTDCAccount = true;
                break;
                case 'INV' : $scope.showInvestmentAccount = true;
                break;
                case 'DEP' : $scope.showSavingAccount = true;
                break;
                case 'CXN' : $scope.showCreditAccount = true;
                break;
            }
        }
    }

    $scope.selectAccount = function(accountSelected) {

    var accountId = accountSelected._account_id;
    var type = accountSelected.account_type;

    $scope.activeClass = accountId;
    $scope.selectedAcccountId = accountId;
    $scope.selectedAccountType = type;
    $scope.activeAccountName = accountSelected.name + ' ' + accountSelected.maskedAccountNumber;
    $scope.investmetCategory = accountSelected.category;
    $scope.statementStatus.showStatement = false;
    
    switch (type) {
        case 'TDC':
            console.log('Tarjeta de Credito');
            $location.path('accounts/'+accountId+'/tdc');//+accountId);
            console.log($location.path());
            break;
        case 'INV':
            console.log('Inversiones');
            $location.path('/accounts/'+accountId+'/investment');
            console.log($location.path());
            break;
        case 'DEP':
            console.log('Cuentas');
            $location.path('/accounts/'+accountId+'/deposit');
            console.log($location.path());
            break;
        case 'CXN':
            console.log('Creditos');
            $location.path('/accounts/'+accountId+'/credit');
            console.log($location.path());
            break;
        default:
            break;
    }
  };

}]);
