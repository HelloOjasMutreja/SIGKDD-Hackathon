/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CheckIn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `city` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `consentCodeIpPolicy` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `consentDataUsage` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `consentPhotography` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactName` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactPhone` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `institute` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `captainId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `isLocked` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `college` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registerNumber` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Made the column `graduationYear` on table `ParticipantProfile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `code` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaderId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_entityType_entityId_idx";

-- DropIndex
DROP INDEX "CheckIn_checkedInAt_idx";

-- DropIndex
DROP INDEX "TeamInvite_teamId_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CheckIn";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Submission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TeamInvite";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "OrganizerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "approvedRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reasonForJoining" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizerProfile_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "checkedInBy" TEXT NOT NULL,
    "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Checkin_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Checkin_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParticipantProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "registerNumber" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "college" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    CONSTRAINT "ParticipantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ParticipantProfile" ("graduationYear", "id", "userId") SELECT "graduationYear", "id", "userId" FROM "ParticipantProfile";
DROP TABLE "ParticipantProfile";
ALTER TABLE "new_ParticipantProfile" RENAME TO "ParticipantProfile";
CREATE UNIQUE INDEX "ParticipantProfile_userId_key" ON "ParticipantProfile"("userId");
CREATE UNIQUE INDEX "ParticipantProfile_registerNumber_key" ON "ParticipantProfile"("registerNumber");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "trackId" TEXT,
    "projectName" TEXT,
    "projectDescription" TEXT,
    "techStack" TEXT,
    "githubLink" TEXT,
    "demoLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "qrToken" TEXT,
    "qrCodeUrl" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("createdAt", "id", "name", "trackId") SELECT "createdAt", "id", "name", "trackId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");
CREATE UNIQUE INDEX "Team_qrToken_key" ON "Team"("qrToken");
CREATE UNIQUE INDEX "Team_name_leaderId_key" ON "Team"("name", "leaderId");
CREATE TABLE "new_TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("id", "status", "teamId", "userId") SELECT "id", "status", "teamId", "userId" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Track_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("createdAt", "description", "id", "isActive", "name") SELECT "createdAt", "description", "id", "isActive", "name" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "fullName", "id", "passwordHash", "role") SELECT "createdAt", "email", "fullName", "id", "passwordHash", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerProfile_userId_key" ON "OrganizerProfile"("userId");
