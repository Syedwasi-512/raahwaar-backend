const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    name : {type: String , required: true},
    email: {type: String , required: true, match:[/^\S+@\S+\.\S+$/, 'Please enter a valid email']},
    phone: {type: String , required: true ,  match: [/^(\+92|0)?(3[0-9]{9}|[1-9][0-9]{8})$/, 'Please enter a valid Pakistani phone number']},
    shippingAddress:{type: String , required: true},
    
    products : [{
        productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product' , required: true},
        quantity: {type: Number , required: true, default:1 , min:1}
    }
],
    totalAmount: {type: Number, required: true , min: 0},
    status: {
        type: String,
        enum: ['Pending' , 'Confirmed' , 'Shipped' , 'Delivered' , 'Cancelled'],
        default: 'Pending'
    },
    isConfirmed:{type:Boolean , default: false},
    confirmationToken: {type: String , unique: true, sparse: true},  //for unique token
    confirmationTokenExpires: {type: Date},

    cancelledAt: Date
}, {timestamps: true});


orderSchema.index({ status: 1, isConfirmed: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ phone: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order' , orderSchema);