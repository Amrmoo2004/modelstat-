    import mongoose from 'mongoose';
    const Schema = mongoose.Schema;
    // Checkout Item Sub-Schema
    const checkoutItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
    secure_url: {
      type: String,
    },
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    asset_id: {
      type: String
    }
  }],
        sizes: [{
        type: String,
        required: false
    }],
    colour:{
        type: String,
    }
    }, { _id: false });

    // Shipping Address Sub-Schema
    const shippingAddressSchema = new Schema({
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    }, { _id: false });

    // Payment Details Sub-Schema
    const paymentDetailsSchema = new Schema({
    paymentId: String,
    paymentMethod: String,
    status: String,
    updateTime: String,
    emailAddress: String
    }, { _id: false });

    // Main Checkout Schema
    const checkoutSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkoutItems: [checkoutItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
        type: String,
        required: true,
        enum: ['PayPal', 'Credit Card', 'Bank Transfer', 'Cash on Delivery'],
        default: 'PayPal'
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'paid', 'failed', 'refunded','completed'],
        default: 'Pending'
    },
    paymentDetails: paymentDetailsSchema,
    isFinalized: {
        type: Boolean,
        default: false
    },
    status: {
    type: String,
    enum: [ 'Processing', 'Shipped', 'Delivered', 'Cancelled','Completed'],
    default: 'Processing'
},
    finalizedAt: {
        type: Date
    }
    }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
    });

    // Indexes for better query performance
    checkoutSchema.index({ user: 1 });
    checkoutSchema.index({ isPaid: 1 });
    checkoutSchema.index({ isFinalized: 1 });
    checkoutSchema.index({ 'paymentDetails.paymentId': 1 }, { sparse: true });

    // Virtual for formatted shipping address
    checkoutSchema.virtual('formattedShippingAddress').get(function() {
    return `${this.shippingAddress.address}, ${this.shippingAddress.city}`;
    });

    // Pre-save hook to calculate total price
    checkoutSchema.pre('save', function(next) {
    if (this.checkoutItems && this.checkoutItems.length > 0) {
        this.totalPrice = this.checkoutItems.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
        );
    }
    next();
    });

    const Checkoutmodel = mongoose.model('Checkout', checkoutSchema);

    export default Checkoutmodel;
    export { checkoutItemSchema, shippingAddressSchema, paymentDetailsSchema };