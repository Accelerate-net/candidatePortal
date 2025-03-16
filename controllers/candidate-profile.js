angular.module('CandidateProfileApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateProfileController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    if($cookies.get("crispriteUserToken")){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "candidate-profile.html";
    }

    //Logout function
    $scope.logoutNow = function(){
      if($cookies.get("crispriteUserToken")){
        $cookies.remove("crispriteUserToken");
        window.location = "candidate-login/index.html";
      }
    }

    function getUserToken() {
      return "Bearer " + $cookies.get("crispriteUserToken");  
    }

    //Default Tab
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('currentTab');
    $scope.activeTab = currentTab ? currentTab : 1;

    document.getElementById("profileTab"+ $scope.activeTab).click();

    $scope.changeActiveTab = function(tabId) {
      const url = new URL(window.location);
      url.searchParams.set("currentTab", tabId);
      window.history.pushState({}, '', url);
      $scope.activeTab = tabId;
    }

    $scope.getActiveClass = function(tabId) {
      return tabId == $scope.activeTab ? "active" : "";
    }


    $scope.originaProfileData = {};
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


    $scope.saveProfile = function(profileData) {
      $scope.profileData.dob = document.getElementById('dob_edit').value;
      var yearOfPassing = parseInt(profileData.yearOfPassing);
      if(yearOfPassing < 2000 || yearOfPassing > 2030)
        yearOfPassing = '';

      var updateData = {
          "name": profileData.name,
          "about": profileData.about,
          "dob": profileData.dob,
          "gender": profileData.gender,
          "place": profileData.place,
          "fatherName": profileData.fatherName,
          "motherName": profileData.motherName,
          "aspiration": profileData.aspiration,
          "classOfStudy": profileData.classOfStudy,
          "board": profileData.board,
          "yearOfPassing": yearOfPassing,
          "lastInstitution": profileData.lastInstitution,
          "communicationMobile": profileData.communicationMobile,
          "email": profileData.email
      }

      $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/user/update-profile.php',
          data    : updateData,
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                alert('profile updated')
            } else {
              console.log('failed')
            }
      });
    
    }



    $scope.resetProfile = function() {
      const number = $scope.profileData.registeredNumber;
      $scope.profileData = {};
      $scope.profileData.registeredNumber = number; 
    }

    $scope.getParentsNames = function(profileData) {
      var mother = profileData.motherName || '';
      var father = profileData.fatherName || '';

      if (mother && father) {
          return mother + " & " + father;
      } else if (mother) {
          return mother;
      } else if (father) {
          return father;
      } else {
          return "";
      }
    };

    $scope.getBoardAndYearOfPassing = function(profileData) {
      var board = profileData.board || '';
      var year = parseInt(profileData.yearOfPassing) || '';
      if(year < 1)
        year = '';

      if (board && year) {
          return board + " / " + year;
      } else if (board) {
          return board;
      } else if (year) {
          return year;
      } else {
          return "";
      }
    }




      //Updating Image

      //Image Cropper
      $scope.myImage = '';
      $scope.myCroppedImage = '';
      
      var image = "";
      $scope.cropBoxData;
      $scope.canvasData;
      $scope.cropper;
  
      var handleFileSelect = function(evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
          $scope.$apply(function($scope){
            $scope.myImage = evt.target.result;
            setTimeout(function(){ 
              image = document.getElementById('image');
              $scope.cropper = new Cropper(image, {
              aspectRatio: 1 / 1,
              autoCropArea: 0.9,
              scalable: false,
              ready: function () {
                  // Strict mode: set crop box data first
                  $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
                }
              });           
            }, 1000);
              $scope.photoLoadedToFrame = true;
          });
        };
        reader.readAsDataURL(file);
      };
      
      angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
   


   $scope.attachPhoto = function(){
    $('#imageModal').modal('show');   
    $scope.photoLoadedToFrame = false;  
   }

   $scope.removePhoto = function(){
    $scope.isPhotoAttached = false;
    $scope.myPhotoURL = '';
   }
      
   $scope.isPhotoAttached = false;
   $scope.saveAttachment = function(){
      $scope.isPhotoAttached = true;   
          $scope.canvasData = $scope.cropper.getCroppedCanvas({
          width: 200,
          height: 200,
          fillColor: '#fff',
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'high',
        });
        
      $scope.myPhotoURL = $scope.canvasData.toDataURL();
      $scope.saveCandidatePhoto($scope.myPhotoURL);
      $scope.cropper.destroy();
      $('#imageModal').modal('hide');   
   }



    $scope.saveCandidatePhoto = function(photoURL){
          var data = {
            "photo" : photoURL
          };
          $http({
            method  : 'POST',
            url     : 'https://crisprtech.app/crispr-apis/user/upload-profile-photo.php',
            data    : data,
            headers : {
              'Content-Type': 'application/json',
              'Authorization': getUserToken()
            }
           })
           .then(function(response) {            
              if(response.data.status == "success") {
                $scope.profileData.photo = response.data.data;
              }
          });   
    };


});