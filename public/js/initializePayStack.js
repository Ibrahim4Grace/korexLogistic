// 'use strict';
// function payWithPaystack() {
//     // Validate the form
//     if (!validateForm()) {
//         alert("Please fill in all the required fields.");
//         return; // Exit the function if form validation fails
//     }

//     let senderName = document.getElementById('senderName').value;
//     let senderEmail = document.getElementById('senderEmail').value;
//     let shippingAmountString = document.getElementById("shippingAmount").innerText;
//   // Remove the "Shipping Amount: NGN " prefix and convert the amount to a floating-point number
//   let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

//     fetch('/pay', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ senderName, senderEmail,shippingAmount })
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Failed to initiate payment');
//         }
//         return response.json();
//     })
//     .then(data => {
//         let handler = PaystackPop.setup({
//             key: data.secretKey,
//             name: senderName,
//             email: senderEmail,
//             amount: shippingAmount * 100,
//             reference: data.reference,
//             onClose: function () {
//                 alert('Window closed.');
//             },
//             callback: function (response) {
//                 let message = 'Payment complete! Reference: ' + response.reference;
//                 alert(message);
//             }
//         });
//         handler.openIframe();
//     })
//     .catch(error => {
//         console.error('Error initiating payment:', error);
//         // Handle error as needed
//     });
// };

// function validateForm() {
//     let isValid = true;
//     $("input[required], select[required]").each(function () {
//         if ($(this).val() === "") {
//             isValid = false;
//             return false; // Break out of the loop if any required field is empty
//         }
//     });
//     return isValid;
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
        let handler = PaystackPop.setup({
            key: data.PAYSTACK_SECRET,
            name: senderName,
            email: senderEmail,
            amount: shippingAmount * 100,
            currency: 'NGN',
            ref: ''+Math.floor((Math.random() * 1000000000) + 1),
            onClose: function () {
                alert('Window closed.');
            },
            callback: function (response) {
                let message = 'Payment complete! Reference: ' + response.reference;
                alert(message);
                // Call verifyPayment function after successful payment
                verifyPayment(response.reference);
            }
        });
        handler.openIframe();
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
        // Handle error as needed
    });
}

// Function to verify payment status
function verifyPayment(reference) {
    fetch('/verify-payment/:reference', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to verify payment');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Enable Next button after successful payment verification
            enableNextButton();
        } else {
            // Handle payment verification failure
            console.error('Payment verification failed:', data.message);
        }
    })
    .catch(error => {
        console.error('Error verifying payment:', error);
        // Handle error as needed
    });
}

// Function to enable the Next button
function enableNextButton() {
    document.getElementById('nextButton').disabled = false;
}

// Function to validate the form
function validateForm() {
    let isValid = true;
    $("input[required], select[required]").each(function () {
        if ($(this).val() === "") {
            isValid = false;
            return false; // Break out of the loop if any required field is empty
        }
    });
    return isValid;
}
