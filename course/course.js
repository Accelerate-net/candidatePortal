$(document).ready(function() {


    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
    }

    //Default Tab
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    const moduleId = urlParams.get('module');
    const chapterId = urlParams.get('chapter');
    var selectedPartId = urlParams.get('view');
    selectedPartId = selectedPartId && selectedPartId >= 0 ? selectedPartId : 0;


    function trackProgress() {

        console.log('tracking...')

        // Create a PlayerJS instance with the 'bunny-stream-embed' element
        const player = new playerjs.Player('bunny-stream-embed');

        // Initialize variables to store total duration and last progress point
        let totalDuration = 0;
        let lastProgress = 0;

        // Event handler when the player is ready
        player.on('ready', () => {
            console.log('Ready');
        });

        // Event handler when the video is played
        player.on('play', () => {
            console.log('Video is playing');
        });

        // Get the total duration of the video and start playing
        player.getDuration((duration) => {
            totalDuration = duration;
        });

        // Event handler for time updates when the player is playing
        player.on('timeupdate', (timingData) => {

        // Get current seconds
        const currentTime = timingData.seconds;

        // Calculate progress percentage and round to the nearest 25%
        const progressPercentage = (currentTime / timingData.duration) * 100;
        const progressRounded = Math.floor(progressPercentage / 25) * 25;

        // Log the progress percentage
        console.log('Progress Percentage: ' + Math.floor(progressPercentage) + "%");

        // Update the progress text on the page
        progressText.textContent = `${Math.floor(progressPercentage)}%`;

        // Check if progress reached a new 25% milestone and update the progress bar
        if (progressRounded > lastProgress) {
            console.log(`Video progress: ${progressRounded}%`);
            lastProgress = progressRounded;
        }
                
        });
    }




    function renderContentVideo(contentSource) {
        document.getElementById("videoRenderSpace").innerHTML = '' +
            '<iframe id="bunny-stream-embed" src="https://iframe.mediadelivery.net/embed/475938/'+contentSource+'" width="720" height="400" frameborder="0" allow="autoplay"></iframe>';
    
        setTimeout(function () {
          trackProgress();
        }, 3000);
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
            <li class="chapter ${isPartSelectedActive(partData)}" data-part-id="${partData.id}" data-source="${partData.source}">
              <div>
                <span class="chapter-number">${i + 1}</span>
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
        



        renderContentVideo(selectedPartData.source);
    }



    var chapterData = {};
    var selectedPartData = {};
    var contentSource = {}; //Current Video URL

    function fetchChapterData() {


        var responseData = {
            "courseId": "CR0003",
            "courseName": "1 Year Program 2025",
            "modules": [
                {
                    "id": "1",
                    "name": "Biology",
                    "chapters": [
                        {
                            "id": "1",
                            "code": "Chapter 1",
                            "title": "Animal Kingdom",
                            "parts": [
                                {
                                    "id": "1",
                                    "title": "Part 1: Introduction",
                                    "duration": "530",
                                    "source": "a5a65236-8356-449b-80fe-4c0857ac43ec",
                                    "type": "VIDEO"
                                },
                                {
                                    "id": "2",
                                    "title": "Part 2: Principles of Animals and Birds",
                                    "duration": "1229",
                                    "source": "656a4f83-e567-4a34-ba21-236ffc54b6f3",
                                    "type": "VIDEO"
                                }
                            ],
                            "rating": {
                                "value": 49,
                                "total": 154
                            },
                            "teacher": {
                                "name": "Amith C S",
                                "brief": "Having graduated from IISER Trivandrum, Amith Sir has been having 5+ years of teaching experience",
                                "rating": 46,
                                "photo": "https://amithcs.in/assets/images/avatar.jpg"
                            }
                        }
                    ]
                }
            ]
        };

        var moduleData = responseData.modules.find(module => module.id === moduleId);
        var chapterData = moduleData.chapters.find(chapter => chapter.id === chapterId);
        var selectedPartData = chapterData.parts[0];

        renderSideBarAndVideo(moduleData, chapterData, selectedPartData);
    }

    fetchChapterData();


    function isPartSelectedActive(partData) {
      return partData.id == selectedPartId ? "active" : "";
    }

    function openContent(partId, contentSource) {
        const url = new URL(window.location);
        url.searchParams.set('view', partId);
        window.history.pushState({}, '', url);

        selectedPartId = partId;

        renderContentVideo(contentSource);
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

