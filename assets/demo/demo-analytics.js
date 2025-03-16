jQuery(document).ready(function() {

        
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
        
      
      
      //Weekly Sales
      var previousWeek = [];
      var currentWeek = [];
      var myticks = []; 
      var maxValue = 0;
      
      var mobileOrders = 100;
      var webOrders = 200;
      
      var branchData = [];
        
      var val = {};
      val.token = decodeURIComponent(getCookie("acceleronLunaAdminToken"));
      $("#graphLoader1").addClass("smallLoading");
      $("#graphLoader2").addClass("smallLoading");
      $("#graphLoader3").addClass("smallLoading");
      
      $.ajax({
          type: 'POST',
          url: 'https://accelerateengine.app/food-engine/apis/analyticssales.php',
          data: JSON.stringify(val),
          contentType: "application/json",
          dataType: 'json',
          success: function(data) {
          	var p = data.previous;
          	var c = data.current;
          	for(var i = 1; i <= 7; i++){
          		previousWeek.push([i, Number(p[i-1]['sales'])]);
          		currentWeek.push([i, Number(c[i-1]['sales'])]);
          		myticks.push([i, c[i-1]['date']]);
          		
          		if(Number(p[i-1]['sales']) > maxValue)
          			maxValue = Number(p[i-1]['sales']);
          		if(Number(c[i-1]['sales']) > maxValue)
          			maxValue = Number(c[i-1]['sales']);
          	}
          	
          	//User stats
          	mobileOrders = Number(data.ordersMobile);
          	webOrders = Number(data.ordersWeb); 
          	
          	//Outlet Stats
          	var branches = data.outletInfo;    
          	for(var k = 0; k < branches.length; k++){
          		branchData.push({label: branches[k]['name'], data: branches[k]['amount'], color: '#'+(function lol(m,s,c){return s[m.floor(m.random() * s.length)] +
  (c && lol(m,s,c-1));})(Math,'0123456789',4)});
          	}
          	
          	setTimeout(function(){

	         var plot = $.plot($("#socialstats"),
	            [{ data: currentWeek, label: "This Week" },
	            { data: previousWeek, label: "Previous Week" },
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
	                    },
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
	                    max: maxValue+5000, 
	                    tickColor: '#fafafa', 
	                    font: {color: '#bdbdbd', size: 12},
	                    // tickFormatter: function (val, axis) {
	                    //     if (val>999) {return (val/1000) + "K";} else {return val;}
	                    // }
	                },
	                xaxis: { 
	                    ticks: myticks,
	                    tickColor: 'transparent',
	                    tickDecimals: 0, 
	                    font: {color: '#bdbdbd', size: 12}
	                },
	                colors: ['#2ecc71', '#95a5a6'],
	                tooltip: true,
	                tooltipOpts: {
	                    content: function(label, xval, yval, flotItem){
	                    	
		               return label+" Sales Rs. "+yval
		           }           
	                }
	            });
	            $("#graphLoader1").removeClass("smallLoading");
	           }, 500);    
	           
	           setTimeout(function(){

    	// Donut
        var datax = [
            { label: "Mobile",  data: mobileOrders, color: '#1abc9c'},
            { label: "Website",  data: webOrders, color: '#34495e'}
        ];

        $.plot($("#newvsreturning"), datax,
            {
                series: {
                        pie: {
                            innerRadius: 0.55,
                            show: true,
                            offset : {
                                left: 0
                            }
                        }
                },
                legend: {
                    show: true,
                    margin: 8
                },
                grid: {
                    hoverable: true,
                    labelMargin: 8
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%p.0%, %s"
                }

       });
       

       $("#graphLoader2").removeClass("smallLoading");
	      
     }, 500);
                       
    
	    setTimeout(function(){
	    $(function() {
    
            // data
	    var datax = branchData;
	    /*
	    [
	        { label: "Velacheri",  data: 10, color: Utility.getBrandColor('danger')},
	        { label: "Adyar",  data: 30, color: Utility.getBrandColor('warning')},
	        { label: "Nungambackam",  data: 90, color: Utility.getBrandColor('midnightblue')},
	        { label: "IIT Campus",  data: 70, color: Utility.getBrandColor('info')},
	        { label: "Royappettah",  data: 80, color: Utility.getBrandColor('success')},
	        { label: "JP Nagar",  data: 110, color: Utility.getBrandColor('inverse')}
	    ];
	    */


    	// INTERACTIVE
        $.plot($("#interactive"), datax,
            {
                series: {
                        pie: {
                                show: true
                        }
                },
                grid: {
                        hoverable: true,
                        clickable: true
                },
                legend: {
                    show: false
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%p.0%, %s"
                }

            });
            $("#interactive").bind("plothover", pieHover);


	    function pieHover(event, pos, obj)
	    {
	            if (!obj)
	                    return;
	            percent = parseFloat(obj.series.percent).toFixed(2);
	            $("#hover").html('<span style="font-weight: bold; color: '+obj.series.color+'">'+obj.series.label+' ('+percent+'%)</span>');
	    }
	
	
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
	    });
	   
	    $("#graphLoader3").removeClass("smallLoading");
	      
	    }, 500);
	    
	        	
          	
          }
      });
      
      

  
	       
         
  

        

    
    
    
    
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    
       
});
