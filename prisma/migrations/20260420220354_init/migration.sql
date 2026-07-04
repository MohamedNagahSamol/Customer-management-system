/*
  Warnings:

  - A unique constraint covering the columns `[movieId,userId]` on the table `WatchListItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `WatchListItem_movieId_userId_key` ON `WatchListItem`(`movieId`, `userId`);
