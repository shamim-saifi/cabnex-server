import mongoose, { model, Schema, Types } from "mongoose";

const transactionSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    razorpay: {
      order_id: { type: String, required: true },
      payment_id: { type: String, required: true },
      signature: { type: String, required: true },
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "authorized", "captured", "refunded", "failed"],
      default: "created",
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "emi", "other"],
      default: "upi",
    },
  },
  { timestamps: true }
);

const Transaction =
  mongoose.models.Transaction || model("Transaction", transactionSchema);

export default Transaction;
