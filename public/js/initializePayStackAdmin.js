'use strict';

function payWithPaystack() {
    let senderName = document.getElementById('senderName').value;
    let senderEmail = document.getElementById('senderEmail').value;
    let shippingAmountString = document.getElementById("shippingAmount").innerText;
    let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

    fetch('/payment', {
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
        // Open the authorization URL in a new tab
        window.open(data.data.authorization_url, '_blank');

        // Verify payment after a delay (adjust as needed)
        setTimeout(() => {
            console.log('Verifying payment for reference:', data.data.reference);
            verifyPayment(data.data.reference);
        }, 3000); // Adjust delay as needed
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
    });
}


function verifyPayment(reference) {
    fetch(`/verifyPayment/${reference}`, {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to verify payment');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Payment verified successfully');
            // Enable the "Next" button if payment is successful
            document.getElementById('nextButton').disabled = false;
        } else {
            console.log('Payment verification failed');
            // Disable the "Next" button if payment verification fails
            document.getElementById('nextButton').disabled = true;
            alert('Payment verification failed. Please try again or contact support.');
        }
    })
    .catch(error => {
        console.error('Error verifying payment:', error);
        // Disable the "Next" button in case of an error
        document.getElementById('nextButton').disabled = true;
        alert('An error occurred while verifying the payment. Please try again or contact support.');
    });
}
