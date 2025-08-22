import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import { productmodel } from "../DB/model/product.js";
import mongoose from 'mongoose';
import ordermodel from "../DB/model/order.js";
import { cartmodel } from '../DB/model/cart.js';
export const createCheckout = asynchandler(async (req, res, next) => {
  const { checkoutItems, totalPrice, shippingAddress, paymentMethod } = req.body;
  
  // Validate required fields - use CORRECT field names
  if (!checkoutItems || checkoutItems.length === 0) {
    return next(new Error('Checkout items are required', { cause: 400 }));
  }
  
  if (!shippingAddress || !paymentMethod || !totalPrice) {
    return next(new Error('Missing required fields: shippingAddress, paymentMethod, or totalPrice', { cause: 400 }));
  }

  try {
    const checkout = new Checkoutmodel({
      user: req.user._id,
      checkoutItems,  // Note: camelCase 'checkoutItems' not 'checkoutitems'
      totalPrice,     // Note: camelCase 'totalPrice' not 'totalprice'
      shippingAddress,
      paymentMethod,
      isPaid: false,
      paymentStatus: 'Pending'
    });
    
    await checkout.save();
    
    return res.status(201).json({
      success: true,
      message: 'Checkout created successfully',
      checkout: checkout
    });
    
  } catch (error) {
    console.error(error);
    return next(new Error('Failed to create checkout', { cause: 500 }));
  }
});


export const updateafterpayment = asynchandler(async (req, res, next) => {
  const { paymentStatus, paymentDetails, transactionId } = req.body;
  
  if (!paymentStatus) {
    return next(new Error('Payment status is required', { cause: 400 }));
  }
  
  const checkout = await Checkoutmodel.findById(req.params.id);
  if (!checkout) {
    return next(new Error('Checkout not found', { cause: 404 }));
  }
  
  if (checkout.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return next(new Error('Unauthorized to update this checkout', { cause: 403 }));
  }
  
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(paymentStatus.toLowerCase())) {
    return next(new Error('Invalid payment status', { cause: 400 }));
  }
  
  try {
    checkout.paymentStatus = paymentStatus;
    checkout.paymentDetails = paymentDetails || checkout.paymentDetails;
    
    if (paymentStatus.toLowerCase() === 'paid') {
      checkout.isPaid = true;
      checkout.paidAt = new Date();
      checkout.transactionId = transactionId || checkout.transactionId;
      
      
    }
    
    await checkout.save();
    
    if (paymentStatus.toLowerCase() === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Checkout updated successfully and stock adjusted',
        checkout: checkout
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Checkout updated successfully',
        checkout: checkout
      });
    }
    
  } catch (error) {
    return next(new Error('Failed to update checkout: ' + error.message, { cause: 500 }));
  }
});

export const confirmCheckout = asynchandler(async (req, res, next) => {
  try {
    const checkout = await Checkoutmodel.findById(req.params.id);
    
    if (!checkout) {
      return next(new Error('Checkout not found', { cause: 404 }));
    }
    
    if (checkout.isFinalized) {
      return next(new Error('Checkout is already finalized', { cause: 400 }));
    }
    
    if (!checkout.isPaid) {
      return next(new Error('Checkout is not paid yet', { cause: 400 }));
    }
    
    const finalorder = await ordermodel.create({
      user: checkout.user,
      orderitems: checkout.checkoutItems.map(item => ({
        productid: [item.product], // Wrap in array as OrderModel expects array
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        images: item.images || [], // Directly use the images array from checkout
        sizes: item.sizes || []
      })),
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      paymentstatus: "Completed", 
      tottalprice: checkout.totalPrice, 
      ispaid: true,
      paidAt: checkout.paidAt,
      isdelivered: false, 
      status: 'Processing'
    });
    
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();
    
    await cartmodel.deleteOne({ user: checkout.user });
    
    return res.status(200).json({
      success: true,
      message: 'Checkout confirmed and order created successfully',
      order: finalorder
    });
    
  } catch (error) {
    console.error(error);
    return next(new Error('Failed to confirm checkout: ' + error.message, { cause: 500 }));
  }
});
