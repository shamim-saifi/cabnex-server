import { Router } from "express";
import {
  addVendorCar,
  dashboardStats,
  deleteVendorCar,
  forgetPassword,
  getAVendorCar,
  getVendor,
  getVendorCars,
  logoutVendor,
  updateVendorCar,
  updateVendorProfile,
  vendorLogin,
  vendorRegister,
} from "../controllers/vendor.js";
import { getVendorCookies } from "../middlewares/authMiddleware.js";
import { createArrayUpload, upload } from "../middlewares/mutler.js";

const router = Router();

// Public routes
router.post("/register", vendorRegister);
router.post("/login", vendorLogin);
router.put("/forget-password", forgetPassword);

// Protected routes
router.use(getVendorCookies);

router
  .route("/me")
  .get(getVendor)
  .put(
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "panImage", maxCount: 1 },
      { name: "gstImage", maxCount: 1 },
    ]),
    updateVendorProfile
  );

router.get("/dashboard", dashboardStats);

router
  .route("/cars")
  .get(getVendorCars)
  .post(createArrayUpload("images", 10), addVendorCar);

router
  .route("/cars/:id")
  .get(getAVendorCar)
  .put(createArrayUpload("images", 10), updateVendorCar)
  .delete(deleteVendorCar);

router.post("/logout", logoutVendor);

export default router;
