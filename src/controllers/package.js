import { validate } from "uuid";
import ActivityPackage from "../models/ActivityPackage.js";
import City from "../models/City.js";
import RentalPackage from "../models/RentalPackage.js";
import TravelPackage from "../models/TravelPackage.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";

// Get All Travel Packages
const getAllTravelPackages = asyncHandler(async (req, res, next) => {
  const travelPackages = await TravelPackage.find();

  if (!travelPackages) {
    return next(new ErrorResponse(404, "No travel packages found"));
  }

  res
    .status(200)
    .json(
      new SuccessResponse(
        200,
        "Travel packages retrieved successfully",
        travelPackages
      )
    );
});

// Create Travel Package
const createTravelPackage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse(400, "Image file is required"));
  }

  const uploadedFile = await uploadToCloudinary([req.file]);

  req.body.image = uploadedFile[0];

  const travelPackage = await TravelPackage.create(req.body);

  if (!travelPackage) {
    return next(new ErrorResponse(400, "Failed to create travel package"));
  }

  res
    .status(201)
    .json(new SuccessResponse(201, "Travel package created successfully"));
});

// Update Travel Package
const updateTravelPackage = asyncHandler(async (req, res, next) => {
  const travelPackageExists = await TravelPackage.findById(req.params.id);
  if (!travelPackageExists) {
    return next(new ErrorResponse(404, "Travel package not found"));
  }

  if (req.file) {
    const image = await uploadToCloudinary([req.file]);
    req.body.image = image[0];
    if (travelPackageExists.image?.public_id) {
      await deleteFromCloudinary([travelPackageExists.image]);
    }
  }

  await travelPackageExists.set(req.body);
  await travelPackageExists.save();

  res
    .status(200)
    .json(new SuccessResponse(200, "Travel package updated successfully"));
});

// Delete Travel Package
const deleteTravelPackage = asyncHandler(async (req, res, next) => {
  const travelPackage = await TravelPackage.findByIdAndDelete(req.params.id);

  if (!travelPackage) {
    return next(new ErrorResponse(404, "Travel package not found"));
  }

  return res
    .status(200)
    .json(new SuccessResponse(200, "Travel package deleted successfully"));
});

// Get All Rental Packages
const getAllRentalPackages = asyncHandler(async (req, res, next) => {
  const rentalPackages = await RentalPackage.find();

  res
    .status(200)
    .json(
      new SuccessResponse(
        200,
        "Rental packages retrieved successfully",
        rentalPackages
      )
    );
});

// Create Rental Package
const createRentalPackage = asyncHandler(async (req, res, next) => {
  const rentalPackage = await RentalPackage.create(req.body);

  if (!rentalPackage) {
    return next(new ErrorResponse(400, "Failed to create rental package"));
  }
  res
    .status(201)
    .json(new SuccessResponse(201, "Rental package created successfully"));
});

// Update Rental Package
const updateRentalPackage = asyncHandler(async (req, res, next) => {
  const rentalPackage = await RentalPackage.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!rentalPackage) {
    return next(new ErrorResponse(404, "Rental package not found"));
  }

  res
    .status(200)
    .json(new SuccessResponse(200, "Rental package updated successfully"));
});

// Delete Rental Package
const deleteRentalPackage = asyncHandler(async (req, res, next) => {
  const rentalPackage = await RentalPackage.findByIdAndDelete(req.params.id);
  if (!rentalPackage) {
    return next(new ErrorResponse(404, "Rental package not found"));
  }
  res
    .status(200)
    .json(new SuccessResponse(200, "Rental package deleted successfully"));
});

const getActivityPackages = asyncHandler(async (req, res, next) => {
  const activityPackages = await ActivityPackage.find();
  if (!activityPackages) {
    return next(new ErrorResponse(404, "Activity packages not found"));
  }
  res
    .status(200)
    .json(
      new SuccessResponse(
        200,
        "Activity packages retrieved successfully",
        activityPackages
      )
    );
});

// Create Activity Package
const createActivityPackage = asyncHandler(async (req, res, next) => {
  const {
    cityId,
    title,
    description,
    duration,
    price,
    pricingOptions,
    itinerary,
    includes,
    excludes,
    cancellationPolicy,
  } = req.body;

  const city = await City.findById(cityId);

  if (!city) {
    return next(new ErrorResponse(404, "City not found"));
  }

  if (req.files && req.files.length > 0) {
    const uploadedImages = await uploadToCloudinary(req.files);
    req.body.images = uploadedImages;
  }

  const newPackage = await ActivityPackage.create({
    cityId,
    title,
    description,
    images: req.body.images,
    duration,
    price,
    pricingOptions: pricingOptions ? JSON.parse(pricingOptions) : undefined,
    itinerary: itinerary ? JSON.parse(itinerary) : undefined,
    includes: includes ? JSON.parse(includes) : [],
    excludes: excludes ? JSON.parse(excludes) : [],
    cancellationPolicy,
  });

  city.activities.push(newPackage._id);
  await city.save();

  return res.status(201).json({
    success: true,
    data: newPackage,
  });
});

const updateActivityPackage = asyncHandler(async (req, res, next) => {
  const activityPackage = await ActivityPackage.findById(req.params.id);
  if (!activityPackage) {
    return next(new ErrorResponse(404, "Activity package not found"));
  }

  // parse JSON fields
  const pricingOptions = req.body.pricingOptions
    ? JSON.parse(req.body.pricingOptions)
    : [];
  const itinerary = req.body.itinerary ? JSON.parse(req.body.itinerary) : [];
  const includes = req.body.includes ? JSON.parse(req.body.includes) : [];
  const excludes = req.body.excludes ? JSON.parse(req.body.excludes) : [];

  // other simple fields
  const { cityId, title, description, duration, price, cancellationPolicy } =
    req.body;

  if (req.files && req.files.length > 0) {
    const uploadedImages = await uploadToCloudinary(req.files);
    req.body.images = uploadedImages;
    if (activityPackage.images && activityPackage.images.length > 0) {
      await deleteFromCloudinary(activityPackage.images);
    }
  }

  await activityPackage.set({
    cityId,
    title,
    description,
    duration: Number(duration),
    price: Number(price),
    cancellationPolicy,
    pricingOptions,
    itinerary,
    includes,
    excludes,
    images: req.body.images,
  });
  await activityPackage.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new SuccessResponse(200, "Activity package updated successfully"));
});

const deleteActivityPackage = asyncHandler(async (req, res, next) => {
  const activityPackage = await ActivityPackage.findById(req.params.id);
  if (!activityPackage) {
    return next(new ErrorResponse(404, "Activity package not found"));
  }
  // Delete images from Cloudinary
  if (activityPackage.images && activityPackage.images.length > 0) {
    await deleteFromCloudinary(activityPackage.images);
  }
  await activityPackage.deleteOne();
  res
    .status(200)
    .json(new SuccessResponse(200, "Activity package deleted successfully"));
});

const toggleActivityPackageStatus = asyncHandler(async (req, res, next) => {
  const activityPackage = await ActivityPackage.findById(req.params.id);

  if (!activityPackage) {
    return next(new ErrorResponse(404, "Activity package not found"));
  }

  activityPackage.isActive = !activityPackage.isActive;
  await activityPackage.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new SuccessResponse(200, "Activity package status updated successfully")
    );
});

export {
  toggleActivityPackageStatus,
  updateActivityPackage,
  deleteActivityPackage,
  createActivityPackage,
  createRentalPackage,
  createTravelPackage,
  deleteRentalPackage,
  deleteTravelPackage,
  getActivityPackages,
  getAllRentalPackages,
  getAllTravelPackages,
  updateRentalPackage,
  updateTravelPackage,
};
