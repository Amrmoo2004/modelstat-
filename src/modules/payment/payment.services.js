import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import { confirmCheckout } from "../checkout/checkout.services.js";
import { authenticatePaymob } from "../middleware/authenticatePaymob .js";
import { paymobConfig } from "../kashier_gateway/kashier.js";

export const initiatePaymobPayment = asynchandler(async (req, res, next) => {
  try {
    const checkout = await Checkoutmodel.findById(req.body.checkout._id).populate('user');
    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Create configured axios instance
    const axiosInstance = axios.create({
      baseURL: 'https://accept.paymob.com',
      httpsAgent: new https.Agent({
        servername: 'accept.paymob.com',
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        minVersion: 'TLSv1.2'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Host': 'accept.paymob.com'
      },
      timeout: 30000
    });

    // Get auth token first
    const authResponse = await axiosInstance.post(
      '/api/auth/tokens',
      { api_key: process.env.PAYMOB_API_KEY }
    );
    
    const authToken = authResponse.data.token;

    if (checkout.paymentDetails && checkout.paymentDetails.paymobOrderId) {
      try {
        const orderCheckResponse = await axiosInstance.get(
          `/api/ecommerce/orders/${checkout.paymentDetails.paymobOrderId}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );

        
        const paymentKeyResponse = await axiosInstance.post(
          '/api/acceptance/payment_keys',
          {
            auth_token: authToken,
            amount_cents: Math.round(checkout.totalPrice * 100), 
            expiration: 3600,
            order_id: checkout.paymentDetails.paymobOrderId,
            billing_data: {
              first_name: checkout.user?.firstName || "Customer",
              last_name: checkout.user?.lastName || "Name",
              email: checkout.user?.email || "customer@example.com",
              phone_number: checkout.user?.phone || "+201000000000",
              country: "EGY",
              city: checkout.shippingAddress.city,
              street: checkout.shippingAddress.address,
              building: checkout.shippingAddress.building || "1",
              floor: checkout.shippingAddress.floor || "1",
              apartment: checkout.shippingAddress.apartment || "1"
            },
            currency: "EGP",
            integration_id: process.env.PAYMOB_INTEGRATION_ID
          }
        );

        return res.status(200).json({
          paymentKey: paymentKeyResponse.data.token,
          paymobOrderId: checkout.paymentDetails.paymobOrderId,
          checkoutId: checkout._id,
          amount: checkout.totalPrice,
          isExistingOrder: true
        });

      } catch (orderError) {
        console.log('Existing order invalid, creating new one:', orderError.message);
      }
    }

    const timestamp = Date.now();
    const uniqueMerchantOrderId = `${checkout._id.toString()}_${timestamp}`;

    const orderResponse = await axiosInstance.post(
      '/api/ecommerce/orders',
      {
        auth_token: authToken,
        delivery_needed: false,
        merchant_order_id: uniqueMerchantOrderId, 
        amount_cents: Math.round(checkout.totalPrice * 100), 
       currency: 'EGP',
        items: []
      }
    );
    
    const paymobOrderId = orderResponse.data.id;

    const paymentKeyResponse = await axiosInstance.post(
      '/api/acceptance/payment_keys',
      {
        auth_token: authToken,
        amount_cents: Math.round(checkout.totalPrice * 100), // Ensure integer
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          first_name: checkout.user?.firstName || "Customer",
          last_name: checkout.user?.lastName || "Name",
          email: checkout.user?.email || "customer@example.com",
          phone_number: checkout.user?.phone || "+201000000000",
          country: "EGY",
          city: checkout.shippingAddress.city,
          street: checkout.shippingAddress.address,
          building: checkout.shippingAddress.building || "1",
          floor: checkout.shippingAddress.floor || "1",
          apartment: checkout.shippingAddress.apartment || "1"
        },
        currency: "EGP",
        integration_id: process.env.PAYMOB_INTEGRATION_ID
      }
    );
    
    const paymentKey = paymentKeyResponse.data.token;

    checkout.paymentDetails = {
      paymobOrderId: paymobOrderId,
      paymobPaymentKey: paymentKey,
      merchantOrderId: uniqueMerchantOrderId,
      status: 'initiated',
      updatedAt: new Date()
    };
    
    await checkout.save();

    return res.status(200).json({
      paymentKey,
      paymobOrderId,
      checkoutId: checkout._id,
      amount: checkout.totalPrice,
      isExistingOrder: false
    });

  } catch (error) {
    console.error('Payment initiation error:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    if (error.response?.status === 422 && error.response?.data?.message === 'duplicate') {
      return res.status(422).json({
        error: 'Duplicate order detected',
        message: 'Please try again with a new checkout session'
      });
    }
    
    return res.status(500).json({
      error: 'Payment initiation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export const paymobWebhook = asynchandler(async (req, res) => {
  try {
    const { obj } = req.body;
    
    if (!obj) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid webhook data' 
      });
    }

    if (paymobConfig.hmacSecret) {
      const hmac = req.headers['hmac'];
      if (!hmac) {
        return res.status(401).json({ 
          success: false,
          error: 'HMAC header missing' 
        });
      }

      const generatedHmac = crypto
        .createHmac('sha512', paymobConfig.hmacSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (generatedHmac !== hmac) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid HMAC signature' 
        });
      }
    }

    const { order } = obj;
    if (!order?.merchant_order_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order data' 
      });
    }

    const checkout = await Checkoutmodel.findById(order.merchant_order_id);
    if (!checkout) {
      return res.status(404).json({ 
        success: false,
        error: 'Checkout not found' 
      });
    }

    if (obj.success) {
      // Payment successful
      checkout.isPaid = true;
      checkout.paidAt = new Date();
      checkout.paymentStatus = 'Paid';
      checkout.transactionId = obj.id;
      
      if (!checkout.paymentDetails) {
        checkout.paymentDetails = {};
      }
      checkout.paymentDetails.status = 'completed';
      checkout.paymentDetails.paymobOrderId = order.id;
      
      await checkout.save();
      
      // Confirm checkout
      try {
        await confirmCheckout(order.merchant_order_id);
      } catch (confirmError) {
        console.error('Checkout confirmation error:', confirmError);
      }
    } else {
      checkout.paymentStatus = 'Failed';
      if (!checkout.paymentDetails) {
        checkout.paymentDetails = {};
      }
      checkout.paymentDetails.status = 'failed';
      checkout.paymentDetails.paymobOrderId = order.id;
      await checkout.save();
    }

    res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
});

export const verifyPayment = asynchandler(async (req, res) => {
  try {
    const { checkoutId } = req.query;
    
    if (!checkoutId) {
      return res.status(400).json({ 
        success: false,
        error: 'Checkout ID is required' 
      });
    }
    
    const checkout = await Checkoutmodel.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ 
        success: false,
        error: 'Checkout not found' 
      });
    }

    if (checkout.isPaid) {
      return res.status(200).json({
        success: true,
        paid: true,
        message: 'Payment already verified',
        data: {
          transactionId: checkout.transactionId,
          paidAt: checkout.paidAt,
          amount: checkout.totalPrice,
          currency: 'EGP'
        }
      });
    }

    // Verify with Paymob API
    try {
      const token = await authenticatePaymob();
      const response = await axios.get(
        `${paymobConfig.baseUrl}/ecommerce/orders/${checkout.paymentDetails?.paymobOrderId}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const successfulTransaction = response.data.find(txn => 
        txn.success && !txn.pending
      );

      if (successfulTransaction) {
        checkout.isPaid = true;
        checkout.paidAt = new Date();
        checkout.paymentStatus = 'Paid';
        checkout.transactionId = successfulTransaction.id;
        await checkout.save();

        res.status(200).json({
          success: true,
          paid: true,
          message: 'Payment verified successfully',
          data: {
            transactionId: successfulTransaction.id,
            paidAt: checkout.paidAt,
            amount: checkout.totalPrice,
            currency: 'EGP'
          }
        });
      } else {
        res.status(200).json({
          success: true,
          paid: false,
          message: 'Payment not completed',
          data: {
            paymentStatus: checkout.paymentStatus,
            amount: checkout.totalPrice,
            currency: 'EGP'
          }
        });
      }
    } catch (apiError) {
      console.error('Paymob API verification error:', apiError);
      res.status(200).json({
        success: true,
        paid: false,
        message: 'Payment verification failed - using local status',
        data: {
          paymentStatus: checkout.paymentStatus,
          amount: checkout.totalPrice,
          currency: 'EGP'
        }
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Payment verification failed',
      details: error.message 
    });
  }
});