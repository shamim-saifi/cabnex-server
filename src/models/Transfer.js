import { Schema } from "mongoose";

const transferSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required."],
    unique: true,
  },
  place_id: {
    type: String,
    required: [true, "Place ID is required."],
    unique: true,
  },
  type: {
    type: String,
    required: [true, "Type is required."],
  },
  city: {
    type: String,
    required: [true, "City is required."],
  },
  baseFare: {
    type: Number,
    required: [true, "Base fare is required."],
  },
  freeKm: {
    type: Number,
    default: 20,
  },
  extraKmCharge: {
    type: Number,
    default: 15,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default transferSchema;
