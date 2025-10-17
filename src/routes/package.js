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

const router = Router();

// Routes for Travel Packages
router
  .route("/travel")
  .get(getAllTravelPackages)
  .post(upload.single("image"), createTravelPackage);

router
  .route("/travel/:id")
  .put(upload.single("image"), updateTravelPackage)
  .delete(deleteTravelPackage);

// Route for Rental Packages
router.route("/rental").get(getAllRentalPackages).post(createRentalPackage);

router
  .route("/rental/:id")
  .put(updateRentalPackage)
  .delete(deleteRentalPackage);

// Activity Packages
router.route("/activity").post(createActivityPackage);

export default router;
