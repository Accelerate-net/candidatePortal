angular.module('CandidateReportApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateReportController', function($scope, $http, $interval, $cookies) {

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

    function getReportIdPassed() {
        const urlParams = new URLSearchParams(window.location.search);
        return decodeURIComponent(urlParams.get('attemptId'));
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


    function renderSectionWiseStatsBarChart(sectionWiseResponse) {
			var d1 = sectionWiseResponse.map((section, index) => [index + 1, section.sectionSummary.total]);
			var d2 = sectionWiseResponse.map((section, index) => [index + 1, section.sectionSummary.attempted]);
			var d3 = sectionWiseResponse.map((section, index) => [index + 1, section.sectionSummary.correct]);
			var labelData = sectionWiseResponse.map((section, index) => [index + 1, section.sectionName.substring(0, 3)]);

			var ds = new Array();
			ds.push({
			    data: d1,
			    label: "Total Questions",
			    bars: {
			        show: true,
			        barWidth: 0.2, // Increased bar width
			        order: 1,
			        align: "center" // Center bars on X-axis values
			    }
			});
			ds.push({
			    data: d2,
			    label: "Question Attempted",
			    bars: {
			        show: true,
			        barWidth: 0.2, // Increased bar width
			        order: 2,
			        align: "center" // Center bars on X-axis values
			    }
			});
			ds.push({
			    data: d3,
			    label: "Correct Answers",
			    bars: {
			        show: true,
			        barWidth: 0.2, // Increased bar width
			        order: 3,
			        align: "center" // Center bars on X-axis values
			    }
			});

			var variance = $.plot($("#earnings"), ds, {
			    series: {
			        bars: {
			            show: true,
			            fill: 0.5,
			            lineWidth: 2
			        }
			    },
			    grid: {
			        labelMargin: 8,
			        hoverable: true,
			        clickable: true,
			        tickColor: "#fafafa",
			        borderWidth: 0
			    },
			    colors: ["#cfd8dc", "#78909c", "#4caf50"],
			    xaxis: {
			        autoscaleMargin: 0.08,
			        tickColor: "transparent",
			        ticks: labelData,
			        tickDecimals: 0,
			        font: {
			            color: '#bdbdbd',
			            size: 12
			        }
			    },
			    yaxis: {
			        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // No of questions MAX in any session
			        font: {
			            color: '#bdbdbd',
			            size: 12
			        },
			        tickFormatter: function (val, axis) {
			            return val;
			        }
			    },
			    legend: {
			        backgroundColor: '#fff',
			        margin: 8
			    },
			    tooltip: true,
			    tooltipOpts: {
			        content: function (label, xval, yval, flotItem) {
			            // Customize tooltip based on the series label
			            var seriesLabel = flotItem.series.label;
			            if (seriesLabel === "Total Questions") {
			                return "Total Questions: " + yval;
			            } else if (seriesLabel === "Question Attempted") {
			                return "Attempted: " + yval;
			            } else if (seriesLabel === "Correct Answers") {
			                return "Correct: " + yval;
			            }
			            return "Number of Questions: " + yval; // Fallback
			        }
			    }
			});

    }


	function renderSubjectStrengthPieChart(sectionWiseResponse) {
	    // Calculate total score
	    var totalCorrect = sectionWiseResponse.reduce((sum, section) => sum + section.sectionSummary.correct, 0);
	    // Compute section-wise percentage contribution, setting negative values to 0
	    var datax2 = sectionWiseResponse.map(section => {
	        let percentage = totalCorrect > 1 ? (section.sectionSummary.correct / totalCorrect) * 100 : 0;
	        percentage = Math.max(0, percentage).toFixed(2); // If negative, set to 0
	        return {
	            label: section.sectionName,
	            data: percentage,
	            color: Utility.getBrandColor(
	                section.sectionName === "Physics" ? "danger" :
	                section.sectionName === "Chemistry" ? "warning" :
	                section.sectionName === "Mathematics" ? "midnightblue" : "info"
	            )
	        };
	    });

	    // Check if all values are 0
	    var allZero = datax2.every(section => section.data < 1);

	    if (totalCorrect == 0 || allZero) {
	        $("#subjectStrengthPieChart").html("<p style='font-size: 14px; font-weight: 400; color: #c2c2c2; text-align: center;'>You have not scored in any of the Subjects.</p>");
	        return;
	    }

	    // Render DONUT chart
	    $.plot($("#subjectStrengthPieChart"), datax2, {
	        series: {
	            pie: {
	                innerRadius: 0.5,
	                show: true
	            }
	        },
	        legend: {
	            show: false
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s"
	        }
	    });
	}



    $scope.openQuestion = function (questionId) {
		$scope.reportData.sectionWiseResponse.forEach(section => {
		    section.questions.forEach(question => {

		    	if(questionId == question.qi) {
		    		$scope.viewQuestionAndAnswer(question, section.sectionName);
		    		return;
		    	}
		    });
		});    		
    };


    $scope.renderTimeDistributionBarChart = function (sectionWiseResponse) {
	    const barData = [];
	    let sequentialOrder = 1;
	    let maxTimeSpent = 0;
	    const questionIdMap = {}; // Map x-axis positions to questionIds

	    // Process sectionWiseResponse to generate barData
	    sectionWiseResponse.forEach((section, sectionIndex) => {
	        section.questions.forEach((question, questionIndex) => {
	            const { qi, timeSpent, answer, attempt } = question;

	            maxTimeSpent = Math.max(maxTimeSpent, timeSpent);

	            let color = attempt === "" ? "#899fa9" : attempt === answer ? "#4caf50" : "#e51c23";

	            questionIdMap[sequentialOrder] = qi; // Store questionId for x position

	            barData.push({
	                data: [[sequentialOrder, timeSpent]], // [x, y] pair
	                color: color,
	                bars: {
	                    show: true,
	                    lineWidth: 0,
	                    barWidth: 0.75,
	                    fill: 0.4,
	                    fillColor: color
	                }
	            });

	            sequentialOrder++;
	        });
	    });

	    angular.element(document).ready(function () {
	        var plot = $.plot("#realtime-updates", barData, {
	            series: {
	                bars: { show: true, lineWidth: 0, barWidth: 0.75, fill: 0.4 },
	                shadowSize: 0
	            },
	            grid: {
	                labelMargin: 8,
	                hoverable: true,
	                clickable: true, // Enable clicking
	                borderWidth: 0,
	                borderColor: '#f5f5f5'
	            },
	            yaxis: {
	                min: 0,
	                max: maxTimeSpent + 10,
	                ticks: generateTicks(maxTimeSpent),
	                tickColor: '#f5f5f5',
	                font: { color: '#bdbdbd', size: 12 }
	            },
	            xaxis: {
	                show: true,
	                ticks: generateXTicks(sequentialOrder - 1)
	            },
	            tooltip: true,
	            tooltipOpts: {
	                content: function(label, x, y, item) {
	                    const xValue = Math.round(x); // Ensure xValue is an integer
	                    const questionId = questionIdMap[xValue]; // Retrieve question ID
	                    return formatTooltipContent(questionId, xValue, y);
	                }
	            }
	        });

	        // Handle bar click event
	        $("#realtime-updates").bind("plotclick", function (event, pos, item) {
	            console.log("Plot clicked! Event detected.");
	            if (item) {
	                const xValue = Math.round(item.datapoint[0]); // Ensure xValue is an integer
	                const questionId = questionIdMap[xValue]; // Retrieve questionId
	                if (questionId !== undefined) {
	                    $scope.$apply(function () {
	                        $scope.openQuestion(questionId);
	                    });
	                } else {
	                    console.error(`No questionId found for xValue: ${xValue}`);
	                }
	            } else {
	                console.log("No item detected on click.");
	            }
	        });

	        // Debugging: Highlight bars on hover
	        $("#realtime-updates").bind("plothover", function (event, pos, item) {
	            if (item) {
	            }
	        });
	    });

	    // Generate ticks for y-axis with max 10 values
	    function generateTicks(maxValue) {
	        const tickCount = 10; // Limit to 10 ticks
	        const step = Math.ceil(maxValue / tickCount); // Step size for ticks
	        const ticks = [];

	        for (let i = 0; i <= tickCount; i++) {
	            ticks.push([i * step, getMinutes(i * step)]);
	        }

	        // Ensure that the last tick is exactly maxValue
	        if (ticks[ticks.length - 1] !== maxValue) {
	            ticks[ticks.length - 1] = [maxValue, getMinutes(maxValue)];
	        }

	        return ticks;
	    }

	    // Generate x-axis ticks with first, last, and every 5th item
	    function generateXTicks(totalQuestions) {
	        const ticks = [];
	        const step = 5; // Show every 5th item

	        // Add the first item
	        ticks.push([1, 'Q1']); // Assuming questions are labeled like 'Q1', 'Q2', ...
	        
	        // Add every 5th item
	        for (let i = step; i <= totalQuestions; i += step) {
	            ticks.push([i, 'Q' + i]);
	        }

	        // Add the last item
	        if (totalQuestions !== 1 && ticks[ticks.length - 1][0] !== totalQuestions) {
	            ticks.push([totalQuestions, 'Q' + totalQuestions]);
	        }

	        return ticks;
	    }
	};



    function getMinutes(seconds) {
    	if(seconds < 60)
    		return seconds + "s";

	    const minutes = Math.floor(seconds / 60);
	    const remainingSeconds = seconds % 60;
	    
	    const formattedMinutes = String(minutes).padStart(2, '');
	    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

	    return `${formattedMinutes}m ${formattedSeconds}s`;
	}

    function formatTooltipContent(questionId, xValue, y) {
    	return getMinutes(y) + " spent on Qn #" + xValue;
    }

    // Function to generate ticks dynamically
    function generateTicks(maxTimeSpent) {
        const ticks = [0];
        let step = maxTimeSpent > 100 ? 20 : maxTimeSpent > 50 ? 10 : 5;
        for (let i = step; i <= maxTimeSpent + step; i += step) {
            ticks.push(i);
        }
        return ticks;
    }

	function generateXTicks(maxX) {
	    const ticks = [1]; // Always include 1

	    // Add multiples of 5 (but avoid duplicates)
	    for (let i = 5; i < maxX; i += 5) {
	        ticks.push(i);
	    }

	    if (maxX !== 1 && !ticks.includes(maxX)) {
	        ticks.push(maxX); // Ensure the last element is included
	    }

	    return ticks;
	}





	$scope.getSubjectCoverage = function(sectionSummary) {
	    var total = sectionSummary.total;
	    var correct = sectionSummary.correct;
	    var attempted = sectionSummary.attempted;
	    
	    var unattempted = total - attempted;
	    var wrong = attempted - correct;

	    // Compute percentages
	    var correctPercentage = (correct / total) * 100;
	    var wrongPercentage = (wrong / total) * 100;
	    var unattemptedPercentage = 100 - (correctPercentage + wrongPercentage); // Ensures total = 100%

	    return {
	        correct: { width: correctPercentage + '%' },
	        wrong: { width: wrongPercentage + '%' },
	        unattempted: { width: unattemptedPercentage + '%' }
	    };
	};


	$scope.getOverallCoverage = function(type, correct, unattempted, wrong) {
	    var total = correct + unattempted + wrong;
	    // Compute percentages
	    var correctPercentage = (correct / total) * 100;
	    var wrongPercentage = (wrong / total) * 100;
	    var unattemptedPercentage = 100 - (correctPercentage + wrongPercentage); // Ensures total = 100%

	    if(type == 'CORRECT') 
	    	return { width: correctPercentage + '%' }
	    else if(type == 'UNATTEMPTED') 
	    	return { width: unattemptedPercentage + '%' }
	    else if(type == 'WRONG') 
	    	return { width: wrongPercentage + '%' }
	};




    function renderGraphsAndCharts(reportData) {
    	renderSectionWiseStatsBarChart(reportData.sectionWiseResponse);
    	renderSubjectStrengthPieChart(reportData.sectionWiseResponse);
    	$scope.renderTimeDistributionBarChart(reportData.sectionWiseResponse);
    }


	$scope.computeOverallStats = function(sectionResponse) {
		
		$scope.overallCorrect = 0;
        $scope.overallIncorrect = 0;
        $scope.overallUnattempted = 0;
        $scope.overallScore = 0;

	    if (!sectionResponse) {
	        return;
	    }

	    var totalMarks = 0;
	    var totalUnattempted = 0;
	    var totalCorrect = 0;
	    var totalIncorrect = 0;

	    for (var i = 0; i < sectionResponse.length; i++) {
	    	var summary = sectionResponse[i].sectionSummary;

	    	totalMarks += summary.totalMarks;
	    	totalCorrect += summary.correct;
	    	totalUnattempted += (summary.total - summary.attempted);
	    	totalIncorrect += (summary.attempted - summary.correct);
	    }

    	$scope.overallCorrect = totalCorrect;
	    $scope.overallIncorrect = totalIncorrect;
	    $scope.overallUnattempted = totalUnattempted;
	    $scope.overallScore = totalMarks;
	};



	$scope.topicLevelData = {};
	$scope.computeTopicLevelAccuracy = function() {

	    var topicStats = {};
	    $scope.reportData.sectionWiseResponse.forEach(section => {
	        section.questions.forEach(question => {
	            const { topic, answer, attempt } = question;
	            const attempted = attempt !== "";
	            const correct = attempted && attempt === answer;

	            if (!topicStats[topic]) {
	                topicStats[topic] = { correct: 0, attempted: 0 };
	            }

	            if (attempted) {
	                topicStats[topic].attempted++;
	                if (correct) {
	                    topicStats[topic].correct++;
	                }
	            }
	        });
	    });

	    // Calculate accuracy
	    const accuracyMap = {};
	    for (const topic in topicStats) {
	        accuracyMap[topic] = topicStats[topic].attempted > 0
	            ? (topicStats[topic].correct / topicStats[topic].attempted) * 100
	            : 0;
	    }

	    // Sort accuracyMap in descending order
	   	$scope.topicLevelData = Object.entries(accuracyMap)
	    .sort(([, a1], [, a2]) => a2 - a1) // Sort by accuracy in descending order
	    .map(([topic, accuracy]) => ({ topic: parseInt(topic, 10), accuracy: Math.round(accuracy) })); // Convert topic to integer and round accuracy

	}

    $scope.getTopicAccuracyPercentageStyling = function (accuracy) {
        return {
            "width": accuracy + "px"
        };
    };


    //This mapping to be aligned with backend config.
	const uniqueTopicsMap = {
		0: "Uncategorised",
	    1: "Plus One - Physics",
	    2: "Plus One - Chemistry",
	    3: "Plus One - Mathematics",
	    4: "Plus One - Biology",
	    5: "Plus Two - Physics",
	    6: "Plus Two - Chemistry",
	    7: "Plus Two - Mathematics",
	    8: "Plus Two - Biology"
	};

    $scope.getTopicNameFromCode = function(topic) {
    	return uniqueTopicsMap[topic] ? uniqueTopicsMap[topic] : uniqueTopicsMap[0];
    }


    $scope.reportDataFound = true;
    $scope.reportData = {};
    $scope.fetchReportData = function() {
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/exam-report.php?id=' + getReportIdPassed(),
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.reportData = response.data.data;
                $scope.reportDataFound = true;
                $scope.computeOverallStats($scope.reportData.sectionWiseResponse);

                $scope.computeTopicLevelAccuracy();
            	renderGraphsAndCharts(response.data.data);

            } else {
                $scope.reportDataFound = false;
            }
        });
    }

    $scope.fetchReportData();

    $scope.getAttemptedEasy = function(data) {
    	return data['1']['total'];
    }



    $scope.viewQuestionAndAnswer = function(questionData, sectionName){
    	$('#questionPreviewModal').modal('show'); 
    	$scope.questionData = questionData; 
    	$scope.questionData.sectionName = sectionName;
    	$scope.questionData.url = "https://crisprtech.app/crispr-apis/user/render-question.php?id=" + questionData['qi'];    	
  	}
  	


  	//Report Computations
  	$scope.getTotalScoreIcon = function() {
  		var currentScore = $scope.reportData.totalScore;
  		var previousTestScore = parseInt($scope.reportData.previousScoreInSeries);
  		if(currentScore >= previousTestScore)
  			return "ti ti-stats-up greenTileIcon";
  		else 
  			return "ti ti-stats-down redTileIcon";
  	}

  	$scope.getTotalScoreDeviation = function() {
  		return $scope.reportData.totalScore - parseInt($scope.reportData.previousScoreInSeries);
  	}

  	$scope.getStrikeRateIcon = function() {
  		var currentStrikeRate = $scope.reportData.strikeRate;
  		var previousStrikeRate = parseInt($scope.reportData.previousStrikeRateInSeries);
  		if(currentStrikeRate >= previousStrikeRate)
  			return "greenTileIcon";
  		else 
  			return "redTileIcon";
  	}

  	$scope.getStrikeRateDeviation = function() {
  		return $scope.reportData.strikeRate - parseInt($scope.reportData.previousStrikeRateInSeries);
  	}

  	$scope.getPercentageWrapped = function(value) {
  		return (value / 100).toFixed(0);
  	}

  	$scope.wrapGlobalAverage = function() {
  		return (parseInt($scope.reportData.globalAverage) / 100).toFixed(0);
  	}




});