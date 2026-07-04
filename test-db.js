import { prisma, connect, disconnect } from "./config/prisma.js";

const main = async () => {
  await connect();

  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, Role: true } });
  console.log(`\nUsers (${userCount}):`);
  console.table(users);

  const movieCount = await prisma.movie.count();
  const movies = await prisma.movie.findMany({ select: { id: true, title: true, releaseYear: true, genres: true, createby: true } });
  console.log(`\nMovies (${movieCount}):`);
  console.table(movies);

  if (movieCount === 0) {
    console.log("\nNo movies found. Run: npm run seed");
  }

  await disconnect();
};

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
