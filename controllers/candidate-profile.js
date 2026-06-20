angular.module('CandidateProfileApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateProfileController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    // if($cookies.get("crispriteUserToken")){
    //   $scope.isLoggedIn = true;
    // }
    // else{
    //   $scope.isLoggedIn = false;
    //   window.location = "index.html";
    // }

    // //Logout function
    // $scope.logoutNow = function(){
    //   if($cookies.get("crispriteUserToken")){
    //     $cookies.remove("crispriteUserToken");
    //     window.location = "index.html";
    //   }
    // }

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
              $scope.showToaster("Profile has been updated")
            } else {
              $scope.showToaster("Update failed")
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

        if (file.type === "image/heic" || file.type === "image/heif") {
              
              heic2any({
                blob: file,
                toType: "image/jpeg",
              }).then(function (resultBlob) {
                var reader = new FileReader();
                reader.onload = function (evt) {
                  $scope.$apply(function ($scope) {

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
                reader.readAsDataURL(resultBlob);
              });

        } else {

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
        }

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
          width: 100,
          height: 100,
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
                $scope.showToaster("Profile photo has been updated")
              }
          });   
    };


    //Student Photo (826 x 1062 crop window, saved to Bunny storage via backend)

    $scope.studentPhotoImage = '';
    $scope.studentPhotoLoadedToFrame = false;
    var studentPhotoCropper;

    var STUDENT_PHOTO_WIDTH = 826;
    var STUDENT_PHOTO_HEIGHT = 1062;

    var initStudentPhotoCropper = function(dataURL) {
      $scope.studentPhotoImage = dataURL;
      setTimeout(function(){
        var image = document.getElementById('studentPhotoImage');
        if (studentPhotoCropper) {
          studentPhotoCropper.destroy();
        }
        studentPhotoCropper = new Cropper(image, {
          aspectRatio: STUDENT_PHOTO_WIDTH / STUDENT_PHOTO_HEIGHT,
          autoCropArea: 1,
          viewMode: 1,
          scalable: false
        });
      }, 1000);
      $scope.studentPhotoLoadedToFrame = true;
    };

    var handleStudentPhotoSelect = function(evt) {
      var file = evt.currentTarget.files[0];
      if (!file) return;

      if (file.type === "image/heic" || file.type === "image/heif") {
        heic2any({
          blob: file,
          toType: "image/jpeg",
        }).then(function (resultBlob) {
          var reader = new FileReader();
          reader.onload = function (e) {
            $scope.$apply(function () {
              initStudentPhotoCropper(e.target.result);
            });
          };
          reader.readAsDataURL(resultBlob);
        });
      } else {
        var reader = new FileReader();
        reader.onload = function (e) {
          $scope.$apply(function () {
            initStudentPhotoCropper(e.target.result);
          });
        };
        reader.readAsDataURL(file);
      }
    };

    angular.element(document.querySelector('#studentPhotoFileInput')).on('change', handleStudentPhotoSelect);

    $scope.attachStudentPhoto = function(){
      $scope.studentPhotoLoadedToFrame = false;
      $scope.studentPhotoImage = '';
      $('#studentPhotoModal').modal('show');
    };

    $scope.saveStudentPhoto = function(){
      if (!studentPhotoCropper) return;
      var canvas = studentPhotoCropper.getCroppedCanvas({
        width: STUDENT_PHOTO_WIDTH,
        height: STUDENT_PHOTO_HEIGHT,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      var photoDataURL = canvas.toDataURL('image/jpeg', 0.92);

      $http({
        method  : 'POST',
        url     : 'https://crisprtech.app/crispr-apis/user/upload-id-photo.php',
        data    : { "photo": photoDataURL },
        headers : {
          'Content-Type': 'application/json',
          'Authorization': getUserToken()
        }
      })
      .then(function(response) {
        if (response.data.status == "success") {
          // Backend returns the Bunny CDN URL; cache-bust so the new crop shows immediately
          $scope.profileData.idPhoto = response.data.data + '?t=' + new Date().getTime();
          $scope.showToaster("Student photo has been updated");
        } else {
          $scope.showToaster("Upload failed");
        }
        studentPhotoCropper.destroy();
        studentPhotoCropper = null;
        $('#studentPhotoModal').modal('hide');
      }, function() {
        $scope.showToaster("Upload failed");
      });
    };

    $scope.removeStudentPhoto = function(){
      if (!confirm("Remove the student photo?")) return;
      $http({
        method  : 'POST',
        url     : 'https://crisprtech.app/crispr-apis/user/remove-id-photo.php',
        data    : {},
        headers : {
          'Content-Type': 'application/json',
          'Authorization': getUserToken()
        }
      })
      .then(function(response) {
        if (response.data.status == "success") {
          $scope.profileData.idPhoto = '';
          $scope.showToaster("Student photo has been removed");
        } else {
          $scope.showToaster("Remove failed");
        }
      }, function() {
        $scope.showToaster("Remove failed");
      });
    };


    $scope.showToaster = function(message) {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.classList.add('show');

        setTimeout(() => {
            toaster.classList.remove('show');
        }, 3000);
    }

});