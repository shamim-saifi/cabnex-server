import { randomUUID } from "crypto";
import mongoose, { model, Schema, Types } from "mongoose";

const bookingSchema = new Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    carCategory: {
      type: String,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["rental", "outstation", "transfer", "activity"],
    },
    packageType: {
      type: String,
      enum: ["TravelPackage", "ActivityPackage", "RentalPackage"],
    },
    packageId: {
      type: Types.ObjectId,
      refPath: "packageType",
    },
    exactLocation: {
      type: String,
      required: true,
    },
    pickupDateTime: {
      type: Date,
      required: true,
    },
    startLocation: {
      place_id: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    destinations: [
      {
        place_id: {
          type: String,
        },
        address: {
          type: String,
        },
      },
    ],
    returnDateTime: {
      type: Date,
    },
    distance: {
      type: Number,
      default: 0, // in kilometers
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    recievedAmount: {
      type: Number,
      default: 0,
    },
    tripType: {
      type: String,
      enum: ["one", "round"],
    },
    status: {
      type: String,
      enum: ["pending", "inProgress", "confirmed", "cancelled"],
      default: "pending",
    },
    assignedVendor: {
      type: Types.ObjectId,
      ref: "Vendor",
    },
    transaction: {
      type: Types.ObjectId,
      ref: "Transaction",
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.pre("save", async function (next) {
  if (this.bookingId) return next();
  this.bookingId = `CN-${randomUUID().slice(0, 8).toUpperCase()}`;
  next();
});

const Booking = mongoose.models.Booking || model("Booking", bookingSchema);

export default Booking;
