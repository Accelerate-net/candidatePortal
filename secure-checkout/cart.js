$(document).ready(function() {

	/*** Cart Format
	[
	    {
	        "itemId": "C000002",
	        "title": "Dream IISER - IAT 2025 Crash Course",
	        "type": "COURSE",
	        "unitPrice": 599000,
	        "number": 1
	    },
	    {
	        "itemId": "C000005",
	        "title": "Gear Up for IISER - Mock Test 2025",
	        "type": "TEST",
	        "unitPrice": 99900,
	        "number": 1
	    }
	]
	*/


	const cookies = document.cookie;
	function getCookieByName(name) {
	    var match = cookies.match('(?:^|; )' + name + '=([^;]*)');
	    return match ? decodeURIComponent(match[1]) : null;
	}

	function getUserToken() {
		return "Bearer " + getCookieByName('crispriteUserToken');
	}

	function rememberCouponCodeApplied(code) {
		localStorage.setItem("crisprCartDiscountCode", code);
	}

	function forgetCouponCodeApplied() {
		localStorage.setItem("crisprCartDiscountCode", "")
	}

	function clearCheckoutData() {
		localStorage.removeItem("crisprCartDiscountCode");
		localStorage.removeItem("crisprCart");
	}

	function getCouponCodeApplied() {
		return localStorage.getItem("crisprCartDiscountCode") ? localStorage.getItem("crisprCartDiscountCode") : "";
	}

	function retrieveCart() {
	    var cartItemsData = localStorage.getItem("crisprCart");
	    if(!cartItemsData) {
	    	cartItemsData = [];
	    	localStorage.setItem("crisprCart", JSON.stringify(cartItemsData));
	    }
	    if (cartItemsData) {
	        try {
	            return JSON.parse(cartItemsData);
	        } catch (error) {
	            console.log('Error parsing cart data:', error);
	        }
	    } else {
	  
	    }		
	}

	function removeUrlParam(param) {
        const url = new URL(window.location);
		url.searchParams.delete(param);
		history.replaceState(null, '', url.toString());
    }

	function renderCheckoutPage() {
		//1. Check for any new add request
		const urlParams = new URLSearchParams(window.location.search);
		const itemId = urlParams.get('addItem');
		if (itemId) {
			addToCart(itemId)
			removeUrlParam('addItem')
		}

		//2. Render Cart
		renderCartForUser();
	}

	function renderCartForUser() {
        
        var myCart = retrieveCart();

		//For logged in user - pass cart, discount to backend and validate
		//For not-logged in - render based on local cart
        if (myCart.length > 0) {

        	var isLoggedIn = getUserToken();
        	if(isLoggedIn) {
		        	var discountCode = localStorage.getItem("crisprCartDiscountCode") ? localStorage.getItem("crisprCartDiscountCode") : "";

					var cartVerificationRequest = {
			          "url": "https://crisprtech.app/crispr-apis/user/checkout/validate-user-cart.php",
			          "method": "POST",
			          "timeout": 0,
			          "headers": {
			            "Content-Type": "application/json",
			            "Authorization": getUserToken()
			          },
			          "data" : JSON.stringify({
			          	"cart": myCart,
			          	"code": discountCode
			          })
			        };

					$.ajax(cartVerificationRequest).done(function (cartResponse) {
				        if(cartResponse.status == "success") {
				        	renderCartItems(myCart, cartResponse.data); //TODO: What if validation failed?
				        } else {
				        	localStorage.setItem("crisprCart", JSON.stringify({}));
				            showToaster(cartResponse.message);
				        }
				    });
        	} else {
        		renderCartItems(myCart);
        	}

        } else {
            renderNoItemsInCartMessage();
        }
	}


	//Validate Course ID from backend, and add to local cart
	function addToCart(courseId) {

		var courseRequest = {
          "url": "https://crisprtech.app/crispr-apis/public/courses.php?code="+courseId,
          "method": "POST",
          "timeout": 0,
          "headers": {
            "Content-Type": "application/json"
          }
        };

		$.ajax(courseRequest).done(function (courseResponse) {
	        if(courseResponse.status == "success" && courseResponse.data && courseResponse.data['code'] == courseId) {
	        	const courseData = courseResponse.data;

			    forgetCouponCodeApplied();

				var itemData = {
			        "itemId": courseData.code,
			        "title": courseData.title,
			        "type": courseData.type,
			        "unitPrice": courseData.sellingPrice,
			        "number": 1
			    }

			    var myCart = retrieveCart();
			    var isFound = false;
		        for (var i = 0; i < myCart.length; i++) {
		            var cartItem = myCart[i];
		            if (cartItem.itemId == courseId) {
		                cartItem.number++;
		                isFound = true;
		            }
		        }

		        if(!isFound)
		        	myCart.push(itemData);

		        localStorage.setItem("crisprCart", JSON.stringify(myCart));
		        window.location.reload(true);
	        } else {
	            showToaster("Course selected is invalid or no more available for purchase");
	        }
	    });
	}

	function removeFromCart(itemIdToRemove){
		forgetCouponCodeApplied();

        var myCart = retrieveCart();;
        for (var i = 0; i < myCart.length; i++) {
            var cartItem = myCart[i];
            if (cartItem.itemId == itemIdToRemove) {
                myCart.splice(i, 1);
                i--;
            }
        }

        localStorage.setItem("crisprCart", JSON.stringify(myCart));
        renderCartForUser();
	}

	function renderNoItemsInCartMessage() {
		document.getElementById("containerContent").innerHTML = '<h1 style=" font-size: 21px; font-weight: 300; text-align: center; width: 100%; margin: 50px 0; ">Oho! There is nothing here, something went wrong. <a href="https://crisprlearning.com" style=" display: block; font-size: 70%; margin-top: 20px; ">Take Me Home</a></h1>';
	}

	const DEFAULT_COURSE_PIC = 'https://img.icons8.com/color/96/book.png';
	const DEFAULT_TEST_PIC = 'https://img.icons8.com/color/96/system-information.png';
	function getCartImage(cartItem) {
		if(cartItem.displayImage)
			return cartItem.displayImage;

		if(cartItem.type == "Test Series")
			return DEFAULT_TEST_PIC;

		return DEFAULT_COURSE_PIC;
	}

	function formatAmount(amount) {
	    return (amount / 100).toFixed(2);
	}


	function renderCartSummary(cartItems, verifiedData) { //if isValidatedCart = false, render only item sum
		var htmlContent = '';
		if(verifiedData) {

			const summary = verifiedData.summary;

			var taxContent = '';
			for (const taxItem of verifiedData.summary.taxes) {
				taxContent = taxContent +
					'<div class="summary-item"> <span>'+taxItem.label+'</span> <span>₹'+formatAmount(taxItem.value)+'</span> </div>';
			}

			var otherContent = '';
			for (const otherItem of verifiedData.summary.extras) {
				otherContent = otherContent +
					'<div class="summary-item"> <span>'+otherItem.label+'</span> <span>₹'+formatAmount(otherItem.value)+'</span> </div>';
			}

			htmlContent = '' +
					'<div class="summary-item"> <span>Subtotal</span> <span>₹'+formatAmount(summary.subTotal)+'</span> </div>'+
	                (summary.discount.amount > 0 ? '<div class="summary-item"> <span>Discounts</span> <span>-₹'+formatAmount(summary.discount.amount)+'</span> </div>' : '')+
	                taxContent + otherContent +
	                '<div class="summary-item total"> <span>Total</span> <span class="price">₹'+formatAmount(summary.totalPayable)+'</span> </div>';
		} else {

			//For local rendering only
			for(var i = 0; i < cartItems.length; i++) {
				var cartItem = cartItems[i];
				var rowPrice = cartItem.unitPrice * cartItem.number;

				totalTax +=  rowPrice * (cartItem.applicableTotalTax / 10000);
				subTotal += rowPrice;
			}
			var grandTotal = subTotal;


			htmlContent = '' +
					'<div class="summary-item"> <span>Subtotal</span> <span>₹'+formatAmount(subTotal)+'</span> </div>'+
	                '<div class="summary-item total"> <span>Total</span> <span class="price">₹'+formatAmount(grandTotal)+'<span class="superscript" style="font-weight: 300">†</span></span> </div>' +
	                '<div class="summary-item" style="font-size: 10px"> <span>Taxes and other charges if applicable, would be computed once user validates their mobile number. Please authenticate your mobile number to redeem Gift Codes<span class="superscript">†</span></span></div>';
	    }

        document.getElementById("crisprCartSummary").innerHTML = htmlContent;
	}



	function renderCartItems(cartItemsFromLocal, verifiedData) {

		var cartItems;
		if(verifiedData){
			cartItems = verifiedData.cart;
		} else {
			cartItems = cartItemsFromLocal; //Render local cart by default
		}

		var htmlContent = '';
		for(var i = 0; i < cartItems.length; i++) {
			var cartItem = cartItems[i];
			htmlContent += '' +
				'<div class="summary-item">'+
                    '<span class="summary-item-remove" title="Remove" data-item-id="'+cartItem.itemId+'"><i class="fa fa-trash"></i></span>'+
                    '<div class="product-info">'+
                        '<img src="'+getCartImage(cartItem)+'" alt="">'+
                        '<div class="product-details">'+
                            '<span class="product-name">'+cartItem.title+'</span>'+
                            '<span class="product-size">x '+cartItem.number+'</span>'+
                        '</div>'+
                    '</div>'+
                    '<span class="price">₹'+formatAmount(cartItem.unitPrice)+'</span>'+
                '</div>';
		}

		document.getElementById("crisprCartItems").innerHTML = htmlContent;

		document.getElementById("crisprCartItems").addEventListener("click", function(event) {
		    if (event.target.closest(".summary-item-remove")) {
		        const itemId = event.target.closest(".summary-item-remove").dataset.itemId;
		        removeFromCart(itemId);
		    }
		});

		renderCouponSummary(verifiedData);
		renderCartSummary(cartItems, verifiedData);
	}


	function getFormattedCouponCode(discountsData) {
		if(discountsData && discountsData.code)
			return discountsData.code;
		return "";
	}


	function renderCouponSummary(verifiedData) {

		if(!verifiedData) {
			return;
		}

		var discountsData = verifiedData.summary.discount;
		var isApplied = discountsData.amount > 0;
		
		var htmlContent = '';

		if(isApplied) {
			htmlContent += '<input type="text" placeholder="Gift card or discount code" id="giftCodeUsed" value="'+discountsData.code+'" disabled>';
			htmlContent += '<button class="apply-btn" id="removeCodeButton">Remove</button>';
			document.getElementById("giftVoucherSection").innerHTML = htmlContent;

			document.getElementById("removeCodeButton").addEventListener("click", function(event) {
			    forgetCouponCodeApplied();
			    renderCartForUser();
			});
		} else {
			htmlContent += '<input type="text" placeholder="Gift card or discount code" id="giftCodeUsed" value="">';
			htmlContent += '<button class="apply-btn" id="applyCodeButton">Apply</button>';
			document.getElementById("giftVoucherSection").innerHTML = htmlContent;

			document.getElementById("applyCodeButton").addEventListener("click", function(event) {
			    var giftCode = document.getElementById("giftCodeUsed").value;
			    if(!giftCode || giftCode == "")
			    	return;

			    giftCode = giftCode.trim();
			    rememberCouponCodeApplied(giftCode);
			    renderCartForUser();
			});

			forgetCouponCodeApplied();
		}
	}


	//Default rendering
	renderCheckoutPage();

	/**** TOASTER *****/
	function showToaster(message) {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.classList.add('show');

        setTimeout(() => {
            toaster.classList.remove('show');
        }, 3000);
    }


	/**** ORDER CREATION AND PAYMENT ****/
	function initiatePayment() {

		var myCart = retrieveCart();
		var discountCode = getCouponCodeApplied();

		var mobile = document.getElementById("mobileRegistered").value;
		var name = document.getElementById("fullname").value;
		var address = document.getElementById("address").value;
		var locality = document.getElementById("locality").value;
		var city = document.getElementById("city").value;
		var pincode = document.getElementById("pincode").value;
		var state = document.getElementById("state").value;
		var email = document.getElementById("email").value;

		var billingAddress = {
		    "mobile": mobile,
		    "name": name,
		    "address": address,
		    "locality": locality,
		    "city": city,
		    "pincode": pincode,
		    "state": state,
		    "email": email
		};


		console.log(JSON.stringify(billingAddress))
		console.log(discountCode)
		//1. Call API to validate
		//2. If failed, clear cache
		//3. Else initiate payment

		var createOrderAPI = {
			  "url": "https://crisprtech.app/crispr-apis/user/checkout/process-purchase.php",
			  "method": "POST",
			  "timeout": 0,
			  "headers": {
			    "Authorization": getUserToken(),
			    "Content-Type": "application/json"
			  },
			  "data": JSON.stringify({
			    "cart": myCart,
			    "discountCode": discountCode,
			    "billingAddress": billingAddress
			  })
		};

		$.ajax(createOrderAPI).done(function (response) {
			if(response.status == "success") {
				var paymentDetails = response.data;
	            var options = {
	                "key": paymentDetails.key,
	                "order_id": paymentDetails.order,
	                "amount": paymentDetails.amount,
	                "name": "Crispr Learning",
	                "description": "Payment for Course Purchase",
	                "image": "https://candidate.crisprlearning.com/assets/logo/crispr-logo-for-bright-bg.png",
	                "handler": function (payment_response){
	                    var data = {};
	                    data.orderID = paymentDetails.order;
	                    data.transactionID = payment_response.razorpay_payment_id;
	                    data.razorpay_order_id = payment_response.razorpay_order_id;
	                    data.razorpay_signature = payment_response.razorpay_signature;

	                    processPayment(data);
		    			function processPayment() {
		    				console.log(JSON.stringify(data))
		    				clearCheckoutData();
		    				window.location.href="https://candidate.crisprlearning.com/"; //Redirect to Canidate Portal
		    			}
	            	},
	                "prefill": {
	                    "name": name,
	                    "contact": mobile,
	                    "email": email
	                },
	                "notes": {
	                    "Crispr Order #": paymentDetails.transactionId
	                },
	                "theme": {
	                    "color": "#016375"
	                }
	            };

	            var rzp1 = new Razorpay(options);
	            rzp1.open();
	            e.preventDefault();

            } else {
            	showToaster(response.error || "Something went wrong, payment was not initiated");
            }
		});
	}


	//Razorpay Button
	if(document.getElementById("payNowButton")) {
		document.getElementById("payNowButton").addEventListener("click", function(event) {
		    initiatePayment();
		});
	}

});