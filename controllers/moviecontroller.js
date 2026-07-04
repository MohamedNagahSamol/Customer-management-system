import { prisma, connect, disconnect } from "../config/prisma.js";
import cloud from "cloudinary";
const cloudinary = cloud.v2;
const addmovie = async (req, res) => {
  await connect();
  const { title, runtime, genres, releaseYear, overvieW } = req.body;

  const movieisexist = await prisma.movie.findUnique({
    where: { title_createby: { title: title, createby: req.user.id } },
  });
  if (movieisexist) {
    return res.status(400).json({ message: "this movie is exist" });
  }
  await prisma.movie.create({
    data: {
      title: title,
      releaseYear: releaseYear,
      runtime: runtime,
      genres: genres,
      createby: req.user.id,
      overvieW: overvieW,
    },
  });
  res.status(201).json({ message: "created movie" });
};
const deletemovie = async (req, res) => {
  await connect();
  const movieisexist = await prisma.movie.findUnique({
    where: { id: req.params.id },
  });
  if (!movieisexist) {
    return res.status(404).json({ message: "this movie is not found" });
  }
  await prisma.movie.delete({ where: { id: req.params.id } });
  res.status(200).json({ message: "this movie deleted" });
};
const changeposter = async (req, res) => {
  await connect();
  const movieisexist = await prisma.movie.findUnique({
    where: { id: req.params.id },
  });
  if (!movieisexist) {
    return res.status(404).json({ message: "this movie is not found" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "no file upload" });
  }
  const poster = await cloudinary.uploader.upload(req.file.path);
  console.log(poster.secure_url)
  await prisma.movie.update({
    where: { id: req.params.id },
    data: { posterUrl: poster.secure_url },
  });
  res.status(201).json({ message: "poster updated" });
};
const getallmovie = async (req, res) => {
  await connect();
  const allmovie = await prisma.movie.findMany();
  res.status(200).json({ data: allmovie });
};
export { addmovie,deletemovie,getallmovie,changeposter };
