import { Router } from "express";
import {
  createTravelPackage,
  createRentalPackage,
  deleteTravelPackage,
  deleteRentalPackage,
  getAllTravelPackages,
  getAllRentalPackages,
  updateTravelPackage,
  updateRentalPackage,
  createActivityPackage,
} from "../controllers/package.js";
import { upload } from "../middlewares/mutler.js";
import { getAdminCookies } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/travel").get(getAllTravelPackages);
router.route("/rental").get(getAllRentalPackages);

router.use(getAdminCookies);
// Routes for Travel Packages
router.route("/travel").post(upload.single("image"), createTravelPackage);
router
  .route("/travel/:id")
  .put(upload.single("image"), updateTravelPackage)
  .delete(deleteTravelPackage);

// Route for Rental Packages
router.route("/rental").post(upload.single("image"), createRentalPackage);
router
  .route("/rental/:id")
  .put(updateRentalPackage)
  .delete(deleteRentalPackage);

// Activity Packages
router.route("/activity").post(createActivityPackage);

export default router;
