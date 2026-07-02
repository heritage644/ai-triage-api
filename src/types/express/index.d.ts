import "express";
import { PrismaClient } from '@prisma/client';

declare global {
  // 1. Express Request extension
  namespace Express {
    interface Request {
      validated: {
        body: any;
        params: any;
        query?: any;
      };
    }
  }

  // 2. Prisma global variable
  var prisma: PrismaClient | undefined;
}

// 3. Mark file as a module (keep this at the very end!)
export {};