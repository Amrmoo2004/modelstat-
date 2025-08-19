import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import { productmodel } from "../DB/model/product.js";
import mongoose from 'mongoose';
import ordermodel from "../DB/model/order.js";
import { cartmodel } from '../DB/model/cart.js';

export const createCheckout = asynchandler(async (req, res, next) => {
  const { checkoutitems, totalprice, shippingAddress, paymentMethod } = req.body;
  
  if (!checkoutitems || checkoutitems.length === 0) {
    return next(new Error('Checkout items are required', { cause: 400 }));
  }
  
  if (!totalprice || totalprice <= 0) {
    return next(new Error('Valid total price is required', { cause: 400 }));
  }
  
  if (!shippingAddress) {
    return next(new Error('Shipping address is required', { cause: 400 }));
  }
  
  if (!paymentMethod) {
    return next(new Error('Payment method is required', { cause: 400 }));
  }
  
  if (!Array.isArray(checkoutitems)) {
    return next(new Error('Checkout items must be an array', { cause: 400 }));
  }
  
  for (const item of checkoutitems) {
    if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
      return next(new Error('Invalid product ID in checkout items', { cause: 400 }));
    }
    if (!item.quantity || item.quantity <= 0) {
      return next(new Error('Invalid quantity in checkout items', { cause: 400 }));
    }
    if (!item.price || item.price <= 0) {
      return next(new Error('Invalid price in checkout items', { cause: 400 }));
    }
  }
  
  const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field]) {
      return next(new Error(`Shipping address ${field} is required`, { cause: 400 }));
    }
  }
  
  try {
    let calculatedTotal = 0;
    
    for (const item of checkoutitems) {
      const product = await productmodel.findById(item.product);
      if (!product) {
        return next(new Error(`Product not found: ${item.product}`, { cause: 404 }));
      }
      
      if (product.stock < item.quantity) {
        return next(new Error(`Insufficient stock for product: ${product.name}`, { cause: 400 }));
      }
      
      calculatedTotal += product.price * item.quantity;
    }
    
    if (Math.abs(calculatedTotal - totalprice) > 0.01) {
      return next(new Error('Total price does not match calculated items total', { cause: 400 }));
    }
  } catch (error) {
    return next(new Error('Failed to validate products: ' + error.message, { cause: 500 }));
  }
  
  try {
    const checkout = await Checkoutmodel.create({
      user: req.user._id,
      checkoutitems: checkoutitems,
      totalprice,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'Pending',
      isPaid: false,
    });
    
    return successResponse(res, 201, 'Checkout created successfully', checkout);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return next(new Error(`Validation error: ${errors.join(', ')}`, { cause: 400 }));
    }
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
      
      for (const item of checkout.checkoutitems) {
        await productmodel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
    }
    
    await checkout.save();
    
    return successResponse(res, 200, 'Checkout updated successfully', checkout);
  } catch (error) {
    return next(new Error('Failed to update checkout: ' + error.message, { cause: 500 }));
  }
});

export const confairmCheckout = asynchandler(async (req, res, next) => {
  const checkout = await Checkoutmodel.findById(req.params.id);
  
  if (!checkout) {
    return next(new Error('Checkout not found', { cause: 404 }));
  }
  
  if (checkout.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return next(new Error('Unauthorized to confirm this checkout', { cause: 403 }));
  }
  
  if (checkout.isFinalized) {
    return next(new Error('Checkout is already finalized', { cause: 400 }));
  }
  
  if (!checkout.isPaid) {
    return next(new Error('Checkout is not paid', { cause: 400 }));
  }
  
  try {
    const order = await ordermodel.create({
      user: checkout.user,
      checkoutItems: checkout.checkoutitems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      paymentStatus: "paid",
      totalPrice: checkout.totalprice,
      isPaid: checkout.isPaid,
      paidAt: checkout.paidAt,
      isdelivered: false,
      status: 'Processing',
      transactionId: checkout.transactionId
    });
    
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    checkout.orderId = order._id;
    await checkout.save();
    
    await cartmodel.deleteMany({ user: checkout.user });
    
    return successResponse(res, 200, 'Checkout finalized successfully', { checkout, order });
  } catch (error) {
    return next(new Error('Failed to finalize checkout: ' + error.message, { cause: 500 }));
  }
});

export const getCheckout = asynchandler(async (req, res, next) => {
  const checkout = await Checkoutmodel.findById(req.params.id);
  
  if (!checkout) {
    return next(new Error('Checkout not found', { cause: 404 }));
  }
  
  // Verify user owns this checkout (unless admin)
  if (checkout.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return next(new Error('Unauthorized to view this checkout', { cause: 403 }));
  }
  
  return successResponse(res, 200, 'Checkout retrieved successfully', checkout);
});

export const getUserCheckouts = asynchandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // For non-admin users, only return their own checkouts
  const filter = req.user.isAdmin ? {} : { user: req.user._id };
  
  const checkouts = await Checkoutmodel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Checkoutmodel.countDocuments(filter);
  
  return successResponse(res, 200, 'Checkouts retrieved successfully', {
    checkouts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});