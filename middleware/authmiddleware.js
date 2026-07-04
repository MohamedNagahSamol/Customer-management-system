import jwt from "jsonwebtoken";
import { prisma, connect, disconnect } from "../config/prisma.js";

const authmiddelware = async (req, res, next) => {
  const head = req.headers.authorization || req.headers.Authorization;
  const token = head?.split(" ")[1];
  if (!head?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).json({ message: "no user" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "expried" });
  }
};

export { authmiddelware };
