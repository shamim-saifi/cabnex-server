import mongoose, { model, Schema, Types } from "mongoose";

const carSchema = new Schema({
  vendor: {
    type: Types.ObjectId,
    ref: "Vendor",
    required: [true, "Vendor is required"],
  },
  make: { type: String, required: [true, "Make is required"] },
  model: { type: String, required: [true, "Model is required"] },
  category: { type: String, required: [true, "Category is required"] },
  year: { type: Number, required: [true, "Year is required"] },
  registerationType: {
    type: String,
    required: [true, "Registeration type is required"],
  },
  registrationNumber: {
    type: String,
    required: [true, "Registration number is required"],
    unique: true,
  },
  colour: { type: String, required: [true, "Colour is required"] },
  status: {
    type: String,
    enum: ["available", "unavailable", "rented"],
    default: "available",
  },
  isVerified: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  seatingCapacity: {
    type: Number,
    required: [true, "Seating capacity is required"],
  },
  fuelType: { type: String, required: [true, "Fuel type is required"] },
  airConditioning: { type: Boolean, default: false },
  features: {
    type: [String],
    default: [],
  },
  insuranceExpiry: {
    type: Date,
  },
  pollutionCertificate: {
    type: String,
  },
  images: [
    {
      public_id: { type: String, required: [true, "Public ID is required"] },
      url: { type: String, required: [true, "Image URL is required"] },
    },
  ],
});

const Car = mongoose.models.Car || model("Car", carSchema);

export default Car;
