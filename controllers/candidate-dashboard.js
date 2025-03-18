angular.module('CandidateDashboardApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateDashboardController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    if($cookies.get("crispriteUserToken")){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "profile.html";
    }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("crispriteUserToken")){
        $cookies.remove("crispriteUserToken");
        window.location = "index.html";
      }
    }

    function getUserToken() {
        return "Bearer " + $cookies.get("crispriteUserToken");  
    }


    $scope.dashboardSummaryData = {};
    $scope.fetchDashboardSummaryData = function() {
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/dashboard-summary.php',
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.dashboardSummaryData = response.data.data;
                $scope.dashboardSummaryFound = true;
            } else {
                $scope.dashboardSummaryFound = false;
            }
        });
    }

    $scope.fetchDashboardSummaryData();


    $scope.courseListing = {};
    $scope.getCourseListingData = function(id) {
        $scope.courseIdOpen = id;
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/test-series-progress.php',
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.courseListing = response.data.data;
                $scope.courseListingFound = true;
            } else {
                $scope.courseListingFound = false;
            }
        });      
    }

    $scope.courseIdOpen = 1;
    $scope.getCourseListingData($scope.courseIdOpen);


    $scope.getCourseIconImage = function(courseData) {
        if(courseData.locked) {
            return "lockedIcon";
        } else if(courseData.previousAttemptId) {
            return "";
        } else if(!courseData.previousAttemptId && courseData.availableForAttempt) {
            return "availableIcon";
        } else {
            return "";
        }
    }


    //Start the Exam
    $scope.attemptExam = function(courseKey, seriesKey) {
        console.log('Launching exam courseKey: '+ courseKey+' / seriesKey: '+seriesKey);
    }

    //view last attempt report
    $scope.viewLastReport = function(attemptId) {
        console.log('Viewing last report '+attemptId);
    }

    //Go to Purchasing of the course
    $scope.goToPurchaseLink = function(testSeriesCode) {
        window.open("https://candidate.crisprlearning.com/secure-checkout/checkout.html?addItem="+testSeriesCode, "_blank");
    }

});