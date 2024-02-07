const mongoose = require(`mongoose`);
const expenseSchema = new mongoose.Schema({

    expenseType: {
        type: String,
        required: true
    },
    expenseAmount: {
        type: String,
        required: true
    },
    expenseVendor: {
        type: String,
        required: true
    },
    expenseAuthorizedBy: {
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
    expenseDate: {
        type: String,
        required: true
    },
    image: {
        data:Buffer,
        contentType:String
    },
    date_added: {
        type: Date,
        default: Date.now()
    }

});



const CompanyExpenses = mongoose.model('CompanyExpenses', expenseSchema);

module.exports =  CompanyExpenses

