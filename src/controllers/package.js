import TravelPackage from "../models/TravelPackage.js";
import RentalPackage from "../models/RentalPackage.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";
import City from "../models/City.js";
import ActivityPackage from "../models/ActivityPackage.js";

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

const createActivityPackage = asyncHandler(async (req, res, next) => {
  const {
    cityId,
    title,
    description,
    images,
    duration,
    price,
    startLocation,
    itinerary,
    includes,
    excludes,
    cancellationPolicy,
  } = req.body;

  const activityPackage = await ActivityPackage.create({
    cityId,
    title,
    description,
    images,
    duration,
    price,
    startLocation,
    itinerary,
    includes,
    excludes,
    cancellationPolicy,
  });

  if (!activityPackage) {
    return next(new ErrorResponse(400, "Failed to create activity package"));
  }

  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse(404, "City not found"));
  }
  city.activities.push(activityPackage._id);
  await city.save();

  res
    .status(201)
    .json(
      new SuccessResponse(
        201,
        "Activity package created successfully",
        activityPackage
      )
    );
});

export {
  // Travel Packages
  getAllTravelPackages,
  createTravelPackage,
  updateTravelPackage,
  deleteTravelPackage,
  // Rental Packages
  getAllRentalPackages,
  createRentalPackage,
  updateRentalPackage,
  deleteRentalPackage,
  // Activity Packages
  createActivityPackage,
};
