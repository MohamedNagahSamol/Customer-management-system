/*
  Warnings:

  - A unique constraint covering the columns `[title,createby]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX `Movie_title_createby_idx` ON `Movie`(`title`, `createby`);

-- CreateIndex
CREATE UNIQUE INDEX `Movie_title_createby_key` ON `Movie`(`title`, `createby`);
