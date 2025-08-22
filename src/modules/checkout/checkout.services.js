import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import { productmodel } from "../DB/model/product.js";
import mongoose from 'mongoose';
import ordermodel from "../DB/model/order.js";
import { cartmodel } from '../DB/model/cart.js';
export const createCheckout = asynchandler(async (req, res, next) => {
  try {
    const cart = await cartmodel.findOne({ userId: req.user._id })
      .populate('items.productId', 'name_ar name_en price images stock');
    
    if (!cart || cart.items.length === 0) {
      return next(new Error('Cart is empty', { cause: 400 }));
    }
    
    const checkout = new Checkoutmodel({
      user: req.user._id,
      checkoutItems: cart.items.map(item => {
        const productName = item.productId.name_en || item.productId.name_ar || 'Unknown Product';
        
        return {
          product: item.productId._id,
          name: productName,
          price: item.price,
          quantity: item.quantity,
          images: item.image ? [{
            secure_url: item.image,
            url: item.image,
            public_id: `cart_${Date.now()}`
          }] : item.productId.images || [],
          sizes: item.sizes || [],
          colour: item.colour || ''
        };
      }),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      totalPrice: cart.total,
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
    return next(new Error('Failed to create checkout: ' + error.message, { cause: 500 }));
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
        productid: [item.product], 
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        images: item.images, 
        sizes: item.sizes || []
      })),
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      paymentstatus: "completed",
      tottalprice: checkout.totalPrice,
      ispaid: true,
      paidAt: checkout.paidAt,
      isdelivered: false,
      status: 'Processing'
    });
    
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();
    
    await cartmodel.findOneAndUpdate(
      { user: checkout.user },
      { $set: { items: [] } }
    );
    
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