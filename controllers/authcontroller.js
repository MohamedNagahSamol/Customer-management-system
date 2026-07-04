import { prisma, connect, disconnect } from "../config/prisma.js";
import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const objError = validationResult(req);
  if (objError.errors.length > 0) {
    return res.status(400).json({ message: objError.errors });
  }
  await connect();
  const isEmailExist = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if (isEmailExist) {
    return res.status(401).json({ message: "this email is exist" });
  }
  req.body.password = await bcrypt.hash(req.body.password, 10);
  const newAuth = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    },
  });
  const token = jwt.sign({ id: newAuth.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign({ id: newAuth.id }, process.env.REFRESH_TOKEN, {
    expiresIn: "30d",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 86400000 * 30,
  });
  res.status(201).json({ token: token, message: "correct signup" });
};
const login = async (req, res) => {
  const objError = validationResult(req);
  if (objError.errors.length > 0) {
    return res.status(400).json({ message: objError.errors });
  }
  await connect();
  const isUserExist = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if (!isUserExist) {
    return res.status(401).json({ message: "this email is not exist" });
  }
  let ismatch = await bcrypt.compare(req.body.password, isUserExist.password);
  if (!ismatch) {
    return res.status(401).json({ message: "this password is not correct" });
  }
  const token = jwt.sign({ id: isUserExist.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(
    { id: isUserExist.id },
    process.env.REFRESH_TOKEN,
    { expiresIn: "30d" },
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,

    maxAge: 86400000 * 30,
  });
  res.status(200).json({ token: token, message: "correct login" });
};
const logout = async (req, res) => {
  const cookies = req.cookies.refreshToken;
  if (!cookies) {
    return res.status(204).json({ message: "Unauthorized" });
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
  });
  res.status(200).json({ message: "logout successfuly" });
};
const refresh = async (req, res) => {
  const cookies = req.cookies.refreshToken;
  if (!cookies) {
    return res.status(204).json({ message: "Unauthorized" });
  }
  const decoded = jwt.verify(cookies, process.env.REFRESH_TOKEN);
  await connect();
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    return res.status(404).json({ message: "no user" });
  }
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  res.json({ accessToken: accessToken });
};

export  { register, login, logout, refresh };
