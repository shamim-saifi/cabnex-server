import { Router } from "express";
import {
  addVendorCar,
  deleteVendorCar,
  forgetPassword,
  getVendor,
  getVendorCars,
  logoutVendor,
  updateVendorCar,
  updateVendorProfile,
  vendorLogin,
  vendorRegister,
} from "../controllers/vendor.js";
import { getVendorCookies } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/mutler.js";

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
router
  .route("/cars")
  .get(getVendorCars)
  .post(upload.array("images"), addVendorCar);
router
  .route("/cars/:id")
  .put(upload.array("images"), updateVendorCar)
  .delete(deleteVendorCar);
router.post("/logout", logoutVendor);

export default router;
