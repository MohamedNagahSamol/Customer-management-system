import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookeiparser from "cookie-parser";
import { fileURLToPath } from "url";
import cloud from "cloudinary";
import bcrypt from "bcrypt";

import authrouter from "./routes/authroute.js";
import watchlistroute from "./routes/watchlistroutes.js";
import movieroutes from "./routes/moveiroutes.js";
import { prisma, connect, disconnect } from "./config/prisma.js";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookeiparser());
app.set("trust proxy", 1);

cloud.v2.config({
  cloud_name: process.env.cloud_Name,
  api_key: process.env.API_key,
  api_secret: process.env.API_secret,
});

app.use(authrouter);
app.use(watchlistroute);
app.use(movieroutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const seedMovies = [
  {
    title: "The Matrix",
    overvieW: "A computer hacker learns about the true nature of reality.",
    releaseYear: 1999,
    genres: "Action,Sci-Fi",
    runtime: 136,
    posterUrl: "https://example.com/matrix.jpg",
    createby: "572dcc4a-8d8a-416c-8550-d4b25eba6877",
  },
  {
    title: "Inception",
    overvieW: "A thief who steals corporate secrets through dream-sharing technology.",
    releaseYear: 2010,
    genres: "Action,Sci-Fi,Thriller",
    runtime: 148,
    posterUrl: "https://example.com/inception.jpg",
    createby: "572dcc4a-8d8a-416c-8550-d4b25eba6877",
  },
  {
    title: "The Dark Knight",
    overvieW: "Batman faces the Joker in a battle for Gotham's soul.",
    releaseYear: 2008,
    genres: "Action,Crime,Drama",
    runtime: 152,
    posterUrl: "https://example.com/darkknight.jpg",
    createby: "5bf1348b-3300-437e-ac61-7c1780f343a6",
  },
  {
    title: "Pulp Fiction",
    overvieW: "The lives of two mob hitmen, a boxer, and others intertwine.",
    releaseYear: 1994,
    genres: "Crime,Drama",
    runtime: 154,
    posterUrl: "https://example.com/pulpfiction.jpg",
    createby: "572dcc4a-8d8a-416c-8550-d4b25eba6877",
  },
  {
    title: "Interstellar",
    overvieW: "A team of explorers travel through a wormhole in space.",
    releaseYear: 2014,
    genres: "Adventure,Drama,Sci-Fi",
    runtime: 169,
    posterUrl: "https://example.com/interstellar.jpg",
    createby: "5bf1348b-3300-437e-ac61-7c1780f343a6",
  },
  {
    title: "The Shawshank Redemption",
    overvieW: "Two imprisoned men bond over a number of years.",
    releaseYear: 1994,
    genres: "Drama",
    runtime: 142,
    posterUrl: "https://example.com/shawshank.jpg",
    createby: "5bf1348b-3300-437e-ac61-7c1780f343a6",
  },
  {
    title: "Fight Club",
    overvieW: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club.",
    releaseYear: 1999,
    genres: "Drama",
    runtime: 139,
    posterUrl: "https://example.com/fightclub.jpg",
    createby: "5bf1348b-3300-437e-ac61-7c1780f343a6",
  },
  {
    title: "Forrest Gump",
    overvieW: "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.",
    releaseYear: 1994,
    genres: "Drama,Romance",
    runtime: 142,
    posterUrl: "https://example.com/forrestgump.jpg",
    createby: "572dcc4a-8d8a-416c-8550-d4b25eba6877",
  },
  {
    title: "The Godfather",
    overvieW: "The aging patriarch of an organized crime dynasty transfers control to his son.",
    releaseYear: 1972,
    genres: "Crime,Drama",
    runtime: 175,
    posterUrl: "https://example.com/godfather.jpg",
    createby: "572dcc4a-8d8a-416c-8550-d4b25eba6877",
  },
  {
    title: "Goodfellas",
    overvieW: "The story of Henry Hill and his life in the mob.",
    releaseYear: 1990,
    genres: "Biography,Crime,Drama",
    runtime: 146,
    posterUrl: "https://example.com/goodfellas.jpg",
    createby: "5bf1348b-3300-437e-ac61-7c1780f343a6",
  },
];

const seedDatabase = async () => {
  await connect();
  const count = await prisma.movie.count();
  if (count > 0) {
    console.log(`Database already has ${count} movies, skipping seed.`);
    return;
  }
  console.log("Seeding database...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  for (const user of [
    { id: "572dcc4a-8d8a-416c-8550-d4b25eba6877", email: "admin@seed.com", name: "Admin", password: hashedPassword, Role: "Admin" },
    { id: "5bf1348b-3300-437e-ac61-7c1780f343a6", email: "user@seed.com", name: "User", password: hashedPassword, Role: "User" },
  ]) {
    try {
      await prisma.user.create({ data: user });
      console.log(`Created user: ${user.email}`);
    } catch {
      console.log(`User ${user.email} exists, skipping`);
    }
  }
  for (const movie of seedMovies) {
    try {
      await prisma.movie.create({ data: movie });
      console.log(`Created movie: ${movie.title}`);
    } catch {
      console.log(`Movie ${movie.title} exists, skipping`);
    }
  }
  console.log("Database seeded successfully!");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const start = async () => {
    try {
      await seedDatabase();
    } catch (err) {
      console.error("Seeding failed:", err);
    }
    const server = app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    const gracefulShutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await disconnect();
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  };
  start();
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

export default app;
export { seedDatabase, seedMovies };
