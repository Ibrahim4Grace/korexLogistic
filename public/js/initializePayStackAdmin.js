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
        const paymentWindow = window.open(data.data.authorization_url, '_blank');

        // Check for payment completion every few seconds
        const intervalId = setInterval(() => {
            verifyPayment(data.data.reference)
            .then(data => {
                if (data.success) {
                    // Payment verified successfully
                    clearInterval(intervalId); // Stop checking for verification
                    paymentWindow.close(); // Close the payment window
                    // Enable the "Next" button if payment is successful
                    document.getElementById('nextButton').disabled = false;
                } else {
                    // Payment verification failed or still pending
                    console.log('Payment verification failed or pending');
                }
            })
            .catch(error => {
                console.error('Error verifying payment:', error);
                // Disable the "Next" button in case of an error
                document.getElementById('nextButton').disabled = true;
                alert('An error occurred while verifying the payment. Please try again or contact support.');
                clearInterval(intervalId); // Stop checking for verification
            });
        }, 5000); // Adjust delay as needed
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
    });
}

async function verifyPayment(reference) {
    const response = await fetch(`/verifyPayment/${reference}`);
    if (!response.ok) {
        throw new Error('Failed to verify payment');
    }
    return response.json();
}
