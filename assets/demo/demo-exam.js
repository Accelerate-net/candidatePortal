$(document).ready(function() {


    // $('#bootbox-demo-3').click(function(){
    //     bootbox.confirm("Are you sure?", function(result) {
    //      alert("Confirm result: "+result);
    //  }); 
    // });


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

        
        // CRISPR INSIGHTS

        try {
            $('.easypiechart#progressToughness').easyPieChart({
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

    



        /****
         * 
         * CALCULATOR PLACEMENT
         * 
         ****/


        const calculatorContainer = document.getElementById('calculator-container');
        const calculatorHandle = document.getElementById('calculator-handle');
        const closeCalculatorButton = document.getElementById('close-calculator');
        const showCalculatorButton = document.getElementById('show-calculator-button');

        let isDragging = false;
        let offsetX, offsetY;

        // Function to save the calculator's position to localStorage
        const savePosition = () => {
            const position = {
                left: calculatorContainer.style.left,
                top: calculatorContainer.style.top
            };
            localStorage.setItem('calculatorPosition', JSON.stringify(position));
        };

        // Function to load the calculator's position from localStorage
        const loadPosition = () => {
            const savedPosition = localStorage.getItem('calculatorPosition');
            if (savedPosition) {
                const { left, top } = JSON.parse(savedPosition);
                calculatorContainer.style.left = left;
                calculatorContainer.style.top = top;
            }
        };

        // Load the saved position when the page loads
        window.addEventListener('load', loadPosition);

        // Handle drag start (only on header click)
        calculatorHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - calculatorContainer.getBoundingClientRect().left;
            offsetY = e.clientY - calculatorContainer.getBoundingClientRect().top;

            // Prevent scrolling by disabling overflow on the body
            document.body.style.overflow = 'hidden';

            // Add a class to the container for smooth transitions (optional)
            calculatorContainer.classList.add('dragging');
        });

        // Handle dragging (only if dragging is active)
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                // Use requestAnimationFrame for smoother rendering
                requestAnimationFrame(() => {
                    calculatorContainer.style.left = `${e.clientX - offsetX}px`;
                    calculatorContainer.style.top = `${e.clientY - offsetY}px`;

                    // Save the position to localStorage while dragging
                    savePosition();
                });
            }
        });

        // Handle drag end (stop dragging on mouseup)
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;

                // Re-enable scrolling on the body
                document.body.style.overflow = 'auto';

                // Remove the dragging class (optional)
                calculatorContainer.classList.remove('dragging');

                // Save the final position to localStorage
                savePosition();
            }
        });

        // Close calculator
        closeCalculatorButton.addEventListener('click', () => {
            calculatorContainer.style.display = 'none';

            // Clear the saved position when the calculator is closed
            // localStorage.removeItem('calculatorPosition');
        });

        showCalculatorButton.addEventListener('click', () => {
            calculatorContainer.style.display = 'block';
        });
});