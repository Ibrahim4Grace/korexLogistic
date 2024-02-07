'use strict';
// Client-side function to update shipping amount
function updateShippingAmount() {
    let shippingMethod = document.getElementsByName("shippingMethod")[0].value;
    let recipientState = document.getElementsByName("recipientState")[0].value;

    // Make an AJAX request to the server to calculate shipping fee
    fetch('/calculate-shipping-fees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shippingMethod, recipientState })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to calculate shipping fee');
        }
        return response.json();
    })
    .then(data => {
        // Log the value of data.shippingFee
        console.log("Shipping Fee:", data.shippingFee);
          // Ensure shippingFee is a number before applying toFixed
          let shippingAmount = parseFloat(data.shippingFee);
          if (isNaN(shippingAmount)) {
              // Handle the case where shippingAmount is not a number (e.g., set a default value)
              shippingAmount = 0;
            }
            // Update the hidden input field value
        document.getElementById("shippingAmountInput").value = shippingAmount.toFixed(2);
        // Update the displayed amount
        document.getElementById("shippingAmount").innerText = "Shipping Amount: NGN " + shippingAmount.toFixed(2);
    })
    .catch(error => {
        console.error('Error calculating shipping fee:', error);
        // Display a user-friendly error message on the UI
        document.getElementById("shippingAmount").innerText = "Error: Unable to calculate shipping fee. Please try again later.";
    });
};
