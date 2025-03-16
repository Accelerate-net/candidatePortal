angular.module('questionBankApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('questionBankController', function($scope, $http, $interval, $cookies, $sce, $timeout) {

    /**
      //Check if logged in
      if($cookies.get("vegaPilotAdminToken")){
        $scope.isLoggedIn = true;
      }
      else{
        $scope.isLoggedIn = false;
        window.location = "index.html";
      }

      //Logout function
      $scope.logoutNow = function(){
        if($cookies.get("vegaPilotAdminToken")){
          $cookies.remove("vegaPilotAdminToken");
          window.location = "index.html";
        }
      }
    **/

      $scope.maxResultsShown = 10; //Records

      $scope.summaryTileData = {
          "ratio": "0 : 0 : 0",
          "total": "0",
          "totalPYQ": "0",
          "totalUnverified": "0",
          "totalChallenged": "0",
          "lastChallengeTime": "Unknown",
          "unverifiedPercentage" : "0"
      }

      $scope.renderSummaryTiles = function(){
            $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/list-summary.php',
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.summaryTileData = response.data;
                  $scope.totalPages = Math.ceil($scope.summaryTileData.total / $scope.maxResultsShown);

                  $scope.summaryTileData.unverifiedPercentage = (($scope.summaryTileData.totalUnverified / $scope.summaryTileData.total) * 100).toFixed(1);
                }
            });
      }

      $scope.renderSummaryTiles();



      $scope.filterAllQuestions = function(page, records, type) {
            $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/list.php?page='+page+'&records='+records+'&filter='+type,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.listData = response.data.data;

                  if(type == "UNVERIFIED")
                    $scope.totalPages = Math.ceil($scope.summaryTileData.totalUnverified / $scope.maxResultsShown);
                  else if(type == "CHALLENGED")
                    $scope.totalPages = Math.ceil($scope.summaryTileData.totalChallenged / $scope.maxResultsShown);

                }
            });
      }

      $scope.listQuestions = function(page, records){
        $scope.filterAllQuestions(page, records, 'ALL');
      }

      //Default Listing
      $scope.currentPage = localStorage.getItem("currentPageQuestionBankListing") ? localStorage.getItem("currentPageQuestionBankListing") : 1;
      $scope.totalPages = Math.ceil($scope.summaryTileData.total / $scope.maxResultsShown);


      $scope.getPYQLabel = function (questionData) {
        if(questionData.pyqType != "" && questionData.pyqYear != "")
          return questionData.pyqType + " - " + questionData.pyqYear;
      }

      $scope.formatEpoch = function(epoch) {
        if(!epoch || epoch == null) {
          return "";
        }

        const date = moment(epoch * 1000); 
        const today = moment().isSame(date, 'day');
        
        if (today) {
          return "at " + date.format('h:mm A');
        } else {
          return "on " + date.format("DD MMM, 'YY");
        }
      };


      

      $scope.goLeft = function() {
        $scope.currentPage--;
        if($scope.currentPage < 1)
          $scope.currentPage = 1;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }

      $scope.goRight = function() {
        $scope.currentPage++;
        if($scope.currentPage > $scope.totalPages)
          $scope.currentPage = $scope.totalPages;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }



      $scope.questionBankFilterApplied = "";
      $scope.quickFilterQuestionBank = function(type) {
          $scope.currentPage = 1;
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", type);
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, type);
          $scope.questionBankFilterApplied = type;
      }

      $scope.removeFilterOnQuestionBank = function() {
          $scope.questionBankFilterApplied = "";
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", "");
          $scope.currentPage = 1;
          $scope.listDefaultQuestions();
      }





      //DATA MODIFICATIONS
      $scope.createView = false;
      $scope.modifyQuestionView = false;

      $scope.addNewQuestion = function() {
          $scope.createView = true;
          $scope.modifyQuestionView = false;
      }


      $scope.currentQuestionSequence = 1;
      $scope.grandTotalQuestions = $scope.summaryTileData.total;

      $scope.modifyQuestion = function(id) {
          
          $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/read-single.php?id='+id,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  
                  $scope.createView = true;
                  $scope.modifyQuestionView = true;

                  $scope.modifyQuestionData = response.data;
                  $scope.isPhotoAttached = $scope.modifyQuestionData.url != "";
                  $scope.isPhotoAttachedSolution = $scope.modifyQuestionData.solutionURL != "";

                  $scope.modifyQuestionData.pyqYear == 0 ? $scope.modifyQuestionData.pyqYear = "" : $scope.modifyQuestionData.pyqYear;

                  $scope.currentQuestionSequence = parseInt(response.data.sequenceNumber);
                  $scope.grandTotalQuestions = parseInt(response.data.totalQuestions);


                  //Update URL param
                  const url = new URL(window.location);
                  url.searchParams.set("modifyId", $scope.modifyQuestionData.id);
                  window.history.pushState({}, '', url);

                } else {
                  $scope.modifyQuestionData = {};
                  $scope.showToasterError("Question #"+id+" not found");
                }
            });

      }

      $scope.seekQuestionBySequenceNumber = function(seekNumber) {
          $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/read-in-sequence.php?sequence='+seekNumber,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  
                  $scope.createView = true;
                  $scope.modifyQuestionView = true;

                  $scope.modifyQuestionData = response.data;
                  $scope.isPhotoAttached = $scope.modifyQuestionData.url != "";
                  $scope.isPhotoAttachedSolution = $scope.modifyQuestionData.solutionURL != "";

                  $scope.modifyQuestionData.pyqYear == 0 ? $scope.modifyQuestionData.pyqYear = "" : $scope.modifyQuestionData.pyqYear;

                  $scope.currentQuestionSequence = parseInt(response.data.sequenceNumber);
                  $scope.grandTotalQuestions = parseInt(response.data.totalQuestions);

                  //Update URL param
                  const url = new URL(window.location);
                  url.searchParams.set("modifyId", $scope.modifyQuestionData.id);
                  window.history.pushState({}, '', url);
                } else {
                  $scope.modifyQuestionData = {};
                }
            });
      }


      $scope.customNumberUserInput = '';
      $scope.seekCustomSequenceNumber = function(number) {
          if ($scope.seekTimeout) {
              $timeout.cancel($scope.seekTimeout);
          }

          $scope.seekTimeout = $timeout(function() {
              $scope.customNumberUserInput = '';
              $scope.seekQuestionBySequenceNumber(number);
          }, 1000);
      };

      $scope.seekCustomQuestionNumber = function(number) {
          if ($scope.seekTimeout) {
              $timeout.cancel($scope.seekTimeout);
          }

          $scope.seekTimeout = $timeout(function() {
              $scope.customNumberUserInput = '';
              $scope.modifyQuestion(number);
          }, 1000);
      };

      

      $scope.seekPreviousQuestion = function() {
          var previous_sequence = $scope.currentQuestionSequence - 1;
          if(previous_sequence < 1)
            previous_sequence = 1;
          $scope.seekQuestionBySequenceNumber(previous_sequence);
      }

      $scope.seekNextQuestion = function() {
          var next_sequence = $scope.currentQuestionSequence + 1;
          if(next_sequence > $scope.grandTotalQuestions)
            next_sequence = $scope.grandTotalQuestions;
          $scope.seekQuestionBySequenceNumber(next_sequence);
      }



      $scope.setQuestionLevel = function(modifyQuestionData, level) {
        if($scope.modifyQuestionData.level == level)
          $scope.modifyQuestionData.level = '';
        else
          $scope.modifyQuestionData.level = level;
      }

      $scope.setQuestionAnswer = function(modifyQuestionData, answer) {
          $scope.modifyQuestionData.answer = answer;
      }

      $scope.getPYQLabelClass = function(level) {
        if(level == "Easy")
          return "label-success";
        else if(level == "Medium")
          return "label-warning";
        else if(level == "Hard")
          return "label-danger";
      }

      $scope.setQuestionPYQType = function(modifyQuestionData, type) {
        $scope.modifyQuestionData.pyqType = type;
      }

      $scope.removeChallengeOnQuestion = function(modifyQuestionData) {
        if($scope.modifyQuestionData.challenged) {
          $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/reset-challenge.php?id='+modifyQuestionData.id,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.challenged = false;
                  $scope.showToaster("Challenge has been removed");
                }
            });
        }
      }

      $scope.toggleVerifiedStatus = function(modifyQuestionData) {
        const verified_flag = !modifyQuestionData.verified;
        const verified_number = verified_flag ? 1 : 0;
        
        $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/update-verified.php?id='+modifyQuestionData.id+'&verified='+verified_number,
              headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.verified = verified_flag;
                  
                  if($scope.modifyQuestionData.verified)
                    $scope.showToaster("The Question has been marked as Verified");
                  else
                    $scope.showToaster("The Question is NOT Verified now");
                }
            });
      }


      $scope.showToasterError = function(message) {
        $scope.showToaster('<b style="color: #ff887f">ERROR</b> '+message);
      }


      $scope.toasterVisible = false;
      $scope.toasterMessage = "";

      $scope.showToaster = function(message) {
          $scope.toasterMessage = $sce.trustAsHtml(message);
          $scope.toasterVisible = true;

          $scope.$applyAsync();

          setTimeout(function() {
              $scope.toasterVisible = false;
              $scope.$apply();
          }, 3000);
      };



      //Seek Questions

      $scope.goLeft = function() {
        $scope.currentPage--;
        if($scope.currentPage < 1)
          $scope.currentPage = 1;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }

      $scope.goRight = function() {
        $scope.currentPage++;
        if($scope.currentPage > $scope.totalPages)
          $scope.currentPage = $scope.totalPages;
        localStorage.setItem("currentPageQuestionBankListing", $scope.currentPage);

        if(localStorage.getItem("filterAppliedForQuestionBankListing") != "")
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, localStorage.getItem("filterAppliedForQuestionBankListing"));
        else
          $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
      }



      $scope.questionBankFilterApplied = "";
      $scope.quickFilterQuestionBank = function(type) {
          $scope.currentPage = 1;
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", type);
          $scope.filterAllQuestions($scope.currentPage, $scope.maxResultsShown, type);
          $scope.questionBankFilterApplied = type;
      }

      $scope.removeFilterOnQuestionBank = function() {
          $scope.questionBankFilterApplied = "";
          localStorage.setItem("currentPageQuestionBankListing", 1);
          localStorage.setItem("filterAppliedForQuestionBankListing", "");
          $scope.currentPage = 1;
          $scope.listDefaultQuestions();
      }


      $scope.autoSwitching = localStorage.getItem("autoSwitchReviewingQuestions") == 1 ? true : false;

      $scope.updateAutoSwitching = function() {
        $scope.autoSwitching = !$scope.autoSwitching;
        localStorage.setItem("autoSwitchReviewingQuestions", $scope.autoSwitching ? 1 : 0);
      }

      function cleanUpSolutionPath(url) {
          if(!url)
            return "";
          return url.replace('#toolbar=0&navpanes=0&view=Fit', "");
      }

      //Save Modified Question
      $scope.saveModifiedQuestion = function(updatedData, verified) {
            var questionId = updatedData.id;
            var data = {
              "answer": updatedData.answer,
              "chapter": updatedData.chapter,
              "level": updatedData.level,
              "pyqType": updatedData.pyqType,
              "pyqYear": updatedData.pyqYear,
              "solutionPath": cleanUpSolutionPath(updatedData.solutionStorePath),
              "averageTime": updatedData.averageTimeTaken,
              "verified": verified
            }

            $http({
              method  : 'POST',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/update-question-details.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.verified = verified;
                  $scope.showToaster("Successfully updated the question");

                  if(verified && localStorage.getItem("autoSwitchReviewingQuestions") == 1) {
                    $scope.seekNextQuestion(); //Auto Switching
                  }

                } else {
                  $scope.showToasterError("Failed to save the details");
                }
            });  
      }

      $scope.saveOnly = function(modifiedData) {
        $scope.saveModifiedQuestion(modifiedData, false)
      }

      $scope.saveAndVerify = function(modifiedData) {
        $scope.saveModifiedQuestion(modifiedData, true)
      }


      
      //Image Cropper - QUESTION
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
              minCropBoxWidth: 1200,
              autoCropArea: 0.9,
              scalable: false,
              ready: function () {
                // Strict mode: set crop box data first
                $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
              }});           
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
      $scope.saveAttachment = function(questionId){
          $scope.isPhotoAttached = true;   
          $scope.canvasData = $scope.cropper.getCroppedCanvas({
            width: 1800,
            height: 540,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
          });
          
          $scope.myPhotoURL = $scope.canvasData.toDataURL();
          $scope.cropper.destroy();
          $('#imageModal').modal('hide');

          $scope.updateQuestionImage($scope.myPhotoURL, questionId);
      }


      $scope.updateQuestionImage = function(image, questionId) {
            var data = {
              "image" : image
            }
            $http({
              method  : 'POST',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/update-question-image.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.url = image;
                  $scope.canvasData.destroy();
                } else {
                  $scope.showToaster("Question failed to update");
                }
            });        
      }

      $scope.removeSolutionImage = function(questionId) {
            $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/remove-solution-image.php?id='+questionId,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = "";
                  $scope.isPhotoAttachedSolution = false;
                } else {
                  $scope.showToaster("Question failed to update");
                }
            });        
      }

      //Image Cropper - SOLUTION
      $scope.myImageSolution = '';
      $scope.myCroppedImageSolution = '';
      
      var imageSolution = "";
      $scope.cropBoxDataSolution;
      $scope.canvasDataSolution;
      $scope.cropperSolution;
  
      var handleFileSelectSolution = function(evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
          $scope.$apply(function($scope){
            $scope.myImageSolution = evt.target.result;
            setTimeout(function(){ 
              imageSolution = document.getElementById('imageSolution');
              $scope.cropperSolution = new Cropper(imageSolution, {
              minCropBoxWidth: 1200,
              autoCropArea: 0.9,
              scalable: false,
              ready: function () {
                // Strict mode: set crop box data first
                $scope.cropper.setCropBoxData($scope.cropBoxData).setCanvasData($scope.canvasData);
              }});           
            }, 1000);
            
            $scope.photoLoadedToFrameSolution = true;
          });
        };
        
        reader.readAsDataURL(file);
      };
      
      angular.element(document.querySelector('#fileInputSolution')).on('change', handleFileSelectSolution);
      
      $scope.attachPhotoSolution = function(){
        $('#imageModalSolution').modal('show');   
        $scope.photoLoadedToFrameSolution = false;  
      }

      $scope.removePhotoSolution = function(){
        $scope.isPhotoAttachedSolution = false;
        $scope.myPhotoURLSolution = '';
      }
        
      $scope.isPhotoAttachedSolution = false;
      $scope.saveAttachmentSolution = function(questionId){
          $scope.isPhotoAttachedSolution = true;   
          $scope.canvasDataSolution = $scope.cropperSolution.getCroppedCanvas({
            width: 1200,
            height: 540,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
          });
          
          $scope.myPhotoURLSolution = $scope.canvasDataSolution.toDataURL();
          $scope.cropperSolution.destroy();
          $('#imageModalSolution').modal('hide');

          $scope.updateSolutionImage($scope.myPhotoURLSolution, questionId);
      }


      $scope.updateSolutionImage = function(image, questionId) {
            var data = {
              "image" : image
            }
            $http({
              method  : 'POST',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/update-solution-image.php?id='+questionId,
              data    : data,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = image;
                  $scope.canvasDataSolution.destroy();
                } else {
                  $scope.showToaster("Solution failed to update");
                }
            });        
      }


      //Remove Solution Image
      $scope.removePhotoSolution = function(questionId) {
            $http({
              method  : 'GET',
              url     : 'https://crisprtech.app/crispr-apis/restricted/question-bank/reset-solution-image.php?id='+questionId,
              headers : {
                'Content-Type': 'application/json',
                'x-access-token': $cookies.get("vegaPilotAdminToken")
              }
             })
             .then(function(response) {
                if(response.data.status == "success"){
                  $scope.modifyQuestionData.solutionURL = "";
                } else {
                  $scope.showToaster("Solution was not reset");
                }
            });        
      }


      //Paste Solution
      $scope.pasteSolutionURL = function() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function(text) {
                $scope.$apply(function() {
                    $scope.modifyQuestionData.solutionStorePath = text + "#toolbar=0&navpanes=0&view=Fit";
                });
            }).catch(function(err) {
            });
        }
      };

      $scope.getTrustedUrl = function(url) {
        return $sce.trustAsResourceUrl(url);
      };


      $scope.copyToClipboard = function(text, $event) {
          navigator.clipboard.writeText(text).then(() => {
              const button = angular.element($event.currentTarget);
              const message = button[0].querySelector('.copiedMessage');
              if (message) {
                  message.style.display = 'inline';
                  $timeout(() => {
                      message.style.display = 'none';
                  }, 1000);
              }
          }).catch(err => {
          });
      };

      $scope.viewQuestionPhoto = function(img){
        $('#questionPreviewModal').modal('show'); 
        $scope.currentQuestionImage = img;  
      }


      $scope.listDefaultQuestions = function() {
          const urlParams = new URLSearchParams(window.location.search);
          const modifyId = urlParams.get('modifyId');
          if(modifyId && modifyId > 0) { //if "modifyId = 1" is found in URL
            $scope.modifyQuestion(modifyId);
          } else { //load listing table
            $scope.listQuestions($scope.currentPage, $scope.maxResultsShown);
          }
      }

      //Starting Method
      $scope.listDefaultQuestions();

});