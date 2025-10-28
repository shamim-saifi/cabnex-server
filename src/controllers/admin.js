import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import CarCategory from "../models/CarCategory.js";
import City from "../models/City.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import generateToken from "../utils/generateToken.js";
import {
  generateBookingChartData,
  generateRevenueChartData,
  generateVendorCarChartData,
} from "../utils/helper.js";
import SuccessResponse from "../utils/SuccessResponse.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Check admin route
const checkAdmin = asyncHandler(async (_, res) => {
  res.status(200).json(new SuccessResponse(200, "You are admin"));
});

// Login admin
const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (
    email !== process.env.adminMail ||
    password !== process.env.adminPassword
  ) {
    return next(new ErrorResponse(401, "Invalid admin credentials"));
  }

  const token = generateToken(email);

  res
    .status(200)
    .cookie("cabnex-admin", token, cookieOptions)
    .json(new SuccessResponse(200, "Welcome Boss!", { token }));
});

// Logout admin
const adminLogout = asyncHandler(async (_, res) => {
  res
    .status(200)
    .clearCookie("cabnex-admin", cookieOptions)
    .json(new SuccessResponse(200, "Logged out successfully"));
});

// Get dashboard statistics
const dashboardStats = asyncHandler(async (_, res, next) => {
  const [bookings, vendors, cars] = await Promise.all([
    Booking.find()
      .populate("userId", "fullName")
      .populate("assignedVendor", "name")
      .sort({ bookingId: -1 }),
    Vendor.find(),
    Car.find(),
  ]);

  const now = new Date();

  // Total bookings
  const totalBookings = bookings.length;

  // Active bookings (pickup <= now <= return OR pickup <= now and no returnDate)
  const activeBookings = bookings.filter((b) => {
    const pickup = new Date(b.pickupDateTime);
    const returnDate = b.returnDateTime ? new Date(b.returnDateTime) : null;
    const active =
      b.status === "inProgress" ||
      (pickup <= now && (!returnDate || now <= returnDate));
    return active && b.assignedVendor != null;
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.pickupDateTime) > now && b.status === "inProgress"
  );

  const completedBookings = bookings.filter((b) => {
    const returnDate = b.returnDateTime ? new Date(b.returnDateTime) : null;
    return (returnDate && returnDate < now) || b.status === "completed";
  });

  // ─────── BOOKING CHART ────────────────
  const bookingChartData = generateBookingChartData(bookings);

  // ─────── REVENUE CHART ────────────────
  const revenueChartData = generateRevenueChartData(bookings);

  // ─────── VENDOR-CAR CHART ─────────────
  const vendorCarChartData = generateVendorCarChartData(vendors, cars);

  // ──────────────── IN-PROGRESS TABLE DATA ────────────────
  const inProgressTable = activeBookings
    .map((b) => ({
      bookingId: b.bookingId,
      userName: b.userId?.fullName || "N/A",
      carCategory: b.carCategory || "N/A",
      serviceType: b.serviceType || "N/A",
      totalDays: b.returnDateTime
        ? Math.ceil(
            (new Date(b.returnDateTime) - new Date(b.pickupDateTime)) / 86400000
          )
        : 0,
      totalAmount: b.totalAmount,
      status: b.status,
    }))
    .slice(0, 5);

  // ──────────────── PENDING BOOKINGS TABLE DATA ────────────────

  const pendingBookingsTable = pendingBookings.map((b) => ({
    bookingId: b.bookingId,
    userName: b.userId?.fullName || "N/A",
    carCategory: b.carCategory || "N/A",
    serviceType: b.serviceType || "N/A",
    packageType: b.packageType,
    pickupDateTime: b.pickupDateTime,
    startLocation: b.startLocation?.address || "N/A",
    destinations: b.destinations?.map((d) => d.address) || [],
    type:
      Math.ceil(
        (new Date(b.returnDateTime) - new Date(b.pickupDateTime)) / 86400000
      ) > 0
        ? "multi"
        : "one",
    totalAmount: b.totalAmount,
    status: b.status,
  }));

  return res.status(200).json(
    new SuccessResponse(200, "Dashboard statistics fetched successfully", {
      bookings: [
        { title: "Total Bookings", stats: totalBookings, tag: "total" },
        {
          title: "Active Bookings",
          stats: activeBookings.length,
          tag: "active",
        },
        {
          title: "Upcoming Bookings",
          stats: upcomingBookings.length,
          tag: "upcoming",
        },
        {
          title: "Completed Bookings",
          stats: completedBookings.length,
          tag: "completed",
        },
      ],
      charts: {
        bookingChartData,
        revenueChartData,
        vendorCarChartData,
      },
      inProgressTable,
      pendingBookingsTable,
    })
  );
});

// Get user statistics
const userStats = asyncHandler(async (_, res) => {
  const [totalUsers, activeUsers, userWithBookings] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ bookings: { $exists: true, $ne: [] } }),
  ]);

  res.status(200).json(
    new SuccessResponse(200, "User statistics fetched successfully", [
      { title: "Total Users", stats: totalUsers },
      { title: "Total Active", stats: activeUsers },
      { title: "Total User with Bookings", stats: userWithBookings },
    ])
  );
});

// Get all users
const allUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, resultPerPage = 10 } = req.query;
  const skip = (page - 1) * resultPerPage;

  const [users, totalCount] = await Promise.all([
    User.find(
      search
        ? {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { mobile: { $regex: search, $options: "i" } },
            ],
          }
        : {}
    )
      .select("fullName email mobile createdAt")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(resultPerPage),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalCount / resultPerPage);

  res.status(200).json(
    new SuccessResponse(200, "Users fetched successfully", {
      totalCount,
      totalPages,
      currentPage: Number(page),
      data: users,
    })
  );
});

// Get user details
const getUserDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("bookings");
  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }
  res
    .status(200)
    .json(new SuccessResponse(200, "User fetched successfully", user));
});

// Get booking statistics
const bookingStats = asyncHandler(async (_, res) => {
  const bookings = await Booking.find();
  const totalBookings = bookings.length;
  const ActiveBookings = bookings.filter(
    (b) =>
      b.status === "inProgress" ||
      new Date(b.returnDateTime) >= new Date(b.pickupDateTime)
  ).length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  res.status(200).json(
    new SuccessResponse(200, "Booking statistics fetched successfully", [
      {
        title: "Total Bookings",
        stats: totalBookings,
      },
      {
        title: "Active Bookings",
        stats: ActiveBookings,
      },
      {
        title: "Pending Bookings",
        stats: pendingBookings,
      },
    ])
  );
});

// get all bookings
const allBookings = asyncHandler(async (req, res) => {
  const { search = "", page, resultPerPage = 10 } = req.query;
  const skip = (page - 1) * resultPerPage;

  const [bookings, totalCount] = await Promise.all([
    Booking.find(
      search
        ? {
            $or: [
              { bookingId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
              { carCategory: { $regex: search, $options: "i" } },
            ],
          }
        : {}
    )
      .sort({
        bookingId: -1,
      })
      .skip(skip)
      .limit(resultPerPage)
      .populate("userId", "fullName email mobile")
      .populate("assignedVendor", "contactPerson email company contactPhone"),
    Booking.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalCount / resultPerPage);

  res.status(200).json(
    new SuccessResponse(200, "Bookings fetched successfully", {
      totalCount,
      totalPages,
      currentPage: Number(page),
      data: bookings,
    })
  );
});

const assignVendorToBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { vendorId } = req.body;
  const booking = await Booking.findOne({ bookingId: id });
  if (!booking) {
    return next(new ErrorResponse(404, "Booking not found"));
  }
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return next(new ErrorResponse(404, "Vendor not found"));
  }

  booking.assignedVendor = vendorId;
  await booking.save();

  vendor.bookings.push(bookingId);
  await vendor.save();

  res
    .status(200)
    .json(new SuccessResponse(200, "Vendor assigned successfully", booking));
});

const rejectBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const booking = await Booking.findOne({ bookingId: id });
  if (!booking) {
    return next(new ErrorResponse(404, "Booking not found"));
  }

  booking.status = "cancelled";
  await booking.save();

  res
    .status(200)
    .json(new SuccessResponse(200, "Booking rejected successfully", booking));
});

// Get booking details
const getBookingDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const booking = await Booking.findOne({ bookingId: id })
    .populate("userId", "fullName email mobile")
    .populate("assignedVendor", "contactPerson email company contactPhone");
  if (!booking) {
    return next(new ErrorResponse(404, "Booking not found"));
  }
  res
    .status(200)
    .json(new SuccessResponse(200, "Booking fetched successfully", booking));
});

// Get vendor statistics
const vendorStats = asyncHandler(async (_, res) => {
  const [approved, pending, rejected] = await Promise.all([
    Vendor.countDocuments({ isVerified: "approved" }),
    Vendor.countDocuments({ isVerified: "pending" }),
    Vendor.countDocuments({ isVerified: "rejected" }),
  ]);

  res.status(200).json(
    new SuccessResponse(200, "Vendor statistics fetched successfully", [
      { title: "Total Approved", stats: approved },
      { title: "Total Pending", stats: pending },
      { title: "Total Rejected", stats: rejected },
    ])
  );
});

// get all vendors
const allVendors = asyncHandler(async (req, res) => {
  const { search = "", page = 1, resultPerPage = 10 } = req.query;
  const skip = (page - 1) * resultPerPage;
  const [vendors, totalCount] = await Promise.all([
    Vendor.find(
      search
        ? {
            $or: [
              { company: { $regex: search, $options: "i" } },
              { contactPerson: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { contactPhone: { $regex: search, $options: "i" } },
            ],
          }
        : {}
    )
      .select(
        "company companyType contactPerson email contactPhone isVerified createdAt"
      )
      .populate(
        "cars",
        "make model registrationNumber fuelType isVerified status"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(resultPerPage)
      .populate("cars"),
    Vendor.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalCount / resultPerPage);

  res.status(200).json(
    new SuccessResponse(200, "Vendors fetched successfully", {
      totalCount,
      totalPages,
      currentPage: Number(page),
      data: vendors,
    })
  );
});

// Get vendor details
const getVendorDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const vendor = await Vendor.findById(id).populate("cars");

  if (!vendor) {
    return next(new ErrorResponse(404, "Vendor not found"));
  }

  res.status(200).json(
    new SuccessResponse(200, "Vendor fetched successfully", {
      vendor,
    })
  );
});

// Get all cities
const getCities = asyncHandler(async (req, res, next) => {
  const cities = await City.find({ isActive: true }).populate("category.type");

  if (!cities) {
    return next(new ErrorResponse(404, "No cities found"));
  }
  res
    .status(200)
    .json(new SuccessResponse(200, "Cities fetched successfully", { cities }));
});

// Add city
const addNewCity = asyncHandler(async (req, res, next) => {
  const { city, state, category } = req.body;

  const cityName = city.toLowerCase().split(" ").join("-");

  const cityExists = await City.findOne({
    city: cityName,
  });

  if (cityExists) {
    return next(new ErrorResponse(400, "City already exists"));
  }

  const newCity = await City.create({
    city: cityName,
    state: state.toLowerCase().split(" ").join("-"),
    category: category || [],
  });

  if (!newCity) {
    return next(new ErrorResponse(400, "Failed to add city"));
  }

  res.status(201).json(
    new SuccessResponse(201, "City added successfully", {
      city: newCity,
    })
  );
});

// Add new category to existing city
const addNewCategoryToCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const categoryData = req.body;

  const city = await City.findById(cityId);

  if (!city) {
    return next(new ErrorResponse(404, "City not found"));
  }

  city.category.push(categoryData);

  await city.save();

  res.status(201).json(
    new SuccessResponse(201, "Category added to city successfully", {
      city,
    })
  );
});

// Update category from existing city
const updateCategoryFromCity = asyncHandler(async (req, res, next) => {
  const { cityId, categoryId } = req.params;

  const categoryData = req.body;
  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse(404, "City not found"));
  }
  const categoryIndex = city.category.findIndex(
    (cat) => cat._id.toString() === categoryId
  );
  if (categoryIndex === -1) {
    return next(new ErrorResponse(404, "Category not found in city"));
  }
  city.category[categoryIndex] = {
    ...city.category[categoryIndex]._doc,
    ...categoryData,
  };
  await city.save();
  res
    .status(200)
    .json(new SuccessResponse(200, "Category updated successfully in city"));
});

// Toggle category status from existing city
const toggleCategoryStatusFromCity = asyncHandler(async (req, res, next) => {
  const { cityId, categoryId } = req.params;
  const city = await City.findById(cityId);
  if (!city) {
    return next(new ErrorResponse(404, "City not found"));
  }
  const categoryIndex = city.category.findIndex(
    (cat) => cat._id.toString() === categoryId
  );

  if (categoryIndex === -1) {
    return next(new ErrorResponse(404, "Category not found in city"));
  }

  city.category[categoryIndex].isActive =
    !city.category[categoryIndex].isActive;

  await city.save();

  res.status(200).json(
    new SuccessResponse(200, "Category status toggled successfully", {
      city,
    })
  );
});

// Get all car categories
const getAllCarCategories = asyncHandler(async (_, res) => {
  const categories = await CarCategory.find({ isActive: true });
  const totalCount = await CarCategory.countDocuments();

  if (!categories) {
    return next(new ErrorResponse(404, "No car categories found"));
  }

  res.status(200).json(
    new SuccessResponse(200, "Car categories fetched successfully", {
      totalCount,
      categories,
    })
  );
});

// Add car category
const addCarCategory = asyncHandler(async (req, res, next) => {
  const category = req.body.category.toLowerCase().split(" ").join("-");

  const categoryExists = await CarCategory.findOne({
    category,
  });

  if (categoryExists) {
    return next(new ErrorResponse(400, "Car category already exists"));
  }

  if (!req.files) {
    return next(new ErrorResponse(400, "Images are required"));
  }

  if (req.files.image) {
    const image = await uploadToCloudinary([req.files.image[0]]);
    req.body.image = image[0];
  }

  if (req.files.icon) {
    const icon = await uploadToCloudinary([req.files.icon[0]]);
    req.body.icon = icon[0];
  }

  req.body.category = category;

  const addedCategory = await CarCategory.create(req.body);

  if (!addedCategory) {
    await deleteFromCloudinary([
      req.body.image.public_id,
      req.body.icon.public_id,
    ]);
    return next(new ErrorResponse(400, "Failed to add car category"));
  }

  res
    .status(201)
    .json(
      new SuccessResponse(201, "Car category added successfully", addedCategory)
    );
});

// Update car category
const updateCarCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const categoryExists = await CarCategory.findById(id);

  if (!categoryExists) {
    return next(new ErrorResponse(404, "Car category not found"));
  }

  if (req.files.image) {
    const image = await uploadToCloudinary([req.files.image[0]]);
    req.body.image = image[0];
    if (categoryExists.image.public_id) {
      await deleteFromCloudinary([categoryExists.image]);
    }
  }

  if (req.files.icon) {
    const icon = await uploadToCloudinary([req.files.icon[0]]);
    req.body.icon = icon[0];
    if (categoryExists.icon.public_id) {
      await deleteFromCloudinary([categoryExists.icon]);
    }
  }

  req.body.category = req.body.category.toLowerCase().split(" ").join("-");

  const updatedCategory = await CarCategory.findOneAndUpdate(
    { _id: id },
    req.body,
    { new: true }
  );

  res.status(200).json(
    new SuccessResponse(200, "Car category updated successfully", {
      updatedCategory,
    })
  );
});

// Add car to category
const addCarToCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { carNames } = req.body;

  const categoryExists = await CarCategory.findById(id);

  if (!categoryExists) {
    return next(new ErrorResponse(404, "Car category not found"));
  }

  categoryExists.carNames.push(...carNames);
  await categoryExists.save();

  res
    .status(201)
    .json(new SuccessResponse(201, "Car added to category successfully"));
});

// Delete car category
const deleteCarCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const categoryExists = await CarCategory.findById(id);

  if (!categoryExists) {
    return next(new ErrorResponse(404, "Car category not found"));
  }

  await deleteFromCloudinary([categoryExists.image, categoryExists.icon]);

  await categoryExists.deleteOne();

  res
    .status(200)
    .json(new SuccessResponse(200, "Car category deleted successfully"));
});

// Get car statistics
const carStats = asyncHandler(async (req, res, next) => {
  const totalCars = await Car.countDocuments();
  const activeCars = await Car.countDocuments({ isActive: true });
  const inactiveCars = totalCars - activeCars;

  res.status(200).json(
    new SuccessResponse(200, "Car statistics fetched successfully", [
      { title: "Total Cars", stats: totalCars },
      { title: "Active Cars", stats: activeCars },
      { title: "Inactive Cars", stats: inactiveCars },
    ])
  );
});

// Get all cars
const getAllCars = asyncHandler(async (req, res, next) => {
  const { search = "", page = 1, resultPerPage = 10 } = req.query;
  const skip = (page - 1) * resultPerPage;

  const [cars, totalCount] = await Promise.all([
    Car.find(
      search
        ? {
            $or: [
              { make: { $regex: search, $options: "i" } },
              { model: { $regex: search, $options: "i" } },
              { registrationNumber: { $regex: search, $options: "i" } },
            ],
          }
        : {}
    )
      .select(
        "make model vendor registrationNumber fuelType year status isVerified createdAt"
      )
      .populate("vendor", "company isVerified")
      .sort("-1")
      .skip(skip)
      .limit(resultPerPage),
    Car.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalCount / resultPerPage);

  res.status(200).json(
    new SuccessResponse(200, "Cars fetched successfully", {
      totalCount,
      totalPages,
      currentPage: Number(page),
      data: cars,
    })
  );
});

// Get car details
const getCarDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const car = await Car.findById(id).populate(
    "vendor",
    "company contactPerson email contactPhone companyType isVerified"
  );

  if (!car) {
    return next(new ErrorResponse(404, "Car not found"));
  }
  res
    .status(200)
    .json(new SuccessResponse(200, "Car fetched successfully", car));
});

// Update a vendor
const updateAVendor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const vendor = await Vendor.findByIdAndUpdate(id, req.body);

  if (!vendor) {
    return next(new ErrorResponse(404, "Vendor not found"));
  }

  res.status(200).json(new SuccessResponse(200, "Vendor updated successfully"));
});

// Update a car
const updateACar = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const car = await Car.findByIdAndUpdate(id, req.body);

  if (!car) {
    return next(new ErrorResponse(404, "Car not found"));
  }

  res.status(200).json(new SuccessResponse(200, "Car updated successfully"));
});

export {
  addCarToCategory,
  updateACar,
  updateAVendor,
  getCarDetails,
  carStats,
  vendorStats,
  userStats,
  addCarCategory,
  addNewCategoryToCity,
  addNewCity,
  getAllCars,
  adminLogin,
  adminLogout,
  allBookings,
  allUsers,
  allVendors,
  checkAdmin,
  deleteCarCategory,
  getAllCarCategories,
  getCities,
  getUserDetails,
  getVendorDetails,
  toggleCategoryStatusFromCity,
  updateCarCategory,
  updateCategoryFromCity,
  dashboardStats,
  getBookingDetails,
  bookingStats,
  assignVendorToBooking,
  rejectBooking,
};
