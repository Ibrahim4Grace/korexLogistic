 function generateTrackingID() {
  const prefix = 'NG';
  let trackingID;

  const uniqueNumber =  generateUniqueNumber();  // Ensure to await the promise
  trackingID = `${prefix}${uniqueNumber}`;

  return trackingID;
}

// Function to generate a unique number
function generateUniqueNumber() {
  return Math.floor(10000000 + Math.random() * 90000000); // Ensure 8 digits
}

module.exports = generateTrackingID;