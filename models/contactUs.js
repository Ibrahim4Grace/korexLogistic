const mongoose = require(`mongoose`);
const contactSchema = new mongoose.Schema({

    contactUsName:{
        type: String,
        required: true
    },
    contactUsEmail:{
        type: String,
        required: true
    },
    contactUsNumber:{
        type: String,
        required: true
    },
    contactUsSubject:{
        type: String,
        required: true
    },
    contactUsMsg:{
        type: String,
        required: true
    },
    date_added: {
        type: Date,
        default: Date.now()
    }
   

});



const ContactUs = mongoose.model('ContactUs', contactSchema);

module.exports =  ContactUs

