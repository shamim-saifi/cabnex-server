import bcrypt from "bcryptjs";
import mongoose, { model, Schema, Types } from "mongoose";

const vendorSchema = new Schema(
  {
    profile: {
      public_id: { type: String },
      url: { type: String },
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contactPhone: {
      type: String,
      required: true,
      unique: true,
      maxlength: 10,
      minlength: 10,
    },
    companyType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
      maxlength: 64,
    },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "" },
    cars: [{ type: Types.ObjectId, ref: "Car" }],
    pan: {
      type: String,
      required: true,
    },
    gst: {
      type: String,
      default: "",
    },
    panImage: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    gstImage: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    bookings: [{ type: Types.ObjectId, ref: "Booking", default: [] }],
    isVerified: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

vendorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Vendor = mongoose.models.Vendor || model("Vendor", vendorSchema);

export default Vendor;
