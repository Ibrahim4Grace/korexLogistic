'use strict';

document.addEventListener("DOMContentLoaded", function () {
    const enquiryForm = document.getElementById("enquiryForm");
    const thankYouMessage = document.getElementById("thankYouMessage");

    if (enquiryForm && thankYouMessage) {
        // Add an event listener to the form submission
        enquiryForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent default form submission

            // Optional: Hide the form after submission
            enquiryForm.style.display = "none";

            try {
                const response = await fetch(enquiryForm.action, {
                    method: enquiryForm.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Object.fromEntries(new FormData(enquiryForm))),
                });

                if (response.ok) {
                    // Show the "thank you" message
                    thankYouMessage.style.display = "block";

                    // Optional: Clear the form fields
                    enquiryForm.reset();
                } else {
                    console.error('Failed to submit the form.');
                }
            } catch (error) {
                console.error('An error occurred during form submission:', error);
            }
        });
    }
});
