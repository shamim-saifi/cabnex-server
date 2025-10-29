import crypto from "crypto";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import asyncHandler from "../utils/asyncHandler.js  ";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";
import Transaction from "../models/Transaction.js";
import axios from "axios";
import { type } from "os";

const getRazorpayKey = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new SuccessResponse(
        200,
        "Razorpay Key fetched",
        process.env.RAZORPAY_KEY_ID
      )
    );
});

const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.price * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    if (!order) return next(new ErrorResponse(500, "Some error occurred"));
    return res
      .status(200)
      .json(new SuccessResponse(200, "Order created", order));
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse(500, "Failed to create order"));
  }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment signature, create Booking & Transaction
 *
 * @body
 * {
 *   "amount": Number,                // Total amount in INR (same as order amount)
 *   "razorpayPaymentId": String,     // Payment ID returned by Razorpay
 *   "razorpayOrderId": String,       // Order ID created by your backend
 *   "razorpaySignature": String,     // Signature returned by Razorpay
 *
 *   // Booking details
 *   "carCategory": String,           // e.g. "Sedan", "SUV"
 *   "serviceType": String,           // e.g. "One-way", "Round-trip", "Local"
 *   "packageType": String,           // e.g. "4hr/40km", "8hr/80km"
 *   "packageId": String,             // ID of the selected package
 *   "exactLocation": String,         // User’s provided exact pickup address
 *   "pickupDateTime": String,           // e.g. "2025-10-20T10:30:00Z"
 *   "startLocation": String,         // e.g. "Delhi"
 *   "destinations": [String],        // e.g. ["Agra", "Mathura"]
 *   "returnDateTime": Number,                  // e.g. 2
 *   "distance": Number,              // in kilometers
 *   "totalAmount": Number,           // same as `amount`, used for reference
 *   "status": String,                // e.g. "confirmed"
 *   "city": String,                  // e.g. "Delhi"
 *   "bookingId": String              // Optional — if updating an existing booking
 * }
 *
 * @returns 200 { success: true, message, transaction }
 */

const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // ✅ Verify signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpaySignature !== expectedSign) {
      return next(new ErrorResponse(400, "Invalid signature"));
    }

    // Fetch payment details from Razorpay API
    const paymentData = await axios.get(
      `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );

    const p = paymentData.data;

    let payload = {};

    if (serviceType.toLowerCase() === "outstation") {
      payload = {
        userId: req.user._id,
        carCategory: req.body.carCategory,
        serviceType: req.body.serviceType,
        exactLocation: req.body.exactLocation,
        pickupDateTime: req.body.pickupDateTime,
        startLocation: req.body.startLocation,
        destinations: req.body.destinations,
        returnDateTime: req.body.returnDateTime,
        distance: req.body.distance,
        totalAmount: req.body.totalAmount,
        recievedAmount: p.amount / 100,
        type: req.body.type,
      };
    } else if (serviceType.toLowerCase() === "rental") {
      payload = {
        userId: req.user._id,
        carCategory: req.body.carCategory,
        serviceType: req.body.serviceType,
        exactLocation: req.body.exactLocation,
        packageType: req.body.packageType,
        packageId: req.body.packageId,
        pickupDateTime: req.body.pickupDateTime,
        startLocation: req.body.startLocation,
        totalAmount: req.body.totalAmount,
        recievedAmount: p.amount / 100,
      };
    } else if (serviceType.toLowerCase() === "transfer") {
      payload = {
        userId: req.user._id,
        carCategory: req.body.carCategory,
        serviceType: req.body.serviceType,
        exactLocation: req.body.exactLocation,
        packageType: req.body.packageType,
        packageId: req.body.packageId,
        pickupDateTime: req.body.pickupDateTime,
        startLocation: req.body.startLocation,
        totalAmount: req.body.totalAmount,
        recievedAmount: p.amount / 100,
      };
    }

    const newBooking = await Booking.create(payload);

    // Create Transaction entry
    const transaction = await Transaction.create({
      user: req.user._id,
      booking: newBooking._id,
      city: req.body.city,
      razorpay: {
        order_id: razorpayOrderId,
        payment_id: razorpayPaymentId,
        signature: razorpaySignature,
      },
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.method,
    });

    newBooking.transaction = transaction._id;
    await newBooking.save();

    return res.status(200).json(
      new SuccessResponse(200, "Payment verified successfully", {
        booking: newBooking,
      })
    );
  } catch (err) {
    console.error(err);
    next(new ErrorResponse(500, "Payment verification failed"));
  }
});

export { createRazorpayOrder, getRazorpayKey, verifyRazorpayPayment };
