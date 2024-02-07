function generateStatusMessage(statusCode, { deliveryTime, deliveryDay, deliveryDate,deliveryYear,recipientCity,recipientState,customerSupportContact }) {

    if (statusCode === 'ShippingLabelCreated') {
        return `Exciting news! Your shipping label has been successfully generated, and Korex Logistics is eagerly awaiting your shipment. Please ensure that your package is securely packed and ready for pickup or drop-off at our designated location. We'll keep you updated on the progress of your shipment. Thank you for choosing Korex Logistics, and we look forward to delivering your item securely and efficiently!`;
    } 
     else if (statusCode === 'InTransit') {
        return `Good news! Your shipment is currently en route to its designated destination. Anticipate delivery before ${deliveryTime} on ${deliveryDay} ${deliveryDate}, ${deliveryYear}, in ${recipientCity} ${recipientState}, NG 23401. A waiver of signature will be applied upon delivery.  We're committed to ensuring the secure and timely arrival of your package. Thank you for choosing Korex Logistics for your shipping needs.`;
    } 
    else if (statusCode === 'OutForDelivery') {
        return `Great news! Your shipment is now out for delivery and is on its way to your location. Please expect the delivery person to arrive before ${deliveryTime} on ${deliveryDay} ${deliveryDate}, ${deliveryYear} in ${recipientCity} ${recipientState}, NG 23401. A waiver of signature will be applied upon successful delivery. Get ready to receive your package, and thank you for choosing Korex Logistics.`;
    }
    else if (statusCode === 'DelayNotification') {
        return `We regret to inform you that there is a delay in the delivery of your item. Our team is actively working to resolve the issue, and we appreciate your patience. Rest assured, we are committed to ensuring the swift and secure delivery of your shipment. Further updates will be provided as soon as available. `;
    } 
    else if (statusCode === 'Cancelled') {
        return `We're sorry to inform you that your shipment has been cancelled. Our team is actively addressing the reasons behind this cancellation. If you did not initiate this cancellation or have any concerns, please contact our customer support immediately at ${customerSupportContact}. We understand the inconvenience this may cause and sincerely apologize for any disruption to your plans. Rest assured, we are committed to resolving this matter promptly and appreciate your understanding.`;
    } 
    else if (statusCode === 'ReturnShipment:') {
        return `Good news! Your return shipment has been initiated and is on its way back to us. Please securely package the item and have it ready for our courier. Our team will contact you shortly to provide further instructions and to ensure a smooth return process. We appreciate your patience and thank you for choosing Korex Logistics.`;
    } 
    else if (statusCode === 'Delivered') {
        return `Congratulations! Your package has been successfully delivered. Delivery was completed at ${deliveryTime} on ${deliveryDay} ${deliveryDate}, ${deliveryYear} in ${recipientCity} ${recipientState}, NG 23401. A waiver of signature was executed during the delivery process. We hope your experience with Korex Logistics has been seamless, and we appreciate your trust in our services. Thank you for choosing Korex Logistics!`;
    } 
    else {
        return 'Unknown Status check back later';
    }
}




 module.exports =  generateStatusMessage;


