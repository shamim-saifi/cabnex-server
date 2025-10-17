import mongoose, { model, Schema } from "mongoose";

const carCategorySchema = new Schema({
  category: {
    type: String,
    required: true,
    unique: true,
  },
  carNames: {
    type: [String],
    required: true,
    validate: {
      validator: (val) => val.length > 0,
      message: "At least one car name is required",
    },
  },
  icon: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  isActive: { type: Boolean, default: true },
});

const CarCategory =
  mongoose.models.CarCategory || model("CarCategory", carCategorySchema);

export default CarCategory;
