import mongoose, { model, Schema, Types } from "mongoose";

const activityPackageSchema = new Schema(
  {
    cityId: {
      type: Types.ObjectId,
      ref: "City",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    // Duration options (in hours or days)
    duration: {
      type: Number,
      min: 1,
      description: "Duration in hours or days depending on context",
    },

    // Price per person / per group
    price: {
      type: Number,
      min: 0,
    },

    // Optional tiered pricing (e.g. adult, child)
    pricingOptions: [
      {
        label: String,
        price: Number,
      },
    ],

    // Meeting or start location
    startLocation: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Optional list of places covered in the activity
    itinerary: [
      {
        placeName: String,
        description: String,
        timeSpent: Number, // in minutes
      },
    ],

    includes: [String], // e.g. ["Guide", "Transportation", "Entry Fees"]
    excludes: [String],

    cancellationPolicy: {
      type: String,
      default: "Non-refundable",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityPackage =
  mongoose.models.ActivityPackage ||
  model("ActivityPackage", activityPackageSchema);

export default ActivityPackage;
