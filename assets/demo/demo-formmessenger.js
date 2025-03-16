$(function() {

	//Tokenfield
	var myList = "";
	
	$.get("https://accelerateengine.app/food-engine/apis/fetchclassinfosimple.php", function(data){
          var temp = JSON.parse(data);
          if(temp.status){
		myList = temp.response;
          }
          else{
          	myList = [{value: 'CLASSIC'}, {value: 'IITM'}, {value: 'FRESHER'} , {value: 'SILVER'}, {value: 'PLATINUM'}];
          }
      	});      	      
      	
      
	setTimeout(function(){
		var engine = new Bloodhound({
			local: myList,
			datumTokenizer: function(d) {
				return Bloodhound.tokenizers.whitespace(d.value); 
			},
			queryTokenizer: Bloodhound.tokenizers.whitespace
		});
	
		engine.initialize();
	
	
		$('#tokenfield-typeahead').tokenfield({
			typeahead: [null, { source: engine.ttAdapter() }]
		});
	}, 4000);

});