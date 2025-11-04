import mongoose, { model, Schema } from "mongoose";

const travelQuerySchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    package: { type: String, required: true },
    numberOfTravelers: { type: Number, default: 1 },
    preferredDate: { type: Date, default: Date.now },
    additionalDetails: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const TravelQuery =
  mongoose.models.TravelQuery || model("TravelQuery", travelQuerySchema);

export default TravelQuery;
