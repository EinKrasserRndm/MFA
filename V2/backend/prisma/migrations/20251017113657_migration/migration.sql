-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Weather" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "temperature" REAL NOT NULL,
    "windspeed" REAL NOT NULL,
    "humidity" REAL NOT NULL,
    "pressure" REAL NOT NULL,
    "rainfall" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
