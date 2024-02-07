// function validateFormAndPay() {
//   // Check if all fields are filled
//   let fields = document.querySelectorAll('#msform input[type="text"], #msform input[type="email"],  #msform input[type="select"]');
//   let allFilled = true;
//   for (let i = 0; i < fields.length; i++) {
//     if (fields[i].value === '') {
//       allFilled = false;
//       break;
//     }
//   }

//   if (allFilled) {
//     // Proceed with the payment
//     initiatePayment();
//   } else {
//     // Redirect to the form page with an error message
//     alert('Please fill all the fields before making the payment.');
//   setTimeout(function() {
//     window.location.href = '/admin/createNewLabel';
//   }, 10000);
//   }
// }

// function payWithPaystack() {
 
//   // Get the shipping amount from the displayed element
//   let shippingAmountString = document.getElementById("shippingAmount").innerText;
//   // Remove the "Shipping Amount: NGN " prefix and convert the amount to a floating-point number
//   let shippingAmount = parseFloat(shippingAmountString.replace("Shipping Amount: NGN ", ""));

//   let handler = PaystackPop.setup({
//     key: 'pk_test_b271331b5d85648dc35b3ec7642cfdafd976a340',
//     // Get the value of the sender's email input field
//     name: document.getElementById('senderName').value,
//     // Get the value of the sender's email input field
//     email: document.getElementById('senderEmail').value,
//     // Calculate the payment amount by multiplying the shipping amount by 100 (to convert it to kobo)
//     amount: shippingAmount * 100,
//     // Generate a random reference number
//     reference: newReferenceNumber(),
//     // Define the onClose callback function
//     onClose: function () {
//       alert('Window closed.');
//     },
//     // Define the callback function for when the payment is complete
//     callback: function (response) {
//       // Create a message containing the payment reference
//       let message = 'Payment complete! Reference: ' + response.reference;
//       alert(message);

//     }
//   });

//   // Open the PaystackPop iframe
//   handler.openIframe();
// }

// function newReferenceNumber() {
//     const prefix = 'REF';
//     const uniqueNumber = generateUniqueNumber();
//     return `${prefix}${uniqueNumber}`;

// function generateUniqueNumber() {
//     return Math.floor(10000000 + Math.random() * 90000000); // Ensure 8 digits
// }

// }





'use strict';

function validateFormAndPay() {
  // Check if all fields are filled
  let fields = document.querySelectorAll('#msform input[type="text"], #msform input[type="email"],  #msform input[type="select"]');
  let allFilled = true;
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].value === '') {
      allFilled = false;
      break;
    }
  }

  if (allFilled) {
    // Proceed with the payment
    initiatePayment();
  } else {
    // Redirect to the form page with an error message
    alert('Please fill all the fields before making the payment.');
  setTimeout(function() {
    window.location.href = '/admin/createNewLabel';
  }, 10000);
  }
}

// Function to initiate payment with Paystack
function initiatePayment() {
  // Get payment details from the UI
  let amount = parseFloat(document.getElementById('shippingAmountInput').value);
  let email = document.getElementById('senderEmail').value;
  let reference = newReferenceNumber();

  // Make AJAX request to server to initiate payment
  fetch('/acceptpayment', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, email, reference })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to initiate payment');
      }
      return response.json();
  })
  .then(data => {
      // Redirect user to Paystack payment page
      window.location.href = data.authorization_url;
  })
  .catch(error => {
      console.error('Error initiating payment:', error);
      alert('Error initiating payment. Please try again later.');
  });
}


function newReferenceNumber() {
    const prefix = 'REF';
    const uniqueNumber = generateUniqueNumber();
    return `${prefix}${uniqueNumber}`;

function generateUniqueNumber() {
    return Math.floor(10000000 + Math.random() * 90000000); // Ensure 8 digits
}

}