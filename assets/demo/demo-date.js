$(document).ready(function() {

	    $('#dtp-5').datetimepicker({  // Date
	    	format: "dd MM yyyy",
	    	weekStart: 1,
        	todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 2,
			minView: 2,
			forceParse: 0
	    });

		$('#dtp-6').datetimepicker({ // Time
			format: "hh:ii",
        	weekStart: 1,
        	todayBtn:  1,
			autoclose: 1,
			todayHighlight: 1,
			startView: 1,
			minView: 0,
			maxView: 1,
			forceParse: 0
	    });

		$('.input-group-addon .fa-th').removeClass('fa fa-th').addClass('ti ti-view-grid');
		$('.input-group-addon .fa-close').removeClass('fa fa-close').addClass('ti ti-close');
		$('.input-group-addon .fa-clock-o').removeClass('fa fa-clock-o').addClass('ti ti-time');
		$('.input-group-addon .fa-calendar').removeClass('fa fa-calendar').addClass('ti ti-calendar');

});