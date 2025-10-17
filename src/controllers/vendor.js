import Car from "../models/Car.js";
import Vendor from "../models/Vendor.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import generateToken from "../utils/generateToken.js";
import SuccessResponse from "../utils/SuccessResponse.js";

const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24 * 30,
  httpOnly: true,
  sameSite: "none",
  secure: process.env.NODE_ENV === "production",
};

const getVendor = asyncHandler(async (req, res, next) => {
  const vendorId = req.vendorId;

  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return next(new ErrorResponse(404, "Vendor not found"));
  }

  res
    .status(200)
    .json(
      new SuccessResponse(200, "Vendor retrieved successfully", { vendor })
    );
});

// Register vendor
const vendorRegister = asyncHandler(async (req, res, next) => {
  const { contactPerson, company, email, contactPhone, password, pan, gst } =
    req.body;

  const vendorExists = await Vendor.findOne({
    email,
    contactPhone,
  });

  if (vendorExists) {
    return next(new ErrorResponse(400, "Vendor already exists"));
  }

  const newVendor = await Vendor.create({
    contactPerson,
    company,
    email,
    contactPhone,
    password,
    pan,
    gst,
  });

  if (!newVendor) {
    return next(new ErrorResponse(400, "Failed to create vendor"));
  }

  res
    .status(201)
    .cookie("cabnex_vendor", generateToken(newVendor._id), cookieOptions)
    .json(new SuccessResponse(201, "Vendor created successfully", newVendor));
});

// Login vendor
const vendorLogin = asyncHandler(async (req, res, next) => {
  const { email, contactPhone, password, otp } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ email }, { contactPhone }],
  }).select("+password");

  if (!vendor) {
    return next(new ErrorResponse(401, "Invalid email or password"));
  }

  if (otp) {
    if (!otp || otp === "") {
      return next(new ErrorResponse(400, "OTP is required"));
    }
    if (otp !== process.env.sampleOtp) {
      return next(new ErrorResponse(401, "Invalid OTP"));
    }

    return res
      .cookie("cabnex_vendor", generateToken(vendor._id), cookieOptions)
      .json(new SuccessResponse(200, "Vendor logged in successfully", vendor));
  }

  if (!(await vendor.isPasswordCorrect(password))) {
    return next(new ErrorResponse(401, "Invalid email or password"));
  }

  res
    .status(200)
    .cookie("cabnex_vendor", generateToken(vendor._id), cookieOptions)
    .json(new SuccessResponse(200, "Vendor logged in successfully", vendor));
});

// Update vendor profile
const updateVendorProfile = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.vendorId).select("+password");

  if (req.files.profile) {
    const profile = await uploadToCloudinary([req.files.profile[0]]);
    req.body.profile = profile[0];
    if (vendor.profile?.public_id) {
      await deleteFromCloudinary([vendor.profile]);
    }
  }
  if (req.files.panImage) {
    const panImage = await uploadToCloudinary([req.files.panImage[0]]);
    req.body.panImage = panImage[0];
    if (vendor.panImage?.public_id) {
      await deleteFromCloudinary([vendor.panImage]);
    }
  }
  if (req.files.gstImage) {
    const gstImage = await uploadToCloudinary([req.files.gstImage[0]]);
    req.body.gstImage = gstImage[0];
    if (vendor.gstImage?.public_id) {
      await deleteFromCloudinary([vendor.gstImage]);
    }
  }

  Object.assign(vendor, req.body);
  await vendor.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new SuccessResponse(200, "Vendor profile updated successfully", vendor)
    );
});

// Logout vendor
const logoutVendor = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("cabnex_vendor", cookieOptions)
    .json(new SuccessResponse(200, "Vendor logged out successfully"));
});

// Forget password
const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email, contactPhone, password, otp } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ email }, { contactPhone }],
  }).select("+password");

  if (!vendor) {
    return next(new ErrorResponse(404, "Vendor not found"));
  }

  if (!otp || otp === "") {
    return next(new ErrorResponse(400, "OTP is required"));
  }

  if (otp !== process.env.sampleOtp) {
    return next(new ErrorResponse(401, "Invalid OTP"));
  }

  vendor.password = password;
  await vendor.save();

  res.status(200).json(new SuccessResponse(200, "Password reset successfully"));
});

// Get vendor cars
const getVendorCars = asyncHandler(async (req, res, next) => {
  const vendorId = req.vendorId;

  const cars = await Car.find({ vendor: vendorId });

  res
    .status(200)
    .json(new SuccessResponse(200, "Vendor cars retrieved successfully", cars));
});

// Add vendor car
const addVendorCar = asyncHandler(async (req, res, next) => {
  const vendorId = req.vendorId;

  const carExists = await Car.findOne({
    registrationNumber: req.body.registrationNumber,
  });

  if (carExists) {
    return next(new ErrorResponse(400, "Car already exists"));
  }

  const images = await uploadToCloudinary(req.files);

  const newCar = await Car.create({ ...req.body, vendor: vendorId, images });

  if (!newCar) {
    return next(new ErrorResponse(400, "Failed to add car"));
  }

  await Vendor.findByIdAndUpdate(vendorId, { $push: { cars: newCar._id } });

  res
    .status(201)
    .json(new SuccessResponse(201, "Car added successfully", newCar));
});

// Update vendor car
const updateVendorCar = asyncHandler(async (req, res, next) => {
  const vendorId = req.vendorId;
  const { id } = req.params;

  const car = await Car.findOne({ _id: id, vendor: vendorId });

  if (!car) {
    return next(new ErrorResponse(404, "Car not found"));
  }

  if (req.files && req.files.length > 0) {
    const images = await uploadToCloudinary(req.files);
    req.body.images = images;
    await deleteFromCloudinary(car.images);
  }

  const updatedCar = await Car.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedCar) {
    return next(new ErrorResponse(400, "Failed to update car"));
  }

  res
    .status(200)
    .json(new SuccessResponse(200, "Car updated successfully", updatedCar));
});

const deleteVendorCar = asyncHandler(async (req, res, next) => {
  const vendorId = req.vendorId;
  const { id } = req.params;

  const car = await Car.findOne({ _id: id, vendor: vendorId });

  if (!car) {
    return next(new ErrorResponse(404, "Car not found"));
  }

  await deleteFromCloudinary(car.images);

  await car.deleteOne();

  res.status(200).json(new SuccessResponse(200, "Car deleted successfully"));
});

export {
  addVendorCar,
  deleteVendorCar,
  getVendor,
  getVendorCars,
  logoutVendor,
  forgetPassword,
  updateVendorCar,
  updateVendorProfile,
  vendorLogin,
  vendorRegister,
};
