import { Router } from "express";
import {
  addCarCategory,
  addCarToCategory,
  addNewCategoryToCity,
  addNewCity,
  adminLogin,
  adminLogout,
  allBookings,
  allUsers,
  allVendors,
  assignVendorToBooking,
  bookingStats,
  carStats,
  checkAdmin,
  dashboardStats,
  deleteCarCategory,
  getAllCarCategories,
  getAllCars,
  getBookingDetails,
  getCarDetails,
  getCities,
  getUserDetails,
  getVendorDetails,
  rejectBooking,
  toggleCategoryStatusFromCity,
  updateACar,
  updateAVendor,
  updateCarCategory,
  updateCategoryFromCity,
  userStats,
  vendorStats,
} from "../controllers/admin.js";
import { getAdminCookies } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/mutler.js";

const router = Router();

router.post("/login", adminLogin);
router.get("/car-categories", getAllCarCategories);
router.get("/dashboard-stats", dashboardStats);

router.use(getAdminCookies);
router.get("/check", checkAdmin);
router.get("/user-stats", userStats);
router.get("/users", allUsers);
router.get("/users/:id", getUserDetails);
router.get("/booking-stats", bookingStats);
router.get("/bookings", allBookings);
router.get("/bookings/:id", getBookingDetails);
router.post("/bookings/:id/assign-vendor", assignVendorToBooking);
router.post("/bookings/:id/reject-booking", rejectBooking);

router.get("/vendor-stats", vendorStats);
router.get("/vendors", allVendors);
router.route("/vendors/:id").get(getVendorDetails).patch(updateAVendor);

// City management routes
router.route("/cities").get(getCities).post(addNewCity);
router.route("/cities/:cityId").put(addNewCategoryToCity);

// Category management routes within a city
router
  .route("/cities/:cityId/category/:categoryId")
  .put(updateCategoryFromCity)
  .patch(toggleCategoryStatusFromCity);

// Car categories management routes
router.route("/car-categories").post(
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  addCarCategory
);
router
  .route("/car-categories/:id")
  .put(
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "icon", maxCount: 1 },
    ]),
    updateCarCategory
  )
  .patch(addCarToCategory)
  .delete(deleteCarCategory);

// Car management routes
router.get("/car-stats", carStats);
router.get("/cars", getAllCars);
router.route("/cars/:id").get(getCarDetails).patch(updateACar);

router.post("/logout", adminLogout);

export default router;
