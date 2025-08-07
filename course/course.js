$(document).ready(function() {

    //Default Tab
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const moduleId = urlParams.get('module');
    const chapterId = urlParams.get('chapter');
    var selectedPartId = urlParams.get('view');
    selectedPartId = selectedPartId && selectedPartId >= 0 ? selectedPartId : 0;



    function reRenderSidePanelProgress(progressPercentage) {
      const chapterList = document.querySelector('#partsList');
      const activeItem = chapterList.querySelector('li.chapter.active');
      if (activeItem)
        activeItem.setAttribute('data-progress', progressPercentage);

       updateChapterProgressRings(); 
    }

    var saveProgressClaimed = -1;
    function saveProgress(courseId, moduleId, chapterId, partId, progressInSeconds, progressPercentage) {

        //Prevent same progress getting called
        if(saveProgressClaimed === progressInSeconds)
            return;
        else 
            saveProgressClaimed = progressInSeconds;


        
        var saveProgressAPI = {
              "url": "https://crisprtech.app/crispr-apis/user/courses/save-course-progress.php",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Authorization": getUserToken(),
                "Content-Type": "application/json"
              },
              "data": JSON.stringify({
                "courseId": courseId,
                "moduleId": moduleId,
                "chapterId": chapterId,
                "partId": partId,
                "progressInSeconds": progressInSeconds
              })
        };

        $.ajax(saveProgressAPI).done(function (response) {
            if(response.status == "success") {
                reRenderSidePanelProgress(progressPercentage);
            } else {
                console.warn('Unable to save course progress.')
            }
        });
    }


    var player;
    var hasSeekedToLastProgress = false;
    function trackProgressWithSeek(seekVideoFlag, userProgress) {
        console.log(seekVideoFlag, userProgress);
        if(!player)
            player = new playerjs.Player('bunny-stream-embed');

        let totalDuration = 0;
        let lastProgress = 0;

        player.on('ready', () => {
            console.log('Ready');
        });

        player.on('play', () => {
            console.log('Video is playing');

            if(!hasSeekedToLastProgress) {
                hasSeekedToLastProgress = true;
                player.setCurrentTime(userProgress);
            }

        });

        player.getDuration((duration) => {
            totalDuration = duration;
        });


        let lastSavedSecond = -1;
        player.on('timeupdate', (timingData) => {
            const currentTime = timingData.seconds;
            const progressPercentage = Math.floor((currentTime / timingData.duration) * 100);
            console.log('Progress Percentage: ' + progressPercentage + "%");

            const currentTimeRounded = Math.floor(currentTime);
            const totalDurationRounded = Math.floor(timingData.duration);

            if (
                (currentTimeRounded !== lastSavedSecond) &&
                (currentTimeRounded === totalDurationRounded || currentTimeRounded % 11 === 0)
            ) {
                lastSavedSecond = currentTimeRounded;
                saveProgress(courseId, moduleId, chapterId, selectedPartId, currentTimeRounded, progressPercentage);
            }
        });




        // player.on('timeupdate', (timingData) => {

        //     const currentTime = timingData.seconds;
        //     const progressPercentage = Math.floor((currentTime / timingData.duration) * 100);
        //     console.log('Progress Percentage: ' +progressPercentage+ "%");
        //     console.log(currentTime, totalDuration)
        //     const currentTimeRounded = Math.floor(currentTime);
        //     const totalDurationRounded = Math.floor(totalDuration)
        //     if(currentTimeRounded == totalDurationRounded || currentTimeRounded % 11 == 0) {
        //         //Save progress
        //         saveProgress(courseId, moduleId, chapterId, selectedPartId, currentTimeRounded);
        //     }

                
        // });
    }




    function renderContentVideo(contentSource, userProgress) {
        userProgress = !userProgress ? 0 : parseInt(userProgress);
        player = null; //Remove older video
        document.getElementById("videoRenderSpace").innerHTML = '' +
            '<iframe id="bunny-stream-embed" src="https://iframe.mediadelivery.net/embed/475938/'+contentSource+'" width="720" height="400" frameborder="0" '+ userProgress == -1 ? 'allow="autoplay"' : '' +'></iframe>';

        
        if(userProgress > 10)
            trackProgressWithSeek(true, userProgress);

        setTimeout(function () {
          trackProgressWithSeek(false, -1);
        }, 10000);

        updateChapterProgressRings();
    }



    function renderSideBarAndVideo(moduleData, chapterData, selectedPartData) {
        document.getElementById("sidebarHeader").innerHTML = moduleData.name + ": " + chapterData.code;
        document.getElementById("sidebarTitle").innerHTML = chapterData.title;

        document.getElementById("mentorTile").innerHTML = '' +
                '<img src="'+chapterData.teacher.photo+'"/>' +
                '<div class="mentor-info">' +
                  '<strong>'+chapterData.teacher.name+'</strong>' +
                  '<p>'+chapterData.teacher.brief+'</p>' +
                '</div> ';

        let partsRenderContent = '';

        for (let i = 0; i < chapterData.parts.length; i++) {
          const partData = chapterData.parts[i];
          partsRenderContent += `
            <li class="chapter ${isPartSelectedActive(partData)}" data-part-id="${partData.id}" data-source="${partData.source}" data-progress="${getUserProgress(partData.progress, partData.duration)}">
              <div>
                <div class="chapter-number-wrapper"> 
                    <svg class="progress-ring" width="40" height="40"> 
                        <circle class="progress-ring__circle-bg" cx="20" cy="20" r="18" /> 
                        <circle class="progress-ring__circle" cx="20" cy="20" r="18" /> 
                    </svg> 
                    <span class="chapter-number">${i + 1}</span>
                </div>
                <div class="chapter-details"><strong>${partData.title}</strong></div>
                <p class="chapter-duration">${beatifyDuration(partData.duration)}</p>
              </div>
            </li>
          `;
        }

        document.getElementById("partsList").innerHTML = partsRenderContent;

        document.querySelectorAll('#partsList .chapter').forEach(function (el) {
          el.addEventListener('click', function () {
            const partId = el.getAttribute('data-part-id');
            const source = el.getAttribute('data-source');
            openContent(partId, source);
          });
        });



        document.getElementById("contentTitle").innerHTML = selectedPartData.title;
        document.getElementById("contentTitleSub").innerHTML = chapterData.code + " - " +chapterData.title+ " from <b>"+moduleData.name+"</b> · "+beatifyDuration(selectedPartData.duration);
        



        renderContentVideo(selectedPartData.source, selectedPartData.progress);
    }

    function getUserProgress(progress, duration) {
          if (!duration || duration <= 0) return 0;
          const percentage = (progress / duration) * 100;
          return Math.max(0, Math.min(100, Math.round(percentage)));
    }


    function updateChapterProgressRings() {
        var index = 1;
        document.querySelectorAll('.chapter').forEach((chapterEl) => {
          const progress = parseFloat(chapterEl.dataset.progress) || 0;

          const circle = chapterEl.querySelector('.progress-ring__circle');
          const radius = circle.r.baseVal.value;
          const circumference = 2 * Math.PI * radius;

          circle.style.strokeDasharray = `${circumference}`;
          circle.style.strokeDashoffset = `${circumference - (progress / 100) * circumference}`;

            const numberEl = chapterEl.querySelector('.chapter-number');
            if (progress > 98) {
                numberEl.innerHTML = '<p style="font-size: 20px; color: #4caf50;">✓</p>';
            } else {
                numberEl.innerHTML = index;
            }

            index++;
        });
    }



    var chapterData = {};
    var selectedPartData = {};
    var contentSource = {}; //Current Video URL

    function getUserToken() {
        return "";
    }

    function fetchChapterData() {


        var userProgressRequest = {
          "url": "https://crisprtech.app/crispr-apis/user/courses/get-course-progress.php",
          "method": "GET",
          "timeout": 0,
          "headers": {
            "Content-Type": "application/json",
            "Authorization": getUserToken()
          }
        };

        $.ajax(userProgressRequest).done(function (userProgressResponse) {
            if(userProgressResponse.status == "success") {

                var responseData = userProgressResponse.data;

                var moduleData = responseData.modules.find(module => module.id === moduleId);
                var chapterData = moduleData.chapters.find(chapter => chapter.id === chapterId);
                var selectedPartData = chapterData.parts.find(part => part.id === selectedPartId);

                renderSideBarAndVideo(moduleData, chapterData, selectedPartData);

            } else {
                showToaster(userProgressResponse.message);
            }
        });



        // var responseData = {
        //     "courseId": "CR0003",
        //     "courseName": "1 Year Program 2025",
        //     "modules": [
        //         {
        //             "id": "1",
        //             "name": "Biology",
        //             "chapters": [
        //                 {
        //                     "id": "1",
        //                     "code": "Chapter 1",
        //                     "title": "Animal Kingdom",
        //                     "parts": [
        //                         {
        //                             "id": "1",
        //                             "title": "Part 1: Introduction",
        //                             "duration": "530",
        //                             "progress": "240",
        //                             "source": "a5a65236-8356-449b-80fe-4c0857ac43ec",
        //                             "type": "VIDEO"
        //                         },
        //                         {
        //                             "id": "2",
        //                             "title": "Part 2: Principles of Animals and Birds",
        //                             "duration": "1229",
        //                             "progress": "1229",
        //                             "source": "656a4f83-e567-4a34-ba21-236ffc54b6f3",
        //                             "type": "VIDEO"
        //                         }
        //                     ],
        //                     "rating": {
        //                         "value": 49,
        //                         "total": 154
        //                     },
        //                     "teacher": {
        //                         "name": "Amith C S",
        //                         "brief": "Having graduated from IISER Trivandrum, Amith Sir has been having 5+ years of teaching experience",
        //                         "rating": 46,
        //                         "photo": "https://amithcs.in/assets/images/avatar.jpg"
        //                     }
        //                 }
        //             ]
        //         }
        //     ]
        // };
    }

    //With default values from URL
    fetchChapterData();


    function isPartSelectedActive(partData) {
      return partData.id == selectedPartId ? "active" : "";
    }

    function openContent(partId, contentSource) {
        const url = new URL(window.location);
        url.searchParams.set('view', partId);
        window.location.href = url; // Actually navigates to the new URL
    }


    function beatifyDuration(duration) {
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


    /**** TOASTER *****/
    function showToaster(message) {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.classList.add('show');

        setTimeout(() => {
            toaster.classList.remove('show');
        }, 3000);
    }
});

