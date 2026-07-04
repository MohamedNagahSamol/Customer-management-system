import { prisma, connect, disconnect } from "../config/prisma.js";

const addtowatchlist = async (req, res) => {
  await connect();
  const { moveiId, notes, rating, status } = req.body;
  const movie = await prisma.movie.findUnique({ where: { id: moveiId } });
  if (!movie) {
    return res.status(404).json({ message: "movie not found" });
  }
  const MovieExistInWatchList = await prisma.watchListItem.findUnique({
    where: {
      movieId_userId: {
        movieId: moveiId,
        userId: req.user.id,
      },
    },
  });
  if (MovieExistInWatchList) {
    return res.status(400).json({ message: "movie is already is exist" });
  }
  const addwatchlist = await prisma.watchListItem.create({
    data: {
      userId: req.user.id,
      notes: notes,
      movieId: moveiId,
      status: status || "PLANNED",
      rating: rating,
    },
  });
  res.status(201).json({ message: "movie added to watchlist" });
};
const deletefromwatchlist = async (req, res) => {
  await connect();
  const watchlistItem = await prisma.watchListItem.findUnique({
    where: { id: req.params.id },
  });

  if (!watchlistItem) {
    return res.status(404).json({ error: "Watchlist item not found" });
  }
  if (watchlistItem.userId !== req.user.id) {
    return res
      .status(403)
      .json({ message: "not allow update or delete from this watchlist" });
  }
  await prisma.watchListItem.delete({ where: { id: req.params.id } });
  res.status(200).json({ message: "this movie deleted from watchlist" });
};
export { addtowatchlist, deletefromwatchlist };
