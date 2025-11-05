import axios from "axios";
import Booking from "../models/Booking.js";
import City from "../models/City.js";
import RentalPackage from "../models/RentalPackage.js";
import Transfer from "../models/Transfer.js";
import TravelQuery from "../models/TravelQuery.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import generateToken from "../utils/generateToken.js";
import { calculateTax } from "../utils/helper.js";
import SuccessResponse from "../utils/SuccessResponse.js";

const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24 * 30,
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

// Get user statistics
const userStats = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id });
  const totalBookings = bookings.length;
  const inProgressBookings = bookings.filter(
    (booking) => booking.status === "inProgress"
  ).length;
  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  res.status(200).json(
    new SuccessResponse(200, "User stats retrieved successfully", {
      totalBookings,
      inProgressBookings,
      completedBookings,
    })
  );
});

// Get currently logged in user
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  res
    .status(200)
    .json(new SuccessResponse(200, "User retrieved successfully", { user }));
});

// Register a new user
const register = asyncHandler(async (req, res, next) => {
  const { email, mobile, otp } = req.body;

  const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
  if (existingUser) {
    return next(new ErrorResponse(409, "User already exists"));
  }

  if (!otp) {
    return next(new ErrorResponse(400, "OTP is required"));
  }

  if (otp !== process.env.sampleOtp) {
    return next(new ErrorResponse(401, "Invalid OTP"));
  }

  const user = await User.create(req.body);

  if (!user) {
    return next(new ErrorResponse(400, "User registration failed"));
  }
  const userData = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    acceptedTerms: user.acceptedTerms,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  res
    .status(201)
    .cookie("cabnex_token", generateToken(user._id, "30d"), cookieOptions)
    .json(new SuccessResponse(201, "User registered successfully", userData));
});

// Login user
const login = asyncHandler(async (req, res, next) => {
  const { email, password, mobile, otp } = req.body;

  const user = await User.findOne({ $or: [{ mobile }, { email }] }).select(
    "+password"
  );

  if (!user) {
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
      .cookie("cabnex_token", generateToken(user._id, "30d"), cookieOptions)
      .json(new SuccessResponse(200, "User logged in successfully"));
  }

  if (!(await user.isPasswordCorrect(password))) {
    return next(new ErrorResponse(401, "Invalid email or password"));
  }

  const userData = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    acceptedTerms: user.acceptedTerms,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  return res
    .cookie("cabnex_token", generateToken(user._id, "30d"), cookieOptions)
    .json(new SuccessResponse(200, "User logged in successfully", userData));
});

// Forget password
const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email, mobile, password, otp } = req.body;

  const user = await User.findOne({
    $or: [{ email }, { mobile }],
  }).select("+password");

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  if (!otp || otp === "") {
    return next(new ErrorResponse(400, "OTP is required"));
  }

  if (otp !== process.env.sampleOtp) {
    return next(new ErrorResponse(401, "Invalid OTP"));
  }

  user.password = password;
  await user.save();

  res.status(200).json(new SuccessResponse(200, "Password reset successfully"));
});

// Update user details
const updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  Object.assign(user, req.body);
  await user.save();

  res
    .status(200)
    .json(new SuccessResponse(200, "User profile updated successfully", user));
});

// Delete user account
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  user.isActive = false;

  await user.save();

  res.status(200).json(new SuccessResponse(200, "User deleted successfully"));
});

// Get user bookings
const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id }).select(
    "-assignedVendor"
  );

  res
    .status(200)
    .json(
      new SuccessResponse(200, "User bookings retrieved successfully", bookings)
    );
});

// Cancel a booking
const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findOne({
    bookingId: req.params.id,
    userId: req.user._id,
  });

  if (!booking) {
    return next(new ErrorResponse(404, "Booking not found"));
  }

  if (booking.assignedVendor === null) {
    return next(new ErrorResponse(400, "Cannot cancel unassigned booking"));
  }

  booking.status = "cancelled";
  await booking.save();

  res
    .status(200)
    .json(new SuccessResponse(200, "Booking cancelled successfully"));
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  res
    .status(200)
    .clearCookie("cabnex_token", cookieOptions)
    .json(new SuccessResponse(200, "Logged out successfully"));
});

// Search cars for trip
const searchCarsForTrip = asyncHandler(async (req, res, next) => {
  const {
    pickupLocation,
    serviceType,
    pickupDateTime,
    returnDateTime,
    packageId,
    destinations,
    oneWay,
    transferDirection,
  } = req.body;

  // Validate pickup location using Google Places API
  const { data: placeDetails } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json?",
    {
      params: {
        place_id:
          serviceType === "transfer"
            ? transferDirection === "home-to-station"
              ? destinations[0]
              : pickupLocation
            : pickupLocation,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: "name,place_id,address_component",
      },
    }
  );

  if (placeDetails.status !== "OK") {
    return next(new ErrorResponse(400, "Invalid pickup location"));
  }

  // Format the pickup location to match city naming conventions
  const formattedPickupLocation = placeDetails.result.address_components
    .find(
      (comp) =>
        comp.types.includes("locality") ||
        comp.types.includes("administrative_area_level_1")
    )
    ?.long_name.trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Handle transfer service type separately
  if (serviceType === "transfer") {
    let transfer = await Transfer.findOne({
      $or: [
        { place_id: placeDetails?.result?.place_id },
        {
          name: {
            $regex: new RegExp(
              `^${placeDetails?.result?.name
                ?.toLowerCase()
                .split(" ")
                .join("-")}`,
              "i"
            ),
          },
        },
      ],
    }).populate("category.type", "-carNames");

    if (!transfer) {
      transfer = await Transfer.findOne({
        name: "default",
      }).populate("category.type", "-carNames");
    }

    const activeCategories =
      transfer?.category?.filter((cat) => cat.isActive) || [];

    const { data: distanceData } = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin: `place_id:${pickupLocation}`,
          destination: `place_id:${destinations[0]}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (distanceData.status !== "OK") {
      return next(new ErrorResponse(400, "Error fetching distance data"));
    }

    // Sum up distances from origin to destination
    // Convert meters to kilometers and round up
    const [distance, time] = await Promise.all([
      Math.ceil(
        distanceData.routes[0].legs.reduce((acc, elem) => {
          acc += elem.distance.value;
          return acc;
        }, 0) / 1000
      ),
      Math.ceil(
        distanceData.routes[0].legs.reduce((acc, elem) => {
          acc += elem.duration.value;
          return acc;
        }, 0) / 60
      ),
    ]);

    const updatedCategories = activeCategories.map((category) => {
      let totalAmount = category.baseFare || 0;

      if (distance > category.baseKm) {
        const extraKm = distance - category.baseKm;
        totalAmount += extraKm * category.extraKmCharge;
      }

      totalAmount += category.hillCharge;
      totalAmount += calculateTax(totalAmount, category.taxSlab);

      return {
        ...(category.toObject?.() || category), // handle both Mongoose docs or plain JS objects
        totalAmount,
      };
    });

    return res.status(200).json(
      new SuccessResponse(200, "Cars retrieved successfully", {
        city: formattedPickupLocation,
        distance,
        time,
        categories: updatedCategories,
      })
    );
  }

  // Find car categories available in the pickup city
  let categoriesInCity = await City.findOne({
    isActive: true,
    city: {
      $regex: new RegExp(`^${formattedPickupLocation}`, "i"),
    },
  })
    .populate("category.type", "-carNames")
    .select("-activities");

  // Fallback to default city
  if (!categoriesInCity) {
    categoriesInCity = await City.findOne({
      isActive: true,
      city: "default",
    }).populate("category.type", "-carNames");
  }

  const activeCategories =
    categoriesInCity?.category?.filter((cat) => cat.isActive) || [];

  if (destinations && destinations.length > 0) {
    const destinationsParams = oneWay
      ? destinations
      : [...destinations, pickupLocation];

    const origin = `place_id:${pickupLocation}`;
    const destination = `place_id:${
      destinationsParams[destinationsParams.length - 1]
    }`;
    const waypoints = destinationsParams
      .slice(0, -1)
      .map((p) => `place_id:${p}`)
      .join("|");

    // Calculate total distance using Google Distance Matrix API
    const { data: distanceData } = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin,
          destination,
          waypoints: waypoints || undefined,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (distanceData.status !== "OK") {
      return next(new ErrorResponse(400, "Error fetching distance data"));
    }

    // Sum up distances from origin to all destinations
    // Convert meters to kilometers and round up
    const [distance, time] = await Promise.all([
      Math.ceil(
        distanceData.routes[0].legs.reduce((acc, elem) => {
          acc += elem.distance.value;
          return acc;
        }, 0) / 1000
      ),
      Math.ceil(
        distanceData.routes[0].legs.reduce((acc, elem) => {
          acc += elem.duration.value;
          return acc;
        }, 0) / 60
      ),
    ]);

    const updatedCategories = activeCategories.map((category) => {
      let totalAmount = 0;
      totalAmount += category.hillCharge;

      const days = Math.ceil(
        (new Date(returnDateTime) - new Date(pickupDateTime)) /
          (1000 * 60 * 60 * 24)
      );

      if (days && days > 0) {
        const totalDriverAllowance = category.driverAllowance * days;
        const totalNightCharge = category.nightCharge * (days - 1);
        totalAmount += totalDriverAllowance + totalNightCharge;

        const extraKmCharges =
          Math.max(0, distance - category.freeKmPerDay * days) *
          category.extraKmCharge;

        totalAmount += extraKmCharges;

        totalAmount += calculateTax(totalAmount, category.taxSlab);

        return {
          ...(category.toObject?.() || category), // handle both Mongoose docs or plain JS objects
          totalAmount,
        };
      } else {
        totalAmount = distance * category.perKmCharge;

        totalAmount += calculateTax(totalAmount, category.taxSlab);

        return {
          ...(category.toObject?.() || category), // handle both Mongoose docs or plain JS objects
          totalAmount,
        };
      }
    });

    return res.status(200).json(
      new SuccessResponse(200, "Cars retrieved successfully", {
        city: formattedPickupLocation,
        distance,
        time,
        categories: updatedCategories,
      })
    );
  } else {
    if (serviceType === "rental") {
      const rental = await RentalPackage.findById(packageId);

      if (!rental) {
        return next(
          new ErrorResponse(404, "Selected rental package not found")
        );
      }

      const updatedCategories = activeCategories.map((category) => {
        const perHourTotal = rental.duration * category.perHourCharge;
        const perKmTotal = rental.kilometer * category.perKmCharge;

        let totalAmount = Math.max(perHourTotal, perKmTotal);

        totalAmount += calculateTax(totalAmount, category.taxSlab);

        return {
          ...(category.toObject?.() || category), // handle both Mongoose docs or plain JS objects
          totalAmount,
        };
      });

      return res.status(200).json(
        new SuccessResponse(200, "Cars retrieved successfully", {
          city: formattedPickupLocation,
          distance: rental.kilometer,
          time: rental.duration * 60,
          categories: updatedCategories,
        })
      );
    }

    if (serviceType === "activity") {
      const activitiesInCity = await City.findOne({
        isActive: true,
        city: {
          $regex: new RegExp(`^${formattedPickupLocation}`, "i"),
        },
      })
        .select("-category")
        .populate("activities");

      const ActiveActivities = activitiesInCity?.activities
        ?.filter((act) => act.isActive)
        .map((activity) => ({ ...activity, totalAmount: activity?.price }));

      return res.status(200).json(
        new SuccessResponse(200, "Activities retrieved successfully", {
          city: formattedPickupLocation,
          activities: ActiveActivities,
        })
      );
    }

    return res.status(200).json(
      new SuccessResponse(200, "Cars retrieved successfully", {
        city: formattedPickupLocation,
        distance: 0,
        time: 0,
        categories: activeCategories,
      })
    );
  }
});

const travelQuery = asyncHandler(async (req, res, next) => {
  const newTravelQuery = await TravelQuery.create(req.body);
  if (!newTravelQuery) {
    return next(new ErrorResponse(500, "Failed to submit travel query"));
  }
  res
    .status(201)
    .json(new SuccessResponse(201, "Travel query submitted successfully"));
});

export {
  userStats,
  cancelBooking,
  deleteUser,
  forgetPassword,
  getBookings,
  getUser,
  login,
  logout,
  register,
  searchCarsForTrip,
  travelQuery,
  updateDetails,
};
