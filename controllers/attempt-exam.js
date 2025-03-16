angular.module('attemptExamApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('attemptExamController', function($scope, $http, $interval, $cookies, $timeout) {

    const ANSWER_MODES = Object.freeze({
        NOT_VISITED: 0,
        NOT_ANSWERED: 1,
        FOR_REVIEW: 2,
        ANSWERED_FOR_REVIEW: 3,
        ANSWERED: 4
    });

    function getUserToken() {
        return "Bearer sgMhRElheLU5okMdUMXb7avSlbV8rB0GUqYrz3/HZjzce4kfKC6aObBFbBJ3Tw16y+yUMZ110w6RFTtvF3ySubvurgOrZG2dAwgDtLa7cCRN+ctxa+hXoH4MVCe81yHF";
        //$cookies.get("vegaPilotAdminToken")
    }

    function getExamTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return decodeURIComponent(urlParams.get('exam'));
    }

    //Defaults
    $scope.examDetails = {};
    $scope.examMetadata = {};
    $scope.sectionDetails = [];
    $scope.currentSection = {};
    $scope.questionsInSection = [];
    $scope.displayingQuestion = {};

    //Preferences
    $scope.criprInsightsEnabled = localStorage.getItem("criprInsightsEnabled") ? localStorage.getItem("criprInsightsEnabled") == 1 : false;
    $scope.currentQuestionTimePercentageLapsed = 0;
    $scope.currentQuestionAnswered = false;

    $scope.toggleCrisprInsights = function() {
        var toggleValue = localStorage.getItem("criprInsightsEnabled") ? localStorage.getItem("criprInsightsEnabled") == 1 : false;
        $scope.criprInsightsEnabled = !toggleValue;
        localStorage.setItem("criprInsightsEnabled", $scope.criprInsightsEnabled ? 1 : 0);
    }



    $scope.updateSectionNamesList = function(examData) {
        $scope.sectionDetails = Object.values(examData).map(section => section.name);
    }

    $scope.loadSection2 = function(data) {
        console.log(data)
    }

    $scope.isActiveSection = function(sectionId) {
        return localStorage.getItem("currentSectionOpen") == sectionId;
    }

    function formatTimer(time) {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;

        minutes = String(minutes).padStart(2, '0');
        seconds = String(seconds).padStart(2, '0');
        
        return `${minutes}:${seconds}`;
    }


    $scope.trackIndividualQuestionTime = function() {
        $scope.currentQuestionKey = $scope.displayingQuestion.questionDisplayKey;
        var currentStampData = localStorage.getItem("questionTimeTracker") ? JSON.parse(localStorage.getItem("questionTimeTracker")) : {};
        if(currentStampData[$scope.currentQuestionKey]) {
            currentStampData[$scope.currentQuestionKey]++;
        } else {
            currentStampData[$scope.currentQuestionKey] = 1;
        }
        localStorage.setItem("questionTimeTracker", JSON.stringify(currentStampData));
        document.getElementById("currentQuestionTimer").innerHTML = '<i class="ti ti-timer" style="margin-right: 6px"></i>'+formatTimer(currentStampData[$scope.currentQuestionKey]);
    }


    //Open first section by default
    if(!localStorage.getItem("currentSectionOpen"))
        localStorage.setItem("currentSectionOpen", 1);

    $scope.displayQuestionFromSection = function(sectionId, questionId) {
        $scope.questionsInSection = $scope.examDetails[sectionId].questions;
        $scope.displayingQuestion = $scope.questionsInSection[questionId];
        $scope.displayingQuestion.number = questionId;
        $scope.displayingQuestion.sectionId = sectionId;

        $scope.displayingQuestion.answer = $scope.findAlreadySubmittedAnswer($scope.displayingQuestion.questionDisplayKey);
    }

    $scope.saveAndNext = function(currentSectionId, currentQuestionId, currentQuestionKey, answerOpted) {

        //Make it dynamic
        if(answerOpted != '' && answerOpted != 'A' && answerOpted != 'B' && answerOpted != 'C' && answerOpted != 'D') {
            return;
        }

        $scope.processAnswerSubmission(currentQuestionKey, answerOpted);

        var nextSection, nextQuestion;
        var numberOfQuestionsInCurrentSection = Object.keys($scope.examDetails[currentSectionId].questions).length;
        
        if(currentQuestionId == numberOfQuestionsInCurrentSection) { //Move to next section
            nextSection = parseInt(currentSectionId) + 1;

            var totalSections = parseInt($scope.examMetadata.numberOfSections);
            if(nextSection > totalSections) //End of exam
                return;


            $scope.loadSection(nextSection);
            return;
        } else {
            nextSection = currentSectionId;
            nextQuestion = parseInt(currentQuestionId) + 1
        }

        $scope.loadSectionWithQuestion(nextSection, nextQuestion);
    }

    $scope.loadSectionWithQuestion = function(sectionId, questionId) {
        $scope.currentSection = $scope.examDetails[sectionId];
        if(!$scope.currentSection) {
            $scope.loadSectionWithQuestion(1,1);
            return;
        }
        $scope.currentSection.id = sectionId;

        $scope.questionsInSection = $scope.currentSection.questions;
        if(!$scope.questionsInSection || !$scope.questionsInSection[questionId]) {
            $scope.loadSectionWithQuestion(1,1);
            return;
        }

        $scope.markQuestionAsVisited($scope.questionsInSection[questionId].questionDisplayKey);

        localStorage.setItem("currentSectionOpen", sectionId);

        $scope.displayQuestionFromSection(sectionId, questionId); //First question of the section

        //Update URL param
        const url = new URL(window.location);
        url.searchParams.set("section", sectionId);
        url.searchParams.set("question", questionId);
        window.history.pushState({}, '', url);
    }

    $scope.loadSection = function(sectionId) {
        $scope.loadSectionWithQuestion(sectionId, 1); //First question of the section
    }

    $scope.moveSectionLeft = function() {
        var currentSection = localStorage.getItem("currentSectionOpen") ? localStorage.getItem("currentSectionOpen") : 1;
        currentSection--;

        if(currentSection < 1)
            currentSection = 1;
        $scope.loadSection(currentSection);
    }

    $scope.moveSectionRight = function() {
        var currentSection = localStorage.getItem("currentSectionOpen") ? localStorage.getItem("currentSectionOpen") : 1;
        currentSection++;

        if(currentSection > $scope.sectionDetails.length)
            currentSection = $scope.sectionDetails.length;
        $scope.loadSection(currentSection);
    }


    $scope.initialiseExam = function(){
        var data = {
            token : getExamTokenFromURL()
        }
        $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/user/fetch-exam.php',
          data    :  data,
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.examDetails = response.data.data;
                $scope.examDetailsFound = true;
                $scope.examMetadata = response.data.metadata;

                $scope.updateSectionNamesList($scope.examDetails);

                //Check if viewing specific question (refresh cases)
                const urlParams = new URLSearchParams(window.location.search);
                var sectionId = decodeURIComponent(urlParams.get('section'));
                if(!sectionId) sectionId = 1;

                var questionId = decodeURIComponent(urlParams.get('question'));
                if(!questionId) questionId = 1;

                $scope.loadSectionWithQuestion(sectionId, questionId);
                //$scope.answerDisplayContentRefresh();

                //Start Exam Timer
                const totalTimeRemaining = $scope.examMetadata.endTime - $scope.examMetadata.currentTime;
                const display = document.querySelector('#timerCountDown');
                $scope.startTimer(totalTimeRemaining, display);

            } else {
                $scope.examDetailsFound = false;
                document.getElementById("examErrorBanner").style.display = 'flex';
            }
        });
      }

    $scope.initialiseExam();


    //Question level progress tracker
    $scope.getProgressBarClass = function() {
        if (!$scope.currentQuestionAnswered) {
            if ($scope.currentQuestionTimePercentageLapsed <= 60) {
                return 'progress-bar-success';
            } else if ($scope.currentQuestionTimePercentageLapsed >= 90) {
                return 'progress-bar-danger';
            } else {
                return 'progress-bar-warning';
            }
        }
        
        return '';
    };

    $scope.$watchGroup([
      'currentQuestionTimePercentageLapsed',
      'currentQuestionTimeLapsed',
      'currentQuestionAnswered'
    ], function() {
        $scope.progressBarClass = $scope.getProgressBarClass();
    });


    //Force Submite the Exam
    $scope.forceSubmitExam = function() {
        alert('Exam has been ended')
    }

    $scope.findAlreadySubmittedAnswer = function(questionKey) {
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        if(examSubmissionData[questionKey]) {
            var questionSubmission = examSubmissionData[questionKey];
            return questionSubmission.a;
        }
    }


    /***
     * "t" -> 0: Not Answered / 1: For Review Only / 2: Answered And Review / 3: Answered
    ***/
    $scope.processAnswerSubmission = function(questionKey, answerOpted) {
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        examSubmissionData[questionKey] = {
            "t": answerOpted == '' ? ANSWER_MODES.NOT_ANSWERED : ANSWER_MODES.ANSWERED,
            "a": answerOpted
        }
        localStorage.setItem("examSubmissionData", JSON.stringify(examSubmissionData));
        $scope.answerDisplayContentRefresh();
    }


    //Questions Listing - Answered Questions
    $scope.answerDisplayContent = {};
    $scope.answerDisplayContentRefresh = function() {
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        var questions = $scope.examDetails[1].questions;

        for (const key in questions) {
            const questionDisplayKey = questions[key].questionDisplayKey;
            if (!examSubmissionData.hasOwnProperty(questionDisplayKey)) {
                examSubmissionData[questionDisplayKey] = { t: 0, a: "" };
            }
        }

        $scope.answerDisplayContent = examSubmissionData;
    }

    $scope.answerDisplaySummaryMatric = function(type) {
        const counts = {};
        Object.values($scope.answerDisplayContent).forEach(item => {
            const tValue = item.t;
            counts[tValue] = (counts[tValue] || 0) + 1;
        });

        for (let i = 0; i <= 4; i++) {
            counts[i] = counts[i] || 0;
        }

        return counts[type];
    }


    $scope.markQuestionAsVisited = function(questionKey) {
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        if(!examSubmissionData[questionKey] || examSubmissionData[questionKey].t == 0) {
            examSubmissionData[questionKey] = {
                "t": ANSWER_MODES.NOT_ANSWERED,
                "a": ""
            }
        }
        localStorage.setItem("examSubmissionData", JSON.stringify(examSubmissionData));
        $scope.answerDisplayContentRefresh();
    }

    $scope.markForReviewAndNext = function(currentSectionId, currentQuestionId, questionKey, answerOpted) {
        //Make it dynamic
        var answerRightly = true;
        if(answerOpted != 'A' && answerOpted != 'B' && answerOpted != 'C' && answerOpted != 'D') {
            answerRightly = false;
            answerOpted = "";
        }

        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        if(examSubmissionData[questionKey]) {
            examSubmissionData[questionKey] = {
                "t": answerRightly ? ANSWER_MODES.ANSWERED_FOR_REVIEW : ANSWER_MODES.FOR_REVIEW,
                "a": answerOpted
            }
        }
        localStorage.setItem("examSubmissionData", JSON.stringify(examSubmissionData));
        $scope.answerDisplayContentRefresh();

        var nextSection, nextQuestion;
        var numberOfQuestionsInCurrentSection = Object.keys($scope.examDetails[currentSectionId].questions).length;
        
        if(currentQuestionId == numberOfQuestionsInCurrentSection) { //Move to next section
            nextSection = parseInt(currentSectionId) + 1;

            var totalSections = parseInt($scope.examMetadata.numberOfSections);
            if(nextSection > totalSections) //End of exam
                return;


            $scope.loadSection(nextSection);
            return;
        } else {
            nextSection = currentSectionId;
            nextQuestion = parseInt(currentQuestionId) + 1
        }

        $scope.loadSectionWithQuestion(nextSection, nextQuestion);
    }


    $scope.submitCurrentQuestionAnswer = function(questionKey, answerOpted) {
        $scope.displayingQuestion.answer = answerOpted;
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        if(!examSubmissionData[questionKey] || examSubmissionData[questionKey].t == 0) {
            examSubmissionData[questionKey] = {
                "t": ANSWER_MODES.ANSWERED,
                "a": answerOpted
            }
        }
        localStorage.setItem("examSubmissionData", JSON.stringify(examSubmissionData));
        $scope.answerDisplayContentRefresh();  
    }

    $scope.clearResponseForQuestion = function(questionKey) {
        $scope.displayingQuestion.answer = '';
        var examSubmissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        if(examSubmissionData[questionKey]) {
            examSubmissionData[questionKey] = {
                "t": ANSWER_MODES.NOT_ANSWERED,
                "a": ''
            }
        }
        localStorage.setItem("examSubmissionData", JSON.stringify(examSubmissionData));
        $scope.answerDisplayContentRefresh();  
    }

    // $scope.getAnswerDisplayButton = function(questionKey) {
    //     const statusMap = {
    //         0: "notVisited",
    //         1: "questionNotAnswered",
    //         2: "markedForRevew",
    //         3: "answeredAndMarkedForRevew",
    //         4: "questionAnswered"
    //     };

    //     const status = $scope.answerDisplayContent?.[questionKey]?.t;
    //     return statusMap[status] || "notVisited";
    // };

    $scope.getAnswerDisplayButton = function(questionKey) {
        const statusMap = {
            0: "notVisited",
            1: "questionNotAnswered",
            2: "markedForRevew",
            3: "answeredAndMarkedForRevew",
            4: "questionAnswered"
        };

        const question = $scope.answerDisplayContent?.[questionKey];

        if (!question) return "notVisited";

        if (question.t === 2 || (question.t === 3 && question.a === "")) {
            return "markedForRevew";
        }

        return statusMap[question.t] || "notVisited";
    };



    // EXAM COUNT DOWN
    $scope.startTimer = function(duration, display) {
        let timer = duration, hours, minutes, seconds;
        const hoursSpan = display.querySelector('.hours');
        const minutesSpan = display.querySelector('.minutes');
        const secondsSpan = display.querySelector('.seconds');
        const colons = display.querySelectorAll('.blink');
        
        var intervalPromise = $interval(function() {
            //Calculate Current Questions Progress
            $scope.currentQuestionKey = $scope.displayingQuestion.questionDisplayKey;
            var currentStampData = localStorage.getItem("questionTimeTracker") ? JSON.parse(localStorage.getItem("questionTimeTracker")) : {};
            var timeSpentOnQuestion = currentStampData[$scope.currentQuestionKey];
            var percentage = ((timeSpentOnQuestion / $scope.displayingQuestion.averageTimeToSolveProblem) * 100).toFixed(0);
            if(percentage > 100)
                percentage = 100;

            $scope.currentQuestionTimePercentageLapsed = percentage;

            $scope.trackIndividualQuestionTime();


            //Update overall counter
            hours = parseInt(timer / 3600, 10);
            minutes = parseInt((timer % 3600) / 60, 10);
            seconds = parseInt(timer % 60, 10);

            hoursSpan.textContent = hours < 10 ? "0" + hours : hours;
            minutesSpan.textContent = minutes < 10 ? "0" + minutes : minutes;
            secondsSpan.textContent = seconds < 10 ? "0" + seconds : seconds;

            if (--timer < 0) {
                $interval.cancel(intervalPromise);
                hoursSpan.textContent = "00";
                minutesSpan.textContent = "00";
                secondsSpan.textContent = "00";
                $scope.forceSubmitExam(); //Auto Submit
            }

            //Red Timer Alerting
            if(criprInsightsEnabled) {
                if(hours == 0 && minutes < 2) { //less than 1 minute left
                    document.getElementById("timerContainer").classList.add("blinkingRed");
                    document.getElementById("timerContainer").classList.remove("blinkingRedStopped");
                }
                if(hours == 0 && minutes == 0 && seconds < 10) { //less than 10 seconds
                    console.log('remove')
                    document.getElementById("timerContainer").classList.remove("blinkingRed");
                    document.getElementById("timerContainer").classList.add("blinkingRedStopped");
                }
            }

        }, 1000);
    }



    //SUBMIT FINAL

    function combineSubmissionData(submissionData, timeTrackerData) {
        let result = {};
        
        // Process submissionData
        for (let key in submissionData) {
            let { t, a } = submissionData[key];
            
            if ([3, 4].includes(t) && timeTrackerData.hasOwnProperty(key)) {
                result[key] = {
                    ts: timeTrackerData[key],
                    a: a
                };
            }
        }
        
        // Include remaining keys from timeTrackerData
        for (let key in timeTrackerData) {
            if (!result.hasOwnProperty(key)) {
                result[key] = {
                    ts: timeTrackerData[key],
                    a: ""
                };
            }
        }
        
        return result;
    }

    $scope.submitExamFinal = function() {
        var submissionData = localStorage.getItem("examSubmissionData") ? JSON.parse(localStorage.getItem("examSubmissionData")) : {};
        var timeTrackerData = localStorage.getItem("questionTimeTracker") ? JSON.parse(localStorage.getItem("questionTimeTracker")) : {};
        var finalSubmissionData = combineSubmissionData(submissionData, timeTrackerData);
        console.log(JSON.stringify(finalSubmissionData));
    }

    $scope.countdown = 5;
    $scope.countdownElement = document.getElementById("countdown");
    $scope.isSubmitClicked = false;

    $scope.submitExamConfirmation = function() {
        bootbox.confirm({
                title: "<p style='color: red; font-size: 24px; margin: 0; font-weight: bold;'>Confirm Submission</p>",
                message: "<p style='color: #444; font-size: 18px; font-weight: 300; line-height: 28px;'>The exam will be ended immediately if you proceed. Once submitted, you will not able to take the same test in next 48 hours. Do you really want to continue?<br><br><b>Note: If you want, you can take a break,but timer will not pause.</b></p>",
                buttons: {
                    cancel: {
                        label: "Continue Exam",
                        className: "btn-default" // Red button
                    },
                    confirm: {
                        label: "Submit Exam",
                        className: "btn-success"
                    }
                },
                callback: function (result) {
                    if(result) {
                        $scope.countdownElement.textContent = "Submitting";
                        $scope.submitExamFinal();
                    } else {
                        document.getElementById("bootbox-demo-3").classList.remove("active");
                        $scope.countdownElement.textContent = "Submit Exam"
                        $scope.countdown = 5;
                        $scope.isSubmitClicked = false;
                    }
                }
            });
    }

    $scope.getExamConfirmation = function() {

        if($scope.isSubmitClicked)
            return;

        $scope.isSubmitClicked = true;
        document.getElementById("bootbox-demo-3").classList.add("active");

        $scope.startCountdown = function() {
            $scope.countdownElement.textContent = `Submitting in ${$scope.countdown}s`;
            $scope.countdown--;

            // If countdown is greater than 0, call $timeout again
            if ($scope.countdown >= 0) {
                $timeout($scope.startCountdown, 1000);
            } else {
                $scope.countdownElement.textContent = "Confirm Submission";
                $scope.submitExamConfirmation();
            }
        };

        $scope.startCountdown();
    }


});