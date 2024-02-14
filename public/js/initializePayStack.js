


// 'use strict';
// // Function to handle payment with Paystack
// function payWithPaystack() {
//     // Validate the form
//     if (!validateForm()) {
//         alert("Please fill in all the required fields.");
//         return; // Exit the function if form validation fails
//     }

//     let senderName = document.getElementById('senderName').value;
//     let senderEmail = document.getElementById('senderEmail').value;
//     let shippingAmountString = document.getElementById("shippingAmount").innerText;
//     // Remove the "Shipping Amount: NGN " prefix and convert the amount to a floating-point number
//     let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

//     // Send payment request to server
//     fetch('/pay', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ name:senderName, email:senderEmail, amount:shippingAmount })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Failed to initiate payment');
//         }
//         return response.json();
//     })
//     .then(data => {
//           // Redirect to Paystack authorization URL
//           window.open(data.data.authorization_url, '_blank');
        
//     })
//     .catch(error => {
//         console.error('Error initiating payment:', error);
//         // Handle error as needed
//     });
// }




'use strict';
// Function to handle payment with Paystack
function payWithPaystack() {
    // Validate the form
    if (!validateForm()) {
        alert("Please fill in all the required fields.");
        return; // Exit the function if form validation fails
    }

    let senderName = document.getElementById('senderName').value;
    let senderEmail = document.getElementById('senderEmail').value;
    let shippingAmountString = document.getElementById("shippingAmount").innerText;
    // Remove the "Shipping Amount: NGN " prefix and convert the amount to a floating-point number
    let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

    // Send payment request to server
    fetch('/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name:senderName, email:senderEmail, amount:shippingAmount })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to initiate payment');
        }
        return response.json();
    })
    .then(data => {
          // Redirect to Paystack authorization URL
          window.open(data.data.authorization_url, '_blank');
        
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
        // Handle error as needed
    });
}




