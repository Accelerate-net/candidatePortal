$(document).ready(function () {
    // Visitor Stats
    // var fans = [[1, 17], [2, 234], [3, 73], [4, 47], [5, 90], [6, 70], [7, 210]];

    // var plot = $.plot($("#socialstats"), [
    //     { data: fans, label: "" }
    // ], {
    //     series: {
    //         shadowSize: 0,
    //         lines: {
    //             show: false,
    //             lineWidth: 0
    //         },
    //         points: { show: true },
    //         splines: {
    //             show: true,
    //             fill: 0.08,
    //             tension: 0.3, // float between 0 and 1, defaults to 0.5
    //             lineWidth: 2 // number, defaults to 2
    //         }
    //     },
    //     grid: {
    //         labelMargin: 8,
    //         hoverable: true,
    //         clickable: true,
    //         borderWidth: 0,
    //         borderColor: '#fafafa'
    //     },
    //     legend: {
    //         backgroundColor: '#fff',
    //         margin: 8
    //     },
    //     yaxis: {
    //         min: 0,
    //         max: 240,
    //         tickColor: '#bfbfbf',
    //         font: { color: '#bdbdbd', size: 12 }
    //     },
    //     xaxis: {
    //         tickColor: 'transparent',
    //         tickDecimals: 0,
    //         font: { color: 'transparent', size: 12 }
    //     },
    //     colors: ['#9fa8da', '#80deea'],
    //     tooltip: true,
    //     tooltipOpts: {
    //         content: "Test %x Score: %y"
    //     }
    // });


var fans = [[1, 17], [2, 234], [3, 73], [4, 47], [5, 90], [6, 70], [7, 210], [8, 240], [9, 190]];
// var fans = [[1, 17], [2, 45]];
var plot = $.plot($("#socialstats"), [
    { data: fans, label: "" }
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
        max: 240,
        tickColor: '#bfbfbf',
        font: { color: '#bdbdbd', size: 12 }
    },
    xaxis: {
        tickColor: 'transparent',
        tickDecimals: 0,
        font: { color: '#bfbfbf', size: 12 }
    },
    colors: ['#9fa8da', '#80deea'],
    tooltip: true,
    tooltipOpts: {
        content: "Test %x Score: %y"
    }
});

let maxIndex = 0;
let minIndex = 0;

for (let i = 1; i < fans.length; i++) {
    if (fans[i][1] > fans[maxIndex][1]) {
        maxIndex = i;
    }
    if (fans[i][1] < fans[minIndex][1]) {
        minIndex = i;
    }
}

console.log(maxIndex, minIndex)

// Add labels to each data point
for (var i = 0; i < fans.length; i++) {
    var point = fans[i];
    var x = point[0];
    var y = point[1];

    var left = plot.pointOffset({ x: x, y: y }).left + 10;
    var top = plot.pointOffset({ x: x, y: y }).top - 20;
    if(i == fans.length - 1) {
        left = plot.pointOffset({ x: x, y: y }).left - 40;
    }

    if(fans.length == 1) {
        bgColor = "#fff";
    } else if(i == maxIndex) {
        bgColor = "#d7ffd9";
    } else if (i == minIndex) {
        bgColor = "#ffcdc9"
    } else {
        bgColor = "#fff";
    }

    // Create a div for the label
    var label = $('<div class="data-point-label"></div>')
        .text(y)
        .css({
            position: 'absolute',
            left: left,
            top: top,
            backgroundColor: bgColor,
            padding: '2px 5px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '12px',
            color: '#333',
            zIndex: 1000
        })
        .appendTo("#socialstats");
}


});