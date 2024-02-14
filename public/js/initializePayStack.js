// 'use strict';
// // Function to handle payment with Paystack
// function payWithPaystack() {
   
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
    // .then(data => {
    //     let handler = PaystackPop.setup({
    //         // key: data.secretKey,
    //         name: senderName,
    //         email: senderEmail,
    //         amount: shippingAmount * 100,
    //         currency: 'NGN',
    //         onClose: function () {
    //             alert('Window closed.');
    //         },
    //         callback: function (response) {
    //             let message = 'Payment complete! Reference: ' + response.reference;
    //             alert(message);
    //             // // Call verifyPayment function after successful payment
    //             // verifyPayment(response.reference);
    //         }
    //     });
    //     handler.openIframe();
    // })
//     .catch(error => {
//         console.error('Error initiating payment:', error);
//         // Handle error as needed
//     });
// }

'use strict';

function payWithPaystack() {
    let senderName = document.getElementById('senderName').value;
    let senderEmail = document.getElementById('senderEmail').value;
    let shippingAmountString = document.getElementById("shippingAmount").innerText;
    let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

    // Send payment request to server
    fetch('/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: senderName, email: senderEmail, amount: shippingAmount })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to initiate payment');
        }
        return response.json();
    })
    .then(data => {
        console.log(data); // Log the response data to the console for debugging

        // Check if the authorization URL is present in the response
        if (data && data.data && data.data.authorization_url) {
            // Open the Paystack form
            openPaystackForm(data.data.authorization_url);
        } else {
            throw new Error('Authorization URL not found in the response');
        }
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
        // Handle error as needed
    });
}

function openPaystackForm(authorizationUrl) {
    // Create an iframe element
    const iframe = document.createElement('iframe');
    
    // Set the source of the iframe to the Paystack authorization URL
    iframe.src = authorizationUrl;
    
    // Set the attributes for the iframe
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '600px'); // Adjust height as needed
    
    // Append the iframe to the document body
    document.body.appendChild(iframe);
}
