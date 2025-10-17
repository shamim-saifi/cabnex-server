import { Router } from "express";
import {
  cancelBooking,
  deleteUser,
  forgetPassword,
  getBookings,
  getUser,
  login,
  logout,
  register,
  searchCarsForTrip,
  updateDetails,
} from "../controllers/auth.js";
import { getAuthCookies } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes
router.post("/search", searchCarsForTrip);
router.post("/register", register);
router.post("/login", login);
router.put("/forget-password", forgetPassword);

// Protected routes
router.use(getAuthCookies);
router.route("/me").get(getUser).put(updateDetails).delete(deleteUser);
router.get("/bookings", getBookings);
router.post("/bookings/:id", cancelBooking);
router.post("/logout", logout);

export default router;
