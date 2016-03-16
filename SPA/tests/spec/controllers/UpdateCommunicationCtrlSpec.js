'use strict';

var expect=chai.expect;

describe('Unit: Update Communication Controller', function(){

	var scope, updateCommCtrl;
	beforeEach(module('spaApp'));

	beforeEach(inject(function($rootScope,$controller){
		scope=$rootScope.$new();

		updateCommCtrl=$controller('updateCommunicationController',{
			$scope : scope
		});
	}));

	it('When get Communication',function(){
		scope.getCommunication();
		expect(scope.stage_updatecommunication).to.equal(1);
	});
});