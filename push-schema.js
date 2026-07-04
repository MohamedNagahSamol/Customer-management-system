import { prisma, connect, disconnect } from "./config/prisma.js";

const main = async () => {
  await connect();
  console.log("Creating tables...");

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS User (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'User',
    createAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS Movie (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    overvieW TEXT,
    releaseYear INT NOT NULL,
    genres VARCHAR(255) NOT NULL,
    runtime INT,
    posterUrl VARCHAR(500),
    createby VARCHAR(36) NOT NULL,
    createAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (title, createby),
    INDEX (title, createby),
    FOREIGN KEY (createby) REFERENCES User(id) ON DELETE CASCADE
  )`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS WatchListItem (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    movieId VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    rating INT,
    notes TEXT,
    createAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (movieId, userId),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (movieId) REFERENCES Movie(id)
  )`);

  console.log("Tables created successfully!");
  await disconnect();
};

main().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
