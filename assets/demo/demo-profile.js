$(document).ready(function() {

	// There is no special integration in BS between list-group and tabs, so we add it
	 $('.list-group-item').on('click',function(e){
     	var previous = $(this).closest(".list-group").children(".active");
     	previous.removeClass('active'); // previous list-item
     	$(e.target).addClass('active'); // activated list-item
   	});


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


	//Populate all select boxes with from select#source
	var opts=$("#source2").html(), opts2="<option></option>"+opts;

	$("select.populate").each(function() { var e=$(this); e.html(e.hasClass("placeholder")?opts2:opts); });

	//select2
	$("#e1").select2({width: '100%'});





	// Data Table
    $('#example').dataTable({
    	"language": {
    		"lengthMenu": "_MENU_"
    	}
    });
    $('.dataTables_filter input').attr('placeholder','Search...');


    //DOM Manipulation to move datatable elements integrate to panel
	$('.panel-ctrls').append($('.dataTables_filter').addClass("pull-right")).find("label").addClass("panel-ctrls-center");
	$('.panel-ctrls').append("<i class='separator'></i>");
	$('.panel-ctrls').append($('.dataTables_length').addClass("pull-left")).find("label").addClass("panel-ctrls-center");

	$('#all-questions-footer').append($(".dataTable+.row"));
	$('.dataTables_paginate>ul.pagination').addClass("pull-right m-n");





	//Question Form
	    //Load Wizards
    $('#basicwizard').stepy();
    $('#wizard').stepy({finishButton: true, titleClick: true, block: true, validate: true});

    //Add Wizard Compability - see docs
    $('.stepy-navigator').wrapInner('<div class="pull-right"></div>');

    //Make Validation Compability - see docs
    // $('#wizard').validate({
    //     errorClass: "help-block",
    //     validClass: "help-block",
    //     highlight: function(element, errorClass,validClass) {
    //        $(element).closest('.form-group').addClass("has-error");
    //     },
    //     unhighlight: function(element, errorClass,validClass) {
    //         $(element).closest('.form-group').removeClass("has-error");
    //     }
    //  });



    //Exam Create - paste questions
    	//Tokenfield

	var engine = new Bloodhound({
		local: [{value: 'red'}, {value: 'blue'}, {value: 'green'} , {value: 'yellow'}, {value: 'violet'}, {value: 'brown'}, {value: 'purple'}, {value: 'black'}, {value: 'white'}],
		datumTokenizer: function(d) {
			return Bloodhound.tokenizers.whitespace(d.value); 
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace    
	});

	engine.initialize();


	$('#tokenfield-typeahead').tokenfield({
		typeahead: [null, { source: engine.ttAdapter() }]
	});




});