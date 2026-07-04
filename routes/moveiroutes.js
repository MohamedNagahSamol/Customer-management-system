import express from "express";
const router = express.Router();
import { rolesmiddleware } from "../middleware/rolesmiddleware.js";
import { authmiddelware } from "../middleware/authmiddleware.js";
import {
  addmovie,
  deletemovie,
  getallmovie,
  changeposter,
} from "../controllers/moviecontroller.js";
import { asyncHandler } from "../config/handelexpetion.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
router.post(
  "/addmovie",
  authmiddelware,
  rolesmiddleware(["Admin"]),
  asyncHandler(addmovie),
);
router.delete(
  "/deletemovie/:id",
  authmiddelware,
  rolesmiddleware(["Admin"]),
  asyncHandler(deletemovie),
);
router.put(
  "/changeposter/:id",
  authmiddelware,
  upload.single("poster"),
  rolesmiddleware(["Admin"]),
  asyncHandler(changeposter),
);
router.get("/getallmovie", authmiddelware, getallmovie);

export default router;
