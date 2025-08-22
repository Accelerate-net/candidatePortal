angular.module('CandidateDashboardApp', ['ngCookies'])

.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}])


.controller('candidateDashboardController', function($scope, $http, $interval, $cookies, $timeout) {

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


    //By default click on a given "Attempt Exam" button if coming from Login page
    function defaultButtonClick() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const courseCode = urlParams.get('courseCode');
        const examCode = urlParams.get('examCode');  

        if(action == "ATTEMPT" && courseCode != "" && examCode != "") {
            var buttonId = "attempt_" + courseCode + "_" + examCode;
            if(document.getElementById(buttonId)) {
                document.getElementById(buttonId).click();

                //Clear URL Params
                window.history.replaceState(null, "", window.location.pathname);
            }
        }
    }


    function getUserToken() {
        return "Bearer " + $cookies.get("crispriteUserToken");  
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
    $scope.dashboardSummaryData.name = "";
    $scope.dashboardSummaryData.aspiration = "";
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
    $scope.courseListingFound = false;
    $scope.getCourseListingData = function(id) {
        $scope.courseIdOpen = id;
        
        // Ensure we're on the test series tab
        $scope.activeTab = 'testSeries';
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
                
                // Auto-select first test series if available and we're on the test series tab
                if ($scope.activeTab === 'testSeries' && $scope.courseListing && $scope.courseListing.testSeriesList && $scope.courseListing.testSeriesList.length > 0) {
                    $scope.getCourseListingData($scope.courseListing.testSeriesList[0].code);
                }

                //Render progress chart if applicable
                if($scope.showProgressChart()) {
                    renderProgressBarChart($scope.courseListing.coursesList);
                }

                setTimeout(() => {
                    defaultButtonClick();
                }, 500);

            } else {
                $scope.courseListingFound = false;
            }
        });      
    }

    $scope.getCourseListingData();


    //Course Bundles = Enrolled Video Courses
    $scope.getCourseBundlesList = function() {
        $http({
          method  : 'GET',
          url     : 'https://crisprtech.app/crispr-apis/user/course-bundle-progress.php',
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          }
         })
         .then(function(response) {
            if(response.data.status == "success"){
                $scope.courseBundlesListing = response.data.data.enrolledCourses;
                $scope.courseBundleData = response.data.data.enrolledCourses; // Store in the variable used by switchTab
                $scope.courseBundlesListingFound = true;
                
                // Auto-select first course bundle if we're on the course bundles tab
                if ($scope.activeTab === 'courseBundles' && response.data.data && response.data.data.length > 0) {
                    $scope.selectCourseBundle(response.data.data.enrolledCourses[0]);
                }
            } else {
                $scope.courseBundlesListingFound = false;
            }
        });    
    }

    $scope.getCourseBundlesList();

    // Initialize with first card selected after data loads
    $timeout(function() {
        // Auto-select first test series on initial load
        if ($scope.courseListing && $scope.courseListing.testSeriesList && $scope.courseListing.testSeriesList.length > 0) {
            $scope.getCourseListingData($scope.courseListing.testSeriesList[0].code);
        }
        
        // Auto-select first course bundle on initial load if on course bundles tab
        if ($scope.activeTab === 'courseBundles' && $scope.courseBundleData && $scope.courseBundleData.length > 0) {
            $scope.selectCourseBundle($scope.courseBundleData[0]);
        }
    }, 1000); // Wait 1 second for data to load



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

    $scope.continueToActiveExamConfirmation = function(examKey, seriesKey) {
        bootbox.confirm({
                title: "<p style='color: #444; font-size: 24px; margin: 0; font-weight: bold;'>Exam In Progress</p>",
                message: "<p style='color: #444; font-size: 18px; font-weight: 300; line-height: 28px;'>The exam you are trying to attempt is already in progress. To continue, make sure you are using the same device and network on which you initially started. Otherwise, you may be unable to proceed.</p>",
                buttons: {
                    cancel: {
                        label: "Hide",
                        className: "btn-default"
                    },
                    confirm: {
                        label: "Continue Exam",
                        className: "btn-success"
                    }
                },
                callback: function (result) {
                    if(result) {
                        $scope.attemptExam(examKey, seriesKey, 1);
                    }
                }
            });
    }


    //Start the Exam
    $scope.attemptExam = function(examKey, seriesKey, forced) {

        var continueExam = forced && forced == 1 ? 1 : 0;

        let browserFingerprint = {
            screenWidth: screen.width,
            screenHeight: screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            cpuCores: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || "unknown",
        };

        var data = {
            "exam": examKey,
            "series": seriesKey,
            "fingerprint": browserFingerprint 
        }


        //By default it will go to Instruction page. If exam already started, will ask user ==> if continue = 1 is passed, then go to portal directly (backend handles the URL for that)
        $http({
          method  : 'POST',
          url     : 'https://crisprtech.app/crispr-apis/user/start-exam.php?termsAccepted=0' + (continueExam == 1 ? '&continue=1' : ''),
          headers : {
            'Content-Type': 'application/json',
            'Authorization': getUserToken()
          },
          data    : data
         })
         .then(function(response) {
            if(response.data.status == "success") {
                var redirectUrl = response.data.data.url;

                if(continueExam != 1) //For Instruction page only
                    redirectUrl = redirectUrl + '&metadata=' + encodeURIComponent(JSON.stringify(response.data.data.metadata));
                
                window.open(redirectUrl, "_blank");
            } else {
                $scope.showToaster(response.data.message || response.data.error);

                if(response.data.message == "Test already in progress") {
                    $scope.continueToActiveExamConfirmation(examKey, seriesKey)
                }
            }
        });
    }

    //To show or hide progress chart = min 1 attempt
    $scope.showProgressChart = function() {
        if($scope.courseListingFound)
            return $scope.courseListing.coursesList.filter(course => course.previousAttemptId).length > 1;
        return false;
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

    // Tab Management
    $scope.activeTab = 'testSeries'; // Default to test series tab

    $scope.switchTab = function(tabName) {
        $scope.activeTab = tabName;
        
        // Clear any selected course bundle when switching to test series
        if (tabName === 'testSeries') {
            $scope.selectedCourseBundleId = null;
            $scope.selectedCourseBundleData = null;
        }
        
        // Clear any selected test series when switching to course bundles
        if (tabName === 'courseBundles') {
            $scope.courseIdOpen = null;
            
            // Auto-select first course bundle if available
            if ($scope.courseBundleData && $scope.courseBundleData.length > 0) {
                $scope.selectCourseBundle($scope.courseBundleData[0]);
            }
        }
        
        // Auto-select first test series if available
        if (tabName === 'testSeries') {
            if ($scope.courseListing && $scope.courseListing.testSeriesList && $scope.courseListing.testSeriesList.length > 0) {
                $scope.getCourseListingData($scope.courseListing.testSeriesList[0].code);
            }
        }
    }

    // Course Bundle Selection and Content Rendering
    $scope.selectedCourseBundleId = null;
    $scope.selectedCourseBundleData = null;

    $scope.selectCourseBundle = function(courseBundle) {
        $scope.selectedCourseBundleId = courseBundle.id;
        $scope.selectedCourseBundleData = courseBundle;
        
        // Ensure we're on the course bundles tab
        $scope.activeTab = 'courseBundles';
        
        // Fetch course bundle progress data
        $scope.fetchCourseBundleProgress(courseBundle.id);
    }

    $scope.clearCourseSelection = function() {
        $scope.selectedCourseBundleId = null;
        $scope.selectedCourseBundleData = null;
    }

    $scope.fetchCourseBundleProgress = function(bundleId) {
        $http({
            method: 'GET',
            url: 'https://crisprtech.app/crispr-apis/user/course-bundle-progress.php',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getUserToken()
            }
        })
        .then(function(response) {
            if(response.data.status === "success") {
                const selectedContent = response.data.data.coursesMetadata[bundleId];
                $scope.renderCourseBundleContent(selectedContent.modules, selectedContent.chapters);
            } else {
                $scope.showToaster("Failed to load course bundle data");
            }
        })
        .catch(function(error) {
            $scope.showToaster("Error loading course bundle data");
        });
    }

    $scope.renderCourseBundleContent = function(modules, chapters) {
        // Use $timeout to ensure DOM is ready
        $timeout(function() {
            const tabContainer = document.getElementById('tab-container');
            const tabContents = document.getElementById('tab-contents');

            if (!tabContainer || !tabContents) {
                $timeout(function() {
                    $scope.renderCourseBundleContent(modules, chapters);
                }, 100);
                return;
            }

            tabContainer.innerHTML = '';
            tabContents.innerHTML = '';

            let firstTabId = null;

            Object.keys(modules).forEach((modId, index) => {
                const mod = modules[modId];
                if (index === 0) firstTabId = modId;

                // Create tab button
                const tabBtn = document.createElement('button');
                tabBtn.className = 'tab';
                tabBtn.textContent = mod.name;
                tabBtn.setAttribute('data-module-id', modId);
                tabBtn.onclick = function() { 
                    const moduleId = this.getAttribute('data-module-id');
                    $scope.showCourseBundleTab(moduleId);
                };
                tabContainer.appendChild(tabBtn);

                // Create tab content container
                const contentDiv = document.createElement('div');
                contentDiv.id = `module-${modId}`;
                contentDiv.className = 'tab-content';
                contentDiv.style.display = 'none';

                // Filter chapters for this module
                const modChapters = chapters.filter(c => c.moduleId == modId);

                if (modChapters.length > 0) {
                    const table = document.createElement('table');
                    
                    // Add table header
                    const thead = document.createElement('thead');
                    table.appendChild(thead);
                    
                    // Add table body
                    const tbody = document.createElement('tbody');
                    modChapters.forEach(ch => {
                        const tr = document.createElement('tr');

                        if (!ch.url) {
                            tr.classList.add('disabled');
                        }

                        const watchButton = ch.url
                            ? `<button class="btn-view" onclick="window.open('${ch.url}', '_blank')">Watch</button>`
                            : '';

                        tr.innerHTML = `
                            <td>Chapter ${ch.chapterNumber} : <strong>${ch.title}</strong></td>
                            <td>${watchButton}</td>
                        `;

                        tbody.appendChild(tr);
                    });
                    
                    table.appendChild(tbody);
                    contentDiv.appendChild(table);
                } else {
                    contentDiv.innerHTML = "<p>No chapters available.</p>";
                }

                tabContents.appendChild(contentDiv);
            });

            // Show first tab by default
            if (firstTabId) {
                $scope.showCourseBundleTab(firstTabId);
            }
        }, 100);
    }

    $scope.showCourseBundleTab = function(tabId) {
        
        // Hide all tab contents
        const tabContents = document.querySelectorAll('#tab-contents .tab-content');
        tabContents.forEach(content => content.style.display = 'none');

        // Remove active class from all tabs
        const tabs = document.querySelectorAll('#tab-container .tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Show selected tab content
        const selectedContent = document.getElementById(`module-${tabId}`);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }

        // Set active class on selected tab
        // Find the tab by its text content matching the module name
        const tabIndex = parseInt(tabId) - 1;
        if (tabs[tabIndex]) {
            tabs[tabIndex].classList.add('active');
        }
    }

});