import dotenv from "dotenv";

dotenv.config();

function getEnv(key: string, required = true): string {
  const value = process.env[key];

  if (required && (!value || value.trim() === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || "";
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

export const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: getEnv("NODE_ENV", false) || "development",

  appName: getEnv("APP_NAME", false) || "IELTS Backend",
  apiPrefix: getEnv("API_PREFIX", false) || "/api/v1",
  clientUrl: getEnv("CLIENT_URL", false) || "http://localhost:5173",

  databaseUrl: getEnv("DATABASE_URL"),

  jwtAccessSecret: getEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", false) || "15m",
  jwtRefreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN", false) || "7d",

  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 10),

  cookieSecure: toBoolean(process.env.COOKIE_SECURE, false),
  cookieDomain: getEnv("COOKIE_DOMAIN", false) || undefined,

  redisHost: getEnv("REDIS_HOST", false) || "127.0.0.1",
  redisPort: toNumber(process.env.REDIS_PORT, 6379),
  redisPassword: getEnv("REDIS_PASSWORD", false) || "",

  r2Endpoint: getEnv("R2_ENDPOINT", false) || "",
  r2AccessKeyId: getEnv("R2_ACCESS_KEY_ID", false) || "",
  r2SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", false) || "",
  r2Bucket: getEnv("R2_BUCKET", false) || "",
  r2PublicUrl: getEnv("R2_PUBLIC_URL", false) || "",

  geminiApiKey: getEnv("GEMINI_API_KEY", false) || "",
  whisperApiKey: getEnv("WHISPER_API_KEY", false) || "",
};

export const isProduction = env.nodeEnv === "production";
