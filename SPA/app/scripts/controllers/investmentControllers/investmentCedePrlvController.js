/**
 * The transactions controller. For transactions between own accounts.
 */
angular.module('spaApp').controller('InvestmentCedePrlvCtrl', ['$scope', 'transferProvider', 'productProvider', 'codeStatusErrors', function ($scope, transferProvider, productProvider, codeStatusErrors) {

    $scope.investmentCategory = null;

    function initialize(){
        $scope.step = 1;
        $scope.investment = [];
        $scope.investment.destinationProduct = '';
        $scope.investment.originAccount = '';
        $scope.investment.expirationInstruction = {};
        $scope.investmentResult = [];
        resetError();
        $scope.obtenCuentas();
    }
    initialize();

    /**
     * reset the error status to null
     */
    function resetError(){
        $scope.error = false;
    }

    /**
     * process a Rest-API invocation success
     */
    function processServiceSuccess(data) {
        $scope.investmentResult = [];
        $scope.investmentResult.account_number = data.account_number;
        $scope.investmentResult.expiration_date = data.expiration_date;
        if(data.interest != null){
            $scope.investmentResult.interestInfo =[];
            $scope.investmentResult.interestInfo.operation_date = data.interest.operation_date;
            $scope.investmentResult.interestInfo.amount = data.interest.amount;
        }
        $scope.step++;
    }

    /**
     * process a Rest-API onvocation error
     */
    function processServiceError(errorObject){
        var status = errorObject.status;
        var msg = codeStatusErrors.errorMessage(status);
        if (status === 500){
            $scope.setServiceError(msg + errorObject.response.message);
        } else {
            $scope.setServiceError(msg);
        }
    }

    /**
     * set the investment type (CEDE or PRLV)
     */
    $scope.setInvestmentType = function(investmentCategory){
        $scope.investmentCategory = investmentCategory;
        $scope.investmentInstructions = [];
        $scope.investmentInstructions.push({'investAgain' : false, 'label' : "Transferencia Cuenta Eje"});
        if($scope.investmentCategory === 'CEDE'){
            $scope.investmentInstructions.push({'investAgain' : true, 'label' : "Reinversión de Capital con Pago de Interés"});
        }else if($scope.investmentCategory === 'PRLV'){
            $scope.investmentInstructions.push({'investAgain' : true, 'label' : "Reinversión de Capital e Intereses"});
        }
    }

    /**
     * Function to navigate between steps.
	 */
	$scope.goToConfirmation = function() {
        resetError();
        $scope.step++;
        $scope.today = new Date().getTime();
        $scope.updateProgress(2);
	 };

    /**
     * Function to navigate between steps.
     */
    $scope.reset = function() {
        initialize();
        $scope.updateProgress(1);
     };

    /**
     * Goes back one step.
     */
    $scope.goBack = function() {
        $scope.step--;
    };

     /**
      * launch the investment operation
      */
     $scope.launchInvestment = function(){
        resetError();
        var currentInvestment = $scope.investment;
        var originAccountId = currentInvestment.originAccount._account_id;
        var productId = currentInvestment.destinationProduct.product_id;
        var amount = currentInvestment.amount;
        var investAgain = currentInvestment.expirationInstruction.investAgain;
        if($scope.investmentCategory === 'CEDE'){
            transferProvider.investCEDE(originAccountId, productId, amount, investAgain).then(
                processServiceSuccess,
                processServiceError
            );
            $scope.updateProgress(3);
        }else if($scope.investmentCategory === 'PRLV'){
            transferProvider.investPRLV(originAccountId, productId, amount, investAgain).then(
                processServiceSuccess,
                processServiceError
            );
            $scope.updateProgress(3);
        }else{
            $scope.setServiceError('Tipo de inversión desconocido');
         }
     }

     $scope.calculateEstimation = function(){
        productProvider.getProductDetail($scope.investment.destinationProduct.product_id, $scope.investment.amount).then(
            function(data) {
                $scope.investmentEstimation = data;
            }
        );
     }

     $scope.updateProgress = function(nextStep){
        $scope.currentStep = nextStep;
        var wrapperWidth = document.getElementById("progressWrapper").offsetWidth
        var progressWidth = ((wrapperWidth/3)*nextStep*100)/wrapperWidth
        $scope.stepStyle = {width:progressWidth+"%"}
        //console.log($scope.stepStyle)
    }

}]);
