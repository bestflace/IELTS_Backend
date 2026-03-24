import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { parseDurationToMs } from "./date";

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

function signJwt(
  payload: JwtPayload,
  secret: Secret,
  expiresIn: string,
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
}

export function signAccessToken(payload: JwtPayload): string {
  return signJwt(payload, env.jwtAccessSecret, env.jwtAccessExpiresIn);
}

export function signRefreshToken(payload: JwtPayload): string {
  return signJwt(payload, env.jwtRefreshSecret, env.jwtRefreshExpiresIn);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}

export function getRefreshTokenExpiresAt(): Date {
  return new Date(Date.now() + parseDurationToMs(env.jwtRefreshExpiresIn));
}
