import bcrypt from "bcryptjs";
import mongoose, { model, Schema, Types } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      maxlength: 10,
      minlength: 10,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
      maxlength: 64,
    },
    pan: {
      type: String,
      select: false,
    },
    gst: {
      type: String,
      select: false,
    },
    bookings: [{ type: Types.ObjectId, ref: "Booking", default: [] }],
    acceptedTerms: { type: Boolean, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || model("User", userSchema);

export default User;
