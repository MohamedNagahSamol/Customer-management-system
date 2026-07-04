import express from "express";
const router = express.Router();
import {
  login,
  logout,
  register,
  refresh,
} from "../controllers/authcontroller.js";
import { asyncHandler } from "../config/handelexpetion.js";
import { Check } from "../config/check.js";
import { limiter } from "../config/ratelimte.js";
router.use(limiter);

router.post("/register", Check, asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/logout", asyncHandler(logout));
router.get("/refresh", asyncHandler(refresh));
export default router;
