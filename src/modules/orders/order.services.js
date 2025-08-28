import Checkoutmodel from "../DB/model/checkout.js";
import { asynchandler, successResponse } from "../utilities/response/response.js";
import ordermodel from "../DB/model/order.js";


export const getUserCheckouts = asynchandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  
  const checkouts = await Checkoutmodel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Checkoutmodel.countDocuments(filter);
  
    return res.status(200).json({
    success: true,
    message: "Checkouts retrieved successfully"
    ,data: {
      checkouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
})




export const getOrderStats = asynchandler(async (req, res, next) => {
  try {
    const totalOrders = await ordermodel.countDocuments();
    const paidOrders = await ordermodel.countDocuments({ ispaid: true });
    const totalRevenue = await ordermodel.aggregate([
      { $match: { ispaid: true } },
      { $group: { _id: null, total: { $sum: "$tottalprice" } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        paidOrders,
        pendingOrders: totalOrders - paidOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(new Error('Failed to get order stats: ' + error.message));
  }
});