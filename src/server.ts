import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(env.port, () => {
      console.log(
        `${env.appName} running at http://localhost:${env.port}${env.apiPrefix}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
