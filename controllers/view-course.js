angular.module('ViewCourseApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('viewCourseController', function($scope, $http, $interval, $cookies, $sce) {

    // //Check if logged in
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
    const courseId = urlParams.get('course');
    const moduleId = urlParams.get('module');
    const chapterId = urlParams.get('chapter');





    $scope.originaProfileData = {};



    $scope.renderContentVideo = function(videoId) {
      var baseUrl = "https://iframe.mediadelivery.net/embed/475938/";
      var params = "?autoplay=true";
      $scope.contentSource = $sce.trustAsResourceUrl(baseUrl + videoId + params);
    };




    $scope.chapterData = {};
    $scope.selectedPartData = {};
    $scope.contentSource = {}; //Current Video URL

    $scope.fetchChapterData = function() {


        // $http({
        //   method  : 'GET',
        //   url     : 'https://crisprtech.app/crispr-apis/course/fetch-module-chapter-data.php',
        //   headers : {
        //     'Content-Type': 'application/json',
        //     'Authorization': getUserToken()
        //   }
        //  })
        //  .then(function(response) {
        //     if(response.data.status == "success"){
        //         $scope.originaProfileData = response.data.data;
        //         $scope.profileData = response.data.data;
        //         $scope.profileFound = true;
        //     } else {
        //         $scope.profileFound = false;
        //     }
        //     console.log("HI")
        // });

        var responseData = {
            "courseId": "CR0003",
            "courseName": "1 Year Program 2025",
            "modules": [
                {
                    "id": "1",
                    "name": "Biology",
                    "chapters": [
                        {
                            "id": "1",
                            "code": "Chapter 1",
                            "title": "Animal Kingdom",
                            "parts": [
                                {
                                    "id": "1",
                                    "title": "Part 1: Introduction",
                                    "duration": "530",
                                    "source": "a5a65236-8356-449b-80fe-4c0857ac43ec",
                                    "type": "VIDEO"
                                },
                                {
                                    "id": "2",
                                    "title": "Part 2: Principles of Animals and Birds",
                                    "duration": "1229",
                                    "source": "656a4f83-e567-4a34-ba21-236ffc54b6f3",
                                    "type": "VIDEO"
                                }
                            ],
                            "rating": {
                                "value": 49,
                                "total": 154
                            },
                            "teacher": {
                                "name": "Amith C S",
                                "brief": "Having graduated from IISER Trivandrum, Amith Sir has been having 5+ years of teaching experience",
                                "rating": 46,
                                "photo": "https://amithcs.in/assets/images/avatar.jpg"
                            }
                        }
                    ]
                }
            ]
        };

        var moduleData = responseData.modules.find(module => module.id === moduleId);
        $scope.moduleData = moduleData;
        $scope.chapterData = moduleData.chapters.find(chapter => chapter.id === chapterId);

        $scope.selectedPartData = $scope.chapterData.parts[0];
        $scope.renderContentVideo($scope.selectedPartData.source);
    }

    $scope.fetchChapterData();



    $scope.openContent = function(partData) {
      $scope.selectedPartData = partData;
      $scope.renderContentVideo($scope.selectedPartData.source);
    }


    $scope.getPartsDuration = function(duration) {
      if (!duration || isNaN(duration)) return '';

      const seconds = parseInt(duration, 10);

      if (seconds < 60) {
        return '< 1 min';
      }

      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (hours > 0) {
        return `${hours} hr${hours > 1 ? 's' : ''}` + (remainingMinutes > 0 ? ` ${remainingMinutes} min` : '');
      } else {
        return `${minutes} min`;
      }
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