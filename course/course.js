$(document).ready(function() {

    //Default Tab
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const moduleId = urlParams.get('module');
    const chapterId = urlParams.get('chapter');
    var selectedPartId = urlParams.get('view');
    selectedPartId = selectedPartId && selectedPartId >= 0 ? selectedPartId : 0;

    function getCookieByName(name) {
        var match = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
        return match ? decodeURIComponent(match[1]) : null;
    }

    function getUserToken() {
        return "Bearer " + getCookieByName('crispriteUserToken');
    }

    //Not logged in
    if(getCookieByName('crispriteUserToken') == null) {
        showNotAuthorisedScreen();
    }

    function reRenderSidePanelProgress(progressPercentage) {
      const chapterList = document.querySelector('#partsList');
      const activeItem = chapterList.querySelector('li.chapter.active');
      if (activeItem)
        activeItem.setAttribute('data-progress', progressPercentage);

       updateChapterProgressRings(); 
    }

    var saveProgressClaimed = -1;
    function saveProgress(courseId, moduleId, chapterId, partId, progressInSeconds, totalDurationRounded, progressPercentage) {

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
                "progressInSeconds": progressInSeconds,
                "duration": totalDurationRounded
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

    function bindPlayerTrackingEvents() {
        let lastSavedSecond = -1;

        if (!player) return;

        player.on('play', () => {
            console.log('Video is playing');
        });

        player.on('timeupdate', (timingData) => {
            const currentTime = timingData.seconds;
            const progressPercentage = Math.floor((currentTime / timingData.duration) * 100);
            const currentTimeRounded = Math.floor(currentTime);
            const totalDurationRounded = Math.floor(timingData.duration);

            if ((currentTimeRounded !== lastSavedSecond) &&
                (currentTimeRounded === totalDurationRounded || currentTimeRounded % 11 === 0)) {
                lastSavedSecond = currentTimeRounded;
                saveProgress(courseId, moduleId, chapterId, selectedPartId, currentTimeRounded, totalDurationRounded, progressPercentage);
            }
        });
    }


    function showNotAuthorisedScreen() {
      document.getElementById('errorOverlay').style.display = 'flex';
    }

    function renderContentVideo(contentDirectory, contentSource, userProgress) {
        userProgress = !userProgress ? 0 : parseInt(userProgress);
        player = null; //Remove older video
        document.getElementById("videoRenderSpace").innerHTML = '' +
          '<iframe id="bunny-stream-embed" ' +
          'src="https://iframe.mediadelivery.net/embed/'+contentDirectory+'/' + contentSource + '?autoplay=true" ' +
          'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
          'allowfullscreen>' +
          '</iframe>';

        const iframe = document.getElementById("bunny-stream-embed");

        // Wait for iframe to fully load
        iframe.onload = () => {
            console.log("Iframe loaded");

            player = new playerjs.Player(iframe);

            player.on('ready', () => {
                console.log("Player ready");
                if (userProgress > 10 && !hasSeekedToLastProgress) {
                    hasSeekedToLastProgress = true;
                    console.log("Seeking to", userProgress);
                    player.setCurrentTime(userProgress);
                }
            });

            bindPlayerTrackingEvents();
        };

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
        



        renderContentVideo(selectedPartData.directory, selectedPartData.source, selectedPartData.progress);
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

    function fetchChapterData() {


        var userProgressRequest = {
          "url": "https://crisprtech.app/crispr-apis/user/courses/get-course-progress.php?courseId="+courseId+"&moduleId="+moduleId+"&chapterId="+chapterId+"&partId="+selectedPartId,
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
    }


    //With default values from URL
    fetchChapterData();


    function isPartSelectedActive(partData) {
      return partData.id == selectedPartId ? "active" : "";
    }

    function openContent(partId, contentSource) {
        const url = new URL(window.location);
        url.searchParams.set('view', partId);
        url.searchParams.set('t', new Date().getTime());
        window.location.href = url;
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

