  import mongoose from "mongoose";
  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";

  const schema = mongoose.Schema;

  const roleEnum = {
    USER: "user",
    ADMIN: "admin",
    MODERATOR: "moderator" // Added moderator role
  };

  const providerEnum = {
    GOOGLE: "google",
    LOCAL: "local",
    FACEBOOK: "facebook", // Added more providers
    GITHUB: "github"
  };

  const userSchema = new schema({
    username: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: function() {
        return this.provider === providerEnum.LOCAL;
      },
      minlength: 8,
      select: false // Never return in queries
    },
    phone: {
      type: String,
      required: function() {
        return this.provider === providerEnum.LOCAL;
      },
      trim: true
    },
    isVerified: {  
    type: Boolean,
    default: false
  },
  verifiedAt: { 
    type: Date
  },
    role: {
      type: String,
      enum: Object.values(roleEnum),
      default: roleEnum.USER
    },
    provider: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.LOCAL
    },
    confirmEmail: { // Changed to camelCase
      type: Date
    },
    picture: {
      type: String,
      default: "default.jpg"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    otp: String,
    otpExpires: Date
  }, {
    timestamps: true // Adds createdAt and updatedAt
  });
  userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
  });
  // Virtuals

  userSchema.virtual('profile').get(function() {
    return {
      username: this.username,
      email: this.email,
      picture: this.picture,
      role: this.role,
      provider: this.provider,
      isVerified: this.isVerified
    };
  });



  export const UserModel = mongoose.model("User", userSchema);
  export default UserModel;

