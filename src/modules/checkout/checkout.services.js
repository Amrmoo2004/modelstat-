import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import { productmodel } from "../DB/model/product.js";
import mongoose from 'mongoose';
  import ordermodel from "../DB/model/order.js";
import { cartmodel } from '../DB/model/cart.js';
export const createCheckout = asynchandler(async (req, res, next) => {
  const { checkoutitems, tottalprice, shippingAddress, paymentMethod } = req.body;
  if (!checkoutitems||checkoutitems.length === 0) {
    return next(new Error('Checkout items are required', { cause: 400 }));  
  
  }
  const checkout=await Checkoutmodel.create({
    user: req.user._id,
    checkoutitems:checkoutitems,
    tottalprice,
    shippingAddress,
    paymentMethod,
    paymentStatus: 'Pending',
    isPaid: false,
  
  });
  return successResponse(res, 201, 'Checkout created successfully', checkout);
  
});
export const updateafterpayment = asynchandler(async (req, res, next) => {
const   {paymentStatus,paymentdeatails} = req.body;
  
  const checkout = await Checkoutmodel.findById(req.params.id);
  if (!checkout) {
    return next(new Error('Checkout not found', { cause: 404 }));
  }
  if(paymentStatus === 'paid') {
    checkout.isPaid = true;
    checkout.paidAt = new Date();
    await checkout.save();
    return successResponse(res, 200, 'Checkout updated successfully', checkout);  
  }

})
export const  confairmCheckout = asynchandler(async (req, res, next) => {

  const checkout=await Checkoutmodel.findById(req.params.id);
  if (!checkout) {
    return next(new Error('Checkout not found', { cause: 404 }));
  }
if (checkout.isFinalized&& checkout.isPaid) {
    const order = await ordermodel.create({
      user: checkout.user,
      checkoutItems: checkout.checkoutItems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      paymentStatus:"paid",
      totalPrice: checkout.totalPrice,
      isPaid: checkout.isPaid,
      paidAt: checkout.paidAt,
      isdelivered: false,
      status: 'Processing',
      paymentStatus: checkout.paymentStatus
    });
    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();
    
    await cartmodel.deleteMany({ user: checkout.user });
        return successResponse(res, 200, 'Checkout finalized successfully', checkout);

  } 
  else if (checkout.isFinalized) {
  return next(new Error('Checkout is already finalized', { cause: 400 }));
  } else {
    return next(new Error('Checkout is not paid', { cause: 400 }));
  } 
}

);