import e from "express";
import mongoose from "mongoose";
     const orderitemschema = new mongoose.Schema({
 products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
   name: {
    type: String,
    required: true
  },
  images: [{
    secure_url: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },
    asset_id: {
      type: String
    }
  }],
  price:{
    type: Number
  },
  sizes: [{
    type: String,
    required: false 
  }],
    }  ,{_id:false}
)  
const orderschema = new mongoose.Schema({
user :{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
orderitems: [orderitemschema],
shippingAddress: {
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
  
},
paymentMethod: {
    type: String,
    required: true,
    enum: ['PayPal', 'Credit Card', 'Bank Transfer', 'Cash on Delivery'],
    default: 'PayPal'

}, 
tottalprice: {
    type: Number,
    required: true,
    default: 0.0
},  
ispaid: {
    type: Boolean,
    default: false
},
paidAt: {
    type: Date
},
deliveredAt: {
    type: Date
},
isdelivered: {
    type: Boolean,
    default: false
},
createdAt: {
    type: Date,
    default: Date.now
},
paymentstatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'  
},
status: {
    type: String,
    enum: [ 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
}
}, { timestamps: true });   
 export const ordermodel = mongoose.model("Order", orderschema);
export default ordermodel;
