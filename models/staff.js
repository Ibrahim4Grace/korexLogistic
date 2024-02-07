const mongoose = require(`mongoose`);
const staffSchema = new mongoose.Schema({

    staffName:{
        type: String,
        required: true
    },
    staffDob:{
        type: String,
        required: true
    },
    staffEmail:{
        type: String,
        required: true
    },
    staffNumber:{
        type: String,
        required: true
    }, 
    staffPosition:{
        type: String,
        required: true
    }, 
     staffAddress:{
        type: String,
        required: true
    },
    staffCity:{
        type: String,
        required: true
    },
    staffState:{
        type: String,
        required: true
    },
    staffEmergencyName:{
        type: String,
        required: true
    },
    staffEmergencyNumber:{
        type: String,
        required: true
    },
    staffEmployDate:{
        type: String,
       
    },
    image: {

        data: Buffer,
        contentType: String
    },
    date_added:{
        type: Date,
        default: Date.now()
    },
    

});

const paymentSchema = new mongoose.Schema({
  
    staffName: {
        type: String,
        required: true
    },
    staffEmail: {
        type: String,
    },
    staffPosition: {
        type: String,
        required: true
    },
    staffNumber: {
        type: String,
        required: true
    },
    paymentPurpose: {
        type: String,
        required: true
    },
    totalAmount: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
    },
    paymentDate: {
        type: String,
        required: true
    },
    date_added:{
        type: Date,
        default: Date.now()
    },
    
});



const Staff = mongoose.model('CompanyStaff', staffSchema);
const StaffPayment = mongoose.model('staffPayment', paymentSchema);

module.exports = {
    Staff,
    StaffPayment
};
