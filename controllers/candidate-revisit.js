angular.module('CandidateRevisitApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateRevisitController', function($scope, $http, $interval, $cookies) {

    //Check if logged in
    if($cookies.get("crispriteUserToken")){
      $scope.isLoggedIn = true;
    }
    else{
      $scope.isLoggedIn = false;
      window.location = "index.html";
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

    function getAttemptId() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('attemptId'), 10);
    }

    function updateSectionNumber(sectionNumber) {
        const url = new URL(window.location);
        url.searchParams.set("section", sectionNumber);
        window.history.replaceState({}, '', url);
    }

    function updateQuestionNumber(questionNumber) {
        const url = new URL(window.location);
        url.searchParams.set("question", questionNumber);
        window.history.replaceState({}, '', url);
    }

    function getCurrentSection() {
        const urlParams = new URLSearchParams(window.location.search);
        let currentSection = parseInt(urlParams.get('section'), 10);

        if (isNaN(currentSection) || currentSection < 1) {
            currentSection = 1;
            updateSectionNumber(1);
        }

        return currentSection;
    }

    function getCurrentQuestion() {
        const urlParams = new URLSearchParams(window.location.search);
        let currentQuestion = parseInt(urlParams.get('question'), 10);

        if (isNaN(currentQuestion) || currentQuestion < 1) {
            currentQuestion = 1;
            updateQuestionNumber(1);
        }

        return currentQuestion;
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

        updateSectionNumber(sectionId);
        updateQuestionNumber(questionId);

    	var data = {
		    "id": getAttemptId(),
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

    $scope.loadSection = function(currentSection) {
        $scope.openQuestion(currentSection, 1);
    }

    $scope.currentQuestionSequence = function() {
        return getCurrentQuestion();
    } 

    $scope.grandTotalQuestions = function() {
        return $scope.questionDetails.sectionData[getCurrentSection()][1];;
    }

    $scope.getCurrentSectionName = function() {
        return $scope.questionDetails.sectionData[getCurrentSection()][0];;
    }

    $scope.openQuestion(getCurrentSection(), getCurrentQuestion()); //Open first question of first section by default


    $scope.seekPreviousQuestion = function() {
        var currentSection = getCurrentSection();
        var currentQuestion = getCurrentQuestion();

        var nextQuestion = currentQuestion - 1;
        var nextSection = currentSection;
        if(nextQuestion < 1 && currentSection != 1) { //not the first section
            nextQuestion = $scope.questionDetails.sectionData[currentSection - 1][1]; //total questions in prev sec.
            nextSection--;
        } else if (nextQuestion < 1 && currentSection == 1) {
            nextQuestion = 1;
        }

    	$scope.openQuestion(nextSection, nextQuestion);
    }

    $scope.seekNextQuestion = function() {
        var currentSection = getCurrentSection();
        var currentQuestion = getCurrentQuestion();

        var nextQuestion = currentQuestion + 1;
        var nextSection = currentSection;
        if(nextQuestion > $scope.questionDetails.sectionData[currentSection][1]) { //greater than last question in current section, move sec.
            nextQuestion = 1;
            nextSection++;

            if (nextSection > Object.keys($scope.questionDetails.sectionData).length) { //set back to last question of last sec.
                nextSection = Object.keys($scope.questionDetails.sectionData).length;
                nextQuestion = $scope.questionDetails.sectionData[currentSection][1]; 
            }
        }


    	$scope.openQuestion(nextSection, nextQuestion);
    }


    $scope.moveSectionLeft = function() {
        var currentSection = getCurrentSection();
        currentSection--;

        if (currentSection < 1) {
            currentSection = 1;
        }

        $scope.loadSection(currentSection);

        // Auto-scroll without Y-axis movement
        setTimeout(() => {
            let container = document.querySelector(".sectionSeekerContainer");
            let activeButton = container?.querySelector(".questionSectionButtonActive");

            if (activeButton) {
                activeButton.scrollIntoView({ 
                    behavior: "smooth", 
                    inline: "center",  
                    block: "nearest"  
                });
            }
        }, 100);
    };


    $scope.moveSectionRight = function() {
        var currentSection = getCurrentSection();
        currentSection++;

        if (currentSection > Object.keys($scope.questionDetails.sectionData).length) {
            currentSection = Object.keys($scope.questionDetails.sectionData).length;
        }

        $scope.loadSection(currentSection);

        // Auto-scroll without Y-axis movement
        setTimeout(() => {
            let container = document.querySelector(".sectionSeekerContainer");
            let activeButton = container?.querySelector(".questionSectionButtonActive");

            if (activeButton) {
                activeButton.scrollIntoView({ 
                    behavior: "smooth", 
                    inline: "center",  // Ensures horizontal centering
                    block: "nearest"   // Prevents unnecessary vertical scrolling
                });
            }
        }, 100);
    };

    $scope.isActiveSection = function(sectionId) {
        return getCurrentSection() == sectionId;
    }


});