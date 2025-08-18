import mongoose from 'mongoose';
import Checkoutmodel from '../DB/model/checkout.js';
export const checkoutMiddleware = {
  // Validate checkout ownership
  validateCheckoutOwner: async (req, res, next) => {
    try {
      const checkout = await Checkoutmodel.findById(req.params.id);
      if (!checkout) {
        return res.status(404).json({ 
          success: false,
          message: 'Checkout not found' 
        });
      }
      if (checkout.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized to access this checkout' 
        });
      }
      req.checkout = checkout;
      next();
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Server error during checkout validation',
        error: error.message 
      });
    }
  },

  // Validate the new request structure
  validateCheckoutRequest: async (req, res, next) => {
    const { productIds, quantities, shippingAddress, paymentMethod } = req.body;

    // Check required fields exist
    if (!productIds || !quantities || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productIds, quantities, shippingAddress, or paymentMethod'
      });
    }

    // Validate arrays
    if (!Array.isArray(productIds) || !Array.isArray(quantities)) {
      return res.status(400).json({
        success: false,
        message: 'productIds and quantities must be arrays'
      });
    }

    // Check arrays are not empty
    if (productIds.length === 0 || quantities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'productIds and quantities cannot be empty'
      });
    }

    // Check array lengths match
    if (productIds.length !== quantities.length) {
      return res.status(400).json({
        success: false,
        message: 'productIds and quantities must have the same length'
      });
    }

    // Validate quantities are positive numbers
    if (quantities.some(qty => !Number.isInteger(qty) || qty <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'All quantities must be positive integers'
      });
    }

    // Validate product IDs format
    if (productIds.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validate shipping address structure
    const requiredAddressFields = ['address', 'city', 'postalCode', 'country'];
    const missingFields = requiredAddressFields.filter(
      field => !shippingAddress[field]
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing shipping address fields: ${missingFields.join(', ')}`
      });
    }

    // Attach validated data to request for controller
    req.validatedCheckoutData = {
      productIds,
      quantities,
      shippingAddress,
      paymentMethod,
      colours: req.body.colours || [],
      sizes: req.body.sizes || []
    };

    next();
  }
};