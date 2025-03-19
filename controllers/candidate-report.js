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
		    let percentage = (section.sectionSummary.correct / totalCorrect) * 100;
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

	        // DONUT
	        $.plot($("#subjectStrengthPieChart"), datax2,
	            {
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
    	console.log("openQuestion", $scope.reportData)
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

        console.log("Processing Section Data...");

        // Process sectionWiseResponse to generate barData
        sectionWiseResponse.forEach((section, sectionIndex) => {
            section.questions.forEach((question, questionIndex) => {
                const { qi, timeSpent, answer, attempt } = question;

                maxTimeSpent = Math.max(maxTimeSpent, timeSpent);

                let color = attempt === "" ? "#ffc008" : attempt === answer ? "#4caf50" : "#e51c23";

                questionIdMap[sequentialOrder] = qi; // Store questionId for x position

                console.log(`Mapping: X=${sequentialOrder}, questionId=${qi}`);

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

        console.log("Final questionIdMap:", questionIdMap);

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
                    console.log("Clicked on:", item);
                    const xValue = Math.round(item.datapoint[0]); // Ensure xValue is an integer
                    console.log("Extracted X Value:", xValue);

                    const questionId = questionIdMap[xValue]; // Retrieve questionId
                    console.log("Retrieved Question ID:", questionId);

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
                    console.log("Hovering over bar:", item.datapoint);
                }
            });
        });
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


    function renderGraphsAndCharts(reportData) {
    	renderSectionWiseStatsBarChart(reportData.sectionWiseResponse);
    	renderSubjectStrengthPieChart(reportData.sectionWiseResponse);
    	$scope.renderTimeDistributionBarChart(reportData.sectionWiseResponse);
    }





    $scope.reportDataFound = false;
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
    	console.log(questionData)
    	$('#questionPreviewModal').modal('show'); 
    	$scope.questionData = questionData; 
    	$scope.questionData.sectionName = sectionName;
    	$scope.questionData.url = "https://crisprtech.app/crispr-apis/user/render-question.php?id=" + questionData['qi'];    	
  	}
  	
});