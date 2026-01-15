import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
  // Intentamos extraer los datos de la URL de forma segura
  const dbUrl = process.env.DATABASE_URL || "";
  
  const pool = new pg.Pool({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Mostramos un log en la consola para saber que estamos intentando conectar
  console.log("🐘 Intentando conectar a la DB...");

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
