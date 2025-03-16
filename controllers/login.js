angular.module('AdminLoginApp', ['ngCookies'])


.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])

.controller('adminloginController', function($scope, $http, $cookies) {

    $scope.username = "";
    $scope.password = "";

    $scope.isLoginError = false;
    $scope.warnMsg = "";

    $scope.loginadmin = function(){
        var data = {};
        data.username = $scope.username;
        data.password = $scope.password;
        $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/restricted/login/authenticate.php',
          data    : data,
          headers : {'Content-Type': 'application/x-www-form-urlencoded'}
         })
         .then(function(response) {
            $scope.token = response.data.response;
            if(response.data.status == true){

              //Set cookies
              var now = new Date();
              now.setDate(now.getDate() + 7);
              $cookies.put("vegaPilotAdminToken", $scope.token, {
                  expires: now
              });

              window.location = "question-bank.html";
            } else{
              $scope.isLoginError = true;
              $scope.warnMsg = response.data.error;
            }
        });
    }
})

  ;
