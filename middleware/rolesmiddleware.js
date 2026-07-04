import { prisma, connect, disconnect } from "../config/prisma.js";

const rolesmiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.Role)) {
      return res.status(403).json({ message: "Access denid" });
    }
    next();
  };
};

export { rolesmiddleware };
