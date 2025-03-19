angular.module('CandidateDashboardApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateDashboardController', function($scope, $http, $interval, $cookies) {

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
        return "Bearer PMhCPBXEpj6vbAD1P5ZoCr29chAj+YgKpiwO7VEJcn9NN9G+87gpzPaPiJTuKj+8r4xgRdOnmSWA3vuRjNE5fWqX+vRk0Q69ktbOxsm2gjr6sBt2AXPARlPkKuUWrrhLpyvydLN58qhKVb9b2wqOSy6THVfUMCbuWeMb6x4ckpU="
      //return "Bearer " + $cookies.get("crispriteUserToken");  
    }

    function getUserTokenRaw() {
        return $cookies.get("crispriteUserToken");
    }

    //Render Progress Chart
    function renderProgressBarChart(courseList) {
        var filteredData = courseList
            .map((course, index) => ({
                index: index + 1,
                lastScore: course.lastScore ? parseInt((course.lastScore / 100).toFixed(0)) : null,
                lastAttempted: course.lastAttempted
            }))
            .filter(course => course.lastAttempted !== null && !isNaN(course.lastScore))
            .sort((a, b) => new Date(a.lastAttempted) - new Date(b.lastAttempted))
            .map(course => [course.index, course.lastScore]);

        var plot = $.plot($("#testSeriesProgressChart"), [
            { data: filteredData, label: "" }
        ], {
            series: {
                shadowSize: 0,
                lines: {
                    show: false,
                    lineWidth: 0
                },
                points: { show: true },
                splines: {
                    show: true,
                    fill: 0.08,
                    tension: 0.3, // float between 0 and 1, defaults to 0.5
                    lineWidth: 2 // number, defaults to 2
                }
            },
            grid: {
                labelMargin: 8,
                hoverable: true,
                clickable: true,
                borderWidth: 0,
                borderColor: '#fafafa'
            },
            legend: {
                backgroundColor: '#fff',
                margin: 8
            },
            yaxis: {
                min: 0,
                max: 250,
                tickColor: 'transparent',
                font: { color: '#bdbdbd', size: 12 }
            },
            xaxis: {
                tickColor: 'transparent',
                tickDecimals: 0,
                font: { color: '#bfbfbf', size: 12 }
            },
            colors: ['#0a9190', '#80deea'],
            tooltip: true,
            tooltipOpts: {
                content: "Test %x Score: %y"
            }
        });

        let maxIndex = 0;
        let minIndex = 0;

        for (let i = 1; i < filteredData.length; i++) {
            if (filteredData[i][1] > filteredData[maxIndex][1]) {
                maxIndex = i;
            }
            if (filteredData[i][1] < filteredData[minIndex][1]) {
                minIndex = i;
            }
        }

        // Get the actual width of the chart container
        var chartWidth = $("#testSeriesProgressChart").width();

        // Add labels to each data point
        for (var i = 0; i < filteredData.length; i++) {
            var point = filteredData[i];
            var x = point[0]; // Use the x-coordinate of the current point
            var y = point[1]; // Use the y-coordinate of the current point

            // Calculate the position of the label
            var offset = plot.pointOffset({ x: x, y: y });
            var left = offset.left + 5; // Use the offset directly
            var top = offset.top - 5; // Adjust the vertical position

            // Adjust the position for the last label if needed
            if (i == filteredData.length - 1) {
                left = offset.left - 40; // Move the last label slightly to the left
            }

            // Ensure the label stays within the chart's width
            if (left + 50 > chartWidth) { // 50 is an approximate label width
                left = chartWidth - 50; // Adjust to prevent overflow
            }

            // Determine the background color based on the point's value
            var bgColor;
            if (filteredData.length == 1) {
                bgColor = "#fff";
            } else if (i == maxIndex) {
                bgColor = "#d7ffd9";
            } else if (i == minIndex) {
                bgColor = "#ffcdc9";
            } else {
                bgColor = "#fff";
            }

            // Create a div for the label
            var label = $('<div class="data-point-label"></div>')
                .text(y)
                .css({
                    position: 'absolute',
                    left: left + 'px', // Ensure the left position is in pixels
                    top: top + 'px', // Ensure the top position is in pixels
                    backgroundColor: bgColor,
                    padding: '2px 5px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    fontSize: '12px',
                    color: '#333',
                    zIndex: 1000
                })
                .appendTo("#testSeriesProgressChart");
        }
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

    $scope.courseIdOpen;
    $scope.courseNameOpen;
    $scope.courseListing = {};
    $scope.getCourseListingData = function(id) {
        $scope.courseIdOpen = id;
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/test-series-progress.php'+(id ? '?id='+id : ''),
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.courseListing = response.data.data;
                $scope.courseListingFound = true;

                if(!$scope.courseIdOpen && $scope.courseListing && $scope.courseListing.testSeriesEnrolled && $scope.courseListing.testSeriesEnrolled[0]) {
                    $scope.courseIdOpen = $scope.courseListing.testSeriesEnrolled[0].code;
                    $scope.courseNameOpen = $scope.courseListing.testSeriesEnrolled[0].title;
                }

                //Render progress chart if applicable
                if($scope.courseListing && $scope.courseListing.coursesList && $scope.courseListing.coursesList.length > 0) {
                    renderProgressBarChart($scope.courseListing.coursesList);
                }
            } else {
                $scope.courseListingFound = false;
            }
        });      
    }

    $scope.getCourseListingData();

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
    $scope.attemptExam = function(examKey, seriesKey) {

        var data = {
            "exam": examKey,
            "series": seriesKey
        }

        $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/user/start-exam.php',
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          },
          data    : data
         })
         .then(function(response) {
            if(response.data.status == "success"){
                var redirectURL = "https://portal2.crisprlearning.com/attempt.html?exam=" + encodeURIComponent(response.data.data.examToken) + "&user=" + encodeURIComponent(getUserTokenRaw());
                if(response.data.data.uniqueExamURL)
                    redirectURL = response.data.data.uniqueExamURL;

                window.open(redirectURL, "_blank");
            } else {
                $scope.showToaster(response.data.message);
            }
        });
    }

    //view last attempt report
    $scope.viewLastReport = function(attemptId) {
        var redirectURL = "https://candidate.crisprlearning.com/report.html?attemptId="+attemptId;
        window.location.href = redirectURL;
    }

    //Go to Purchasing of the course
    $scope.goToPurchaseLink = function(testSeriesCode) {
        window.open("https://candidate.crisprlearning.com/secure-checkout/checkout.html?addItem="+testSeriesCode, "_blank");
    }


    $scope.showToaster = function(message) {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.classList.add('show');

        setTimeout(() => {
            toaster.classList.remove('show');
        }, 3000);
    }


});