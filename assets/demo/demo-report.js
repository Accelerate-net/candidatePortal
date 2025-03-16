jQuery(document).ready(function() {

    $(function() {

    //Switchery
        Switchery(document.querySelector('.js-switch-success'), {color: Utility.getBrandColor('success')});

    // EasyPieChart

        try {
            $('.easypiechart#progress').easyPieChart({
                barColor: "#cddc39",
                trackColor: 'rgba(255, 255, 255, 0.32)',
                scaleColor: false,
                scaleLength: 8,
                lineCap: 'square',
                lineWidth: 2,
                size: 96,
                onStep: function(from, to, percent) {
                    $(this.el).find('.percent-non').text(Math.round(percent));
                }
            });
        } catch(e) {}



    // Sparklines
     
        var sparker = function() {
            $('.spark-session').sparkline([15,14,17,11,8,12,15,24,17,16,17,14,10,8,11,17,15,13,17,18,16,10,9,1,4,9,13,11,12,15], { fillColor: '#f5f5f5', lineColor: '#e0e0e0', lineWidth: 2, height: '24px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e0e0e0'});
            $('.spark-users').sparkline([15,14,17,11,8,12,15,24,17,16,17,14,10,8,11,17,15,13,17,18,16,10,9,1,4,9,13,11,12,15], { fillColor: '#f5f5f5', lineColor: '#e0e0e0', lineWidth: 2, height: '24px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e0e0e0'});
            $('.spark-pagesession').sparkline([15,14,17,11,8,12,15,24,17,16,17,14,10,8,11,17,15,13,17,18,16,10,9,1,4,9,13,11,12,15], { fillColor: '#f5f5f5', lineColor: '#e0e0e0', lineWidth: 2, height: '24px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e0e0e0'});
            $('.spark-avgduration').sparkline([15,14,17,11,8,12,15,24,17,16,17,14,10,8,11,17,15,13,17,18,16,10,9,1,4,9,13,11,12,15], { fillColor: '#f5f5f5', lineColor: '#e0e0e0', lineWidth: 2, height: '24px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e0e0e0'});
            $('.spark-bouncerate').sparkline([15,14,17,11,8,12,15,24,17,16,17,14,10,8,11,17,15,13,17,18,16,10,9,1,4,9,13,11,12,15], { fillColor: '#f5f5f5', lineColor: '#e0e0e0', lineWidth: 2, height: '24px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e0e0e0'});

            $('.spark-pageviews').sparkline([300,280,340,220,160,240,300,480,340,320,340,280,200,160,220,340,300,260,340,360,320,200,180,20,80,180,260,220,240,300], { fillColor: '#fafbeb', lineColor: '#e6ee9c', lineWidth: 2, height: '120px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#e6ee9c', chartRangeMax: 480, chartRangeMin: 0});
            $('.spark-pageviews').sparkline([150,140,170,110,80,120,150,240,170,160,170,140,100,80,110,170,150,130,170,180,160,100,90,10,40,90,130,110,120,150],     { fillColor: '#fbead7', lineColor: '#ffab91', lineWidth: 2, height: '120px', width: '100%', spotRadius: 3, spotColor: 'transparent', highlightLineColor: 'rgba(0, 0, 0, 0.1)', maxSpotColor: 'transparent', minSpotColor: 'transparent', highlightSpotColor: '#ffab91', composite: true, chartRangeMax: 480, chartRangeMin: 0});
            
        }
        var sparkResize;
     
        $(window).resize(function(e) {
            clearTimeout(sparkResize);
            sparkResize = setTimeout(sparker, 500);
        });
        sparker();
    });

    //World Map

    var randomNumbers = function (min, max, length) {
        var arr = [];
        var distance = max - min;
        for (var i = 0; i < length; i++) {
            arr.push(min+Math.round(Math.random() * distance))
        }

        return arr;
    }

    $('#worldmap').vectorMap({
        map: 'world_mill_en',
        backgroundColor: '#fff',
        zoomOnScroll: false,
        regionStyle: {
            initial: {
              fill: '#ddd',
              "fill-opacity": 1,
              stroke: 'none',
              "stroke-width": 0,
              "stroke-opacity": 1
            },
            hover: {
              "fill-opacity": 0.8,
              cursor: 'pointer'
            },
            selected: {
              fill: 'yellow'
            },
        },
        markerStyle: {
          initial: {
            fill: 'rgba(255, 61, 0, 0.7)',
            stroke: '#ff6e40',
            "fill-opacity": 1,
            "stroke-width": 0,
            "stroke-opacity": 0,
            r: 5
          },
          hover: {
            stroke: 'black',
            "stroke-width": 0,
            cursor: 'pointer'
          },
          selected: {
            fill: 'blue'
          },
          selectedHover: {
          }
        },

        markers: [
            {latLng: [40.7127, -74.0059], name: 'New York'},
            {latLng: [41.9033, 12.4533], name: 'Vatican City'},
            {latLng: [48.8567, 2.3508], name: 'Paris'},
            {latLng: [-31.9522, 115.8589], name: 'Perth'},
            {latLng: [-8.7619, -63.9039], name: 'Porto Velho'},
            {latLng: [39.9500, -75.1667], name: 'Philadelphia'},
            {latLng: [41.4822, -81.6697], name: 'Cleveland'},
            {latLng: [1.3, 103.8], name: 'Singapore'},
        ],
        series: {
            markers: [{
                attribute: 'r',
                scale: [3, 17],
                values: randomNumbers(200, 1500, 24)
            }]
        },
    });

    var wmap = $('#worldmap').children('.jvectormap-container').data('mapObject');    

    setInterval (function () {
        wmap.series.markers[0].setValues(randomNumbers(200, 1500, 24));
    }, 2000);


    //Loading Button in Timeline
    $('.loading-example-btn').click(function () {
        var btn = $(this)
        btn.button('loading')
        setTimeout(function () {
          btn.button('reset')
        },3000 )
    });


    // Visitor Stats
        function randValue() {
            return (Math.floor(Math.random() * (2)));
        }

        var fans = [[1, 17], [2, 34], [3, 73], [4, 47], [5, 90], [6, 70], [7, 40]];
        var followers = [[1, 54], [2, 40], [3, 10], [4, 25], [5, 42], [6, 14], [7, 36]];


        //Section wise

// Data
var d1 = [
    [1, 15],
    [2, 15],
    [3, 15],
    [4, 15]
];
var d2 = [
    [1, 12],
    [2, 5],
    [3, 15],
    [4, 11]
];
var d3 = [
    [1, 10],
    [2, 0],
    [3, 12],
    [4, 3]
];

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
    colors: ["#cfd8dc", "#78909c", "#8bc34a"],
    xaxis: {
        autoscaleMargin: 0.08,
        tickColor: "transparent",
        ticks: [[1, "Bio"], [2, "Che"], [3, "Mat"], [4, "Phy"]],
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




    var datax2 = [
        { label: "Physics",  data: 10, color: Utility.getBrandColor('danger')},
        { label: "Chemistry",  data: 30, color: Utility.getBrandColor('warning')},
        { label: "Mathematics",  data: 90, color: Utility.getBrandColor('midnightblue')},
        { label: "Biology",  data: 70, color: Utility.getBrandColor('info')}
    ];

        // DONUT
        $.plot($("#donut2"), datax2,
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




    // Live Dynamic


        /***
        var dxta = [],
                totalPoints = 60;
            var updateInterval = 1000;

            function getRandomData() {

                if (dxta.length > 0)
                    dxta = dxta.slice(1);

                // Do a random walk

                while (dxta.length < totalPoints) {

                    var prev = dxta.length > 0 ? dxta[dxta.length - 1] : 25,
                        y = 10 + Math.random() * 37 - 13;

                    if (y < 0) {
                        y = 0;
                    } else if (y > 33) {
                        y = 50;
                    }

                    dxta.push(y);
                }

                // Zip the generated y values with the x values

                var res = [];
                for (var i = 0; i < dxta.length; ++i) {
                    res.push([i, dxta[i]])
                }

                return res;
            }

            var plot = $.plot("#realtime-updates", [ getRandomData() ], {
                series: {
                    bars: {
                        show: true,
                        lineWidth: 0,
                        barWidth: 0.75,
                        fill: 0.4
                    },
                    shadowSize: 0   // Drawing is faster without shadows
                },
                grid: {
                    labelMargin: 8,
                    hoverable: true,
                    clickable: true,
                    borderWidth: 0,
                    borderColor: '#f5f5f5'
                },
                yaxis: {
                    min: 0,
                    max: 50, //max time spent on any question
                    ticks: [0, 10, 20, 50, 100],
                    tickColor: '#f5f5f5', 
                    font: {color: '#bdbdbd', size: 12}
                },
                xaxis: {
                    show: true
                },
                colors: ['#00bcd4'],
                tooltip: true,
                tooltipOpts: {
                    content: "Time Spent on qn. #%x : %ys"
                }

            });

            function update() {

                plot.setData([getRandomData()]);

                // Since the axes don't change, we don't need to call plot.setupGrid()

                plot.draw();
                //setTimeout(update, updateInterval);
            }

            update();

            ***/



        var totalPoints = 60;

        // Generate static data for bars and line
        function generateStaticData() {
            var barData = [];
            var lineData = [];
            for (var i = 0; i < totalPoints; ++i) {
                var yValue = Math.random() * 50; // Random y-value between 0 and 50
                var color = getBarColor(yValue); // Get color based on y-value

                // Bar data
                barData.push({
                    data: [[i, yValue]], // [x, y] pair
                    color: color, // Assign color to the bar
                    bars: {
                        show: true,
                        lineWidth: 0,
                        barWidth: 0.75,
                        fill: 0.4,
                        fillColor: color // Set fillColor for the bar
                    }
                });

                // Line data
                var lineDataPoint = yValue-10;
                lineDataPoint = lineDataPoint < 0 ? 1 : lineDataPoint;
                lineData.push([i, lineDataPoint]); // [x, y] pair for the line
            }

            console.log("Generated Bar Data:", barData); // Debug: Log the bar data
            console.log("Generated Line Data:", lineData); // Debug: Log the line data

            return {
                barData: barData,
                lineData: lineData
            };
        }

        // Get color based on y-value
        function getBarColor(val) {
            if (val < 10) {
                return '#FF0000'; // Red for values less than 10
            } else if (val >= 10 && val < 20) {
                return '#FFA500'; // Orange for values between 10 and 20
            } else if (val >= 20 && val < 30) {
                return '#FFFF00'; // Yellow for values between 20 and 30
            } else {
                return '#00FF00'; // Green for values 30 and above
            }
        }



        $(document).ready(function () {
            var staticData = generateStaticData();

            // Initialize the plot
var plot = $.plot("#realtime-updates", [
    ...staticData.barData, // Bar data
    { 
        data: staticData.lineData, 
        lines: { 
            show: false, // Disable sharp lines
            fill: false // Disable fill for sharp lines
        }, 
        splines: { 
            fill: false,
            show: false, // Enable smooth spline interpolation
            tension: 0.5 // Adjust tension for smoother curves (0 to 1)
        },
        color: 'transparent' 
    } // Line data
], {
    series: {
        bars: {
            show: true,
            lineWidth: 0,
            barWidth: 0.75,
            fill: 0.4
        },
        shadowSize: 0 // Drawing is faster without shadows
    },
    grid: {
        labelMargin: 8,
        hoverable: true,
        clickable: true,
        borderWidth: 0,
        borderColor: '#f5f5f5'
    },
    yaxis: {
        min: 0,
        max: 50, // max time spent on any question
        ticks: [0, 10, 20, 50, 100],
        tickColor: '#f5f5f5',
        font: { color: '#bdbdbd', size: 12 }
    },
    xaxis: {
        show: true
    },
    tooltip: true,
    tooltipOpts: {
        content: "Time spent on qn. #%x : %ys"
    }
});
        });




//ONLY BAR
//         var dxta = [],
//     totalPoints = 60;
// var updateInterval = 1000;

// function getRandomData() {
//     if (dxta.length > 0)
//         dxta = dxta.slice(1);

//     // Do a random walk
//     while (dxta.length < totalPoints) {
//         var prev = dxta.length > 0 ? dxta[dxta.length - 1] : 25,
//             y = 10 + Math.random() * 37 - 13;

//         if (y < 0) {
//             y = 0;
//         } else if (y > 33) {
//             y = 50;
//         }

//         dxta.push(y);
//     }

//     // Zip the generated y values with the x values and assign colors
//     var res = [];
//     for (var i = 0; i < dxta.length; ++i) {
//         var yValue = dxta[i];
//         var color = getBarColor(yValue); // Get color based on y-value
//         res.push({
//             data: [[i, yValue]], // [x, y] pair
//             color: color, // Assign color to the bar
//             bars: {
//                 fillColor: color // Set fillColor for the bar
//             }
//         });
//     }

//     console.log("Generated Data:", res); // Debug: Log the generated data
//     return res;
// }

// function getBarColor(val) {
//     if (val < 10) {
//         return '#a5a5a5'; // Red for values less than 10
//     } else if (val >= 10 && val < 20) {
//         return '#4caf50'; // Orange for values between 10 and 20
//     } else if (val >= 20 && val < 30) {
//         return '#a5a5a5'; // Yellow for values between 20 and 30
//     } else {
//         return '#e51c23'; // Green for values 30 and above
//     }
// }

// $(document).ready(function () {
//     var plot = $.plot("#realtime-updates", getRandomData(), {
//         series: {
//             bars: {
//                 show: true,
//                 lineWidth: 0,
//                 barWidth: 0.75,
//                 fill: 0.4
//             },
//             shadowSize: 0 // Drawing is faster without shadows
//         },
//         grid: {
//             labelMargin: 8,
//             hoverable: true,
//             clickable: true,
//             borderWidth: 0,
//             borderColor: '#f5f5f5'
//         },
//         yaxis: {
//             min: 0,
//             max: 50, // max time spent on any question
//             ticks: [0, 10, 20, 50, 100],
//             tickColor: '#f5f5f5',
//             font: { color: '#bdbdbd', size: 12 }
//         },
//         xaxis: {
//             show: true
//         },
//         tooltip: true,
//         tooltipOpts: {
//             content: "Time spent on qn. #%x : %ys"
//         }
//     });

//     function update() {
//         var newData = getRandomData();
//         console.log("New Data for Update:", newData); // Debug: Log the new data
//         plot.setData(newData);

//         // Since the axes don't change, we don't need to call plot.setupGrid()
//         plot.draw();
//         //setTimeout(update, updateInterval); // Update every second
//     }

//     update();
// });

});