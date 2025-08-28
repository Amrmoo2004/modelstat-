  import e from "express";
  import mongoose from "mongoose";
     const orderitemschema = new mongoose.Schema({
  productid: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  name: {
    type: String,
    required: true
  },
  images: [{ 
    secure_url: String,
    url: String,
    public_id: String,
    asset_id: String
  }],
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  sizes: [{
    type: String,
    required: false 
  }]
}, {_id: false});

const orderschema = new mongoose.Schema({
  user: {
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
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['PayPal', 'VISA/MASTERCARD', 'Credit Card', 'fawry', 'VODAFONE CASH', 'Cash on Delivery'],
    default: 'VISA/MASTERCARD'
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
  paymentstatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'  
  },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
  }
}, { 
  timestamps: true 
});
  export const ordermodel = mongoose.model("Order", orderschema);
  export default ordermodel;
