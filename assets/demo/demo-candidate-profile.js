$(document).ready(function() {

	//Thumbnail
	$(".profile-photos img").click(function(e) {
		e.preventDefault();
		var img = $(this).attr("src");
		var imgname = $(this).closest(".item-wrapper").attr("data-name");

		bootbox.dialog({
			message: "<img src='" + img + "' class='img-responsive' />",
			title: imgname,
			buttons: {
				close: {
					label: "Close",
					className: "btn-default"
				}
			}
		});

		$(".modal .bootbox-close-button").hide();

	});


      setTimeout(function(){
        $('#dob_edit').datetimepicker({  
          format: "dd-mm-yyyy",
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0
        })
      }, 200);


});