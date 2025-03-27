angular.module('CandidateRevisitApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateRevisitController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    // if($cookies.get("crispriteUserToken")){
    //   $scope.isLoggedIn = true;
    // }
    // else{
    //   $scope.isLoggedIn = false;
    //   window.location = "index.html";
    // }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("crispriteUserToken")){
        $cookies.remove("crispriteUserToken");
        window.location = "index.html";
      }
    }

    function getUserToken() {
    	return "Bearer JXsrcfa+d2hlz/lJM53V/nxM5GZEj89YZSMejY/nfKsWjUStud28qwihqQkY7ErMuqGzVQmO4y7rxhbZ6SfyU4w7/2ve1nSP6W4bk2x7d4eOZ7onpv6xFBL2e1boTr4tAVfo8SYJrdIi0LLeJfUk5QOdMDwRdvGrqeUyySro8F4=";
    	//return "Bearer " + $cookies.get("crispriteUserToken");  
    }

    function getReportIdPassed() {
        const urlParams = new URLSearchParams(window.location.search);
        return decodeURIComponent(urlParams.get('attemptId'));
    }


    $scope.profileData = {};
    $scope.fetchProfileData = function() {
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/user-profile.php',
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.originaProfileData = response.data.data;
                $scope.profileData = response.data.data;
                $scope.profileFound = true;
            } else {
                $scope.profileFound = false;
            }
        });
    }

    $scope.fetchProfileData();


  	$scope.getTrustedUrl = function(url) {
    	return $sce.trustAsResourceUrl(url);
  	};


    $scope.questionDetailsFound = false;
    $scope.questionDetails = {};
    $scope.openQuestion = function(sectionId, questionId) {

    	var data = {
		    "id": 200003,
		    "section": sectionId,
		    "question": questionId
		}


        $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/user/revisit-solution.php',
          data    : data,
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.questionDetails = response.data.data;

                $scope.currentQuestion = questionId;
    			$scope.currentSection = sectionId;

                console.log($scope.questionDetails)
                $scope.questionDetailsFound = true;
            } else {
                $scope.questionDetailsFound = false;
            }
        });
    }


    $scope.currentQuestion = 1;
    $scope.currentSection = 1;
    $scope.openQuestion($scope.currentSection, $scope.currentQuestion); //Open first question of first section by default


    $scope.seekPreviousQuestion = function() {
    	$scope.openQuestion($scope.currentSection, $scope.currentQuestion - 1);
    }

    $scope.seekNextQuestion = function() {
    	$scope.openQuestion($scope.currentSection, $scope.currentQuestion + 1);
    }


});