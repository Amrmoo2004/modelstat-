
import { cartmodel } from '../DB/model/cart.js'
import { productmodel } from '../DB/model/product.js';
import { asynchandler } from '../utilities/response/response.js';
import mongoose from 'mongoose';


export const addToCart = asynchandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const product = await productmodel.findById(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const sessionIdentifier = req.user?._id 
    ? `user_${req.user._id}`
    : req.cookies?.cartSessionId || req.sessionID;

  let cart = await cartmodel.findOne({
    $or: [
      { userId: req.user?._id },
      { sessionId: sessionIdentifier }
    ]
  }).exec();

  if (!cart) {
    cart = new cartmodel({
      sessionId: req.user?._id ? null : sessionIdentifier,
      userId: req.user?._id || null,
      items: [],
      total: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }

  const existingItemIndex = cart.items.findIndex(item => 
  item.productId.equals(productId)
);

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      price: product.price,
      name: product.name,
      image: product.images[0]?.secure_url,
    });
  }

  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const savedCart = await cart.save();

  if (!req.user?._id && !req.cookies?.cartSessionId) {
    res.cookie('cartSessionId', sessionIdentifier, { 
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true 
    });
  }

  res.json({
    success: true,
    cart: savedCart
  });
});
export const getCart = asynchandler(async (req, res) => {
  const cart = await cartmodel.findOne({
    $or: [
      { sessionId: req.sessionID },
      { userId: req.user?._id }
    ]
  }).populate('items.productId');

  res.json(cart || { 
    items: [], 
    total: 0, 
    coupon: { discount: 0 } 
  });
});

export const updateItem = asynchandler(async (req, res) => {
  const { quantity } = req.body;
  
  const cart = await cartmodel.findOne({
    $or: [{ userId: req.user?._id }, { sessionId: req.sessionID }],
    'items._id': req.params.itemId
  });

  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }

  item.quantity = quantity;
  await cart.save();

  res.json(cart);
});

export const removeItem = asynchandler(async (req, res) => {
  const cart = await cartmodel.findOne({
    $or: [{ userId: req.user?._id }, { sessionId: req.sessionID }]
  });

  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  cart.items.pull(req.params.itemId);
  await cart.save();

  res.json(cart);
});

export const applyCoupon = asynchandler(async (req, res) => {
  const { code, discount } = req.body;
  
  const cart = await cartmodel.findOne({
    $or: [{ userId: req.user?._id }, { sessionId: req.sessionID }]
  });

  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  cart.coupon = { code, discount };
  await cart.save();

  res.json(cart);
});

export const clearCart = asynchandler(async (req, res) => {
  const cart = await cartmodel.findOne({
    $or: [{ userId: req.user?._id }, { sessionId: req.sessionID }]
  });

  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  cart.items = [];
  cart.total = 0;
  cart.coupon = { code: null, discount: 0 };
  await cart.save();

  res.json({ success: true });
});