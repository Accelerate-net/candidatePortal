render();
function render() {
  setTimeout(function(){

        $('.easypiechart#overall').easyPieChart({
            barColor: "#16a085",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

        $('.easypiechart#food').easyPieChart({
            barColor: "#2980b9",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

        $('.easypiechart#quality').easyPieChart({
            barColor: "#2980b9",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

        $('.easypiechart#delivery').easyPieChart({
            barColor: "#8bc34a",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

        $('.easypiechart#service').easyPieChart({
            barColor: "#8bc34a",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

        $('.easypiechart#app').easyPieChart({
            barColor: "#8bc34a",
            trackColor: 'transparent',
            scaleColor: '#eee',
            scaleLength: 8,
            lineCap: 'square',
            lineWidth: 2,
            size: 96,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        });

  }, 1000);
}
