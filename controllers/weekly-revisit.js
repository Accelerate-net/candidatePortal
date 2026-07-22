angular.module('WeeklyRevisitApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('weeklyRevisitController', function($scope, $http, $interval, $cookies, $sce) {

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

    function getUserTokenRaw() {
        return $cookies.get("crispriteUserToken");
    }

    //Render endpoints for weekly exam (quiz) questions and solutions.
    //These are loaded as <img> so auth is passed via a URL-encoded token query param instead of a header.
    var QUESTION_RENDER_URL = 'https://crisprtech.app/crispr-apis/user/quiz/render-question.php?id=';
    var SOLUTION_RENDER_URL = 'https://crisprtech.app/crispr-apis/user/quiz/render-quiz-solution.php?id=';

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


    //Build a {sectionNumber: [sectionName, totalQuestions]} map from the report sections
    var sectionData = {};
    function buildSectionData() {
        sectionData = {};
        var sections = ($scope.reportData && $scope.reportData.sectionWiseResponse) || [];
        sections.forEach(function(section, idx) {
            sectionData[idx + 1] = [section.sectionName, (section.questions || []).length];
        });
    }

    function getSectionByNumber(sectionId) {
        var sections = ($scope.reportData && $scope.reportData.sectionWiseResponse) || [];
        return sections[sectionId - 1];
    }

    function findQuestionByOrder(section, questionId) {
        var questions = (section && section.questions) || [];
        for (var i = 0; i < questions.length; i++) {
            if (questions[i].order == questionId) {
                return questions[i];
            }
        }
        return null;
    }


    //Fetch the weekly exam report once to get the section/question structure
    $scope.reportData = null;
    $scope.questionDetailsFound = false;
    $scope.questionDetails = {};
    $scope.fetchQuizReport = function() {
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/quiz/quiz-report.php?id=' + getAttemptId(),
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.reportData = response.data.data;
                buildSectionData();
                $scope.openQuestion(getCurrentSection(), getCurrentQuestion()); //Open the requested (or first) question
            } else {
                $scope.questionDetailsFound = false;
            }
        });
    }


    $scope.openQuestion = function(sectionId, questionId) {
        if(!$scope.reportData) return;

        updateSectionNumber(sectionId);
        updateQuestionNumber(questionId);

        var section = getSectionByNumber(sectionId);
        var question = findQuestionByOrder(section, questionId);

        if(!question) {
            $scope.questionDetailsFound = false;
            return;
        }

        var tokenParam = '&token=' + encodeURIComponent(getUserTokenRaw());

        $scope.questionDetails = {
            sectionData: sectionData,
            questionURL: QUESTION_RENDER_URL + question.qi + tokenParam,
            solutionURL: SOLUTION_RENDER_URL + question.qi + tokenParam,
            answer: question.answer,
            attempt: question.attempt,
            topic: '',
            chapter: '',
            level: ''
        };

        $scope.currentQuestion = questionId;
        $scope.currentSection = sectionId;

        $scope.questionDetailsFound = true;
    }

    $scope.loadSection = function(currentSection) {
        $scope.openQuestion(currentSection, 1);
    }

    $scope.currentQuestionSequence = function() {
        return getCurrentQuestion();
    }

    $scope.grandTotalQuestions = function() {
        return $scope.questionDetails.sectionData[getCurrentSection()][1];
    }

    $scope.getCurrentSectionName = function() {
        return $scope.questionDetails.sectionData[getCurrentSection()][0];
    }

    $scope.fetchQuizReport(); //Kick off: load report, then open first question of first section by default


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
