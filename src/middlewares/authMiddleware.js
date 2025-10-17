import jwt from "jsonwebtoken";
import ErrorResponse from "../utils/ErrorResponse.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import Vendor from "../models/Vendor.js";

const getAuthCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["cabnex_token"];

  if (!token) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  req.user = user;

  next();
});

const getVendorCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["cabnex_vendor"];

  if (!token) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const vendor = await Vendor.findById(decoded.id);

  if (!vendor) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  req.vendorId = vendor._id;

  next();
});

const getAdminCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["cabnex-admin"];

  if (!token) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded || decoded.id !== process.env.adminMail) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  next();
});

export { getAuthCookies, getVendorCookies, getAdminCookies };
