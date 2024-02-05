// this is what's used to connect our graphql server with the db

import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
}

export const context: Context = {
  prisma,
};
