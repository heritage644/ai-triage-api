// src/database/prisma.ts

import { PrismaClient } from "@prisma/client";
import { logger } from "../middleware/logger.middleare";

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: [
      {
        level: "warn",
        emit: "event",
      },
      {
        level: "error",
        emit: "event",
      },
    ],
  });
};

declare global {
  // Allows Prisma Client to be cached during development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  globalThis.prisma ?? prismaClientSingleton();

{/*prisma.$on("warn", (event) => {

  logger.warn(
    {
      prisma: event,
    },
    "Prisma warning"
  );
})*/};

//prisma.$on("error", (event) => {
  //logger.error(
    //{
      //prisma: event,
    //},
    //"Prisma error"
  //);
//});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;