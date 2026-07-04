import express from "express";
const router = express.Router();
import {
  addtowatchlist,
  deletefromwatchlist,
} from "../controllers/watchlistcontrooler.js";
import { asyncHandler } from "../config/handelexpetion.js";
import { authmiddelware } from "../middleware/authmiddleware.js";

router.post("/addtowatchlist", authmiddelware, asyncHandler(addtowatchlist));
router.delete(
  "/deletefromwatchlist/:id",
  authmiddelware,
  asyncHandler(deletefromwatchlist),
);
export default router;
