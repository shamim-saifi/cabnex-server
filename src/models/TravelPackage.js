import mongoose, { model, Schema } from "mongoose";

const travelPackageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  days: {
    type: Number,
    default: 0,
  },
  nights: {
    type: Number,
    default: 0,
  },
  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
});

const TravelPackage =
  mongoose.models.TravelPackage || model("TravelPackage", travelPackageSchema);

export default TravelPackage;
