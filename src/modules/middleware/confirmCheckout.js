import Checkoutmodel from '../DB/model/checkout.js';
import OrderModel from '../DB/model/order.js';

export const confirmCheckout = async (checkoutId) => {
  try {
    const checkout = await Checkoutmodel.findById(checkoutId)
      .populate('user')
      .populate('checkoutItems.product');

    if (!checkout || !checkout.isPaid) {
      throw new Error('Checkout not found or not paid');
    }

    const orderItems = checkout.checkoutItems.map(item => ({
      productId: item.product._id,
      name: item.name,
      images: item.images,
      price: item.price,
      quantity: item.quantity,
      sizes: item.sizes
    }));

    const order = new OrderModel({
      user: checkout.user._id,
      orderItems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      totalPrice: checkout.totalPrice,
      isPaid: true,
      paidAt: checkout.paidAt,
      paymentStatus: 'Completed'
    });

    await order.save();

    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();

    return order;
  } catch (error) {
    console.error('Error confirming checkout:', error);
    throw error;
  }
};