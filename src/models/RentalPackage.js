import mongoose, { model, Schema } from "mongoose";

const rentalPackageSchema = new Schema({
  kilometer: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
});

const RentalPackage =
  mongoose.models.RentalPackage || model("RentalPackage", rentalPackageSchema);

export default RentalPackage;
