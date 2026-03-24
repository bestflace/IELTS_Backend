import crypto from "crypto";
import { token_type, user_status } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import { UnauthorizedError } from "../../common/errors/unauthorized.error";
import { AuthUserDto } from "../../common/types/auth.type";
import { comparePassword, hashPassword, sha256 } from "../../common/utils/hash";
import {
  getRefreshTokenExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { authRepository } from "./auth.repository";
import {
  ForgotPasswordBody,
  LoginBody,
  RefreshBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyResetCodeBody,
} from "./auth.types";

function mapAuthUser(user: {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
}): AuthUserDto {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    role: user.role,
    status: user.status,
  };
}

export const authService = {
  async register(body: RegisterBody) {
    const existingUser = await authRepository.findUserByEmail(body.email);

    if (existingUser) {
      throw new ConflictError(MESSAGE.AUTH.EMAIL_EXISTS);
    }

    const passwordHash = await hashPassword(body.password);

    const user = await authRepository.createUser({
      full_name: body.fullName,
      email: body.email,
      password_hash: passwordHash,
    });

    return mapAuthUser(user);
  },

  async login(body: LoginBody) {
    const user = await authRepository.findUserByEmail(body.email);

    if (!user) {
      throw new UnauthorizedError(MESSAGE.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordCorrect = await comparePassword(
      body.password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedError(MESSAGE.AUTH.INVALID_CREDENTIALS);
    }

    if (user.status === user_status.BLOCKED) {
      throw new UnauthorizedError(MESSAGE.AUTH.ACCOUNT_BLOCKED);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await authRepository.createAuthToken({
      user_id: user.id,
      token_type: token_type.REFRESH,
      token_hash: sha256(refreshToken),
      expires_at: getRefreshTokenExpiresAt(),
    });

    await authRepository.updateLastLogin(user.id);

    return {
      user: mapAuthUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refresh(body: RefreshBody, refreshTokenFromCookie?: string) {
    const rawRefreshToken = body.refreshToken || refreshTokenFromCookie;

    if (!rawRefreshToken) {
      throw new UnauthorizedError(MESSAGE.AUTH.INVALID_REFRESH_TOKEN);
    }

    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError(MESSAGE.AUTH.INVALID_REFRESH_TOKEN);
    }

    const tokenHash = sha256(rawRefreshToken);
    const tokenRecord = await authRepository.findValidRefreshToken(tokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedError(MESSAGE.AUTH.INVALID_REFRESH_TOKEN);
    }

    if (tokenRecord.users.status === user_status.BLOCKED) {
      throw new UnauthorizedError(MESSAGE.AUTH.ACCOUNT_BLOCKED);
    }

    await authRepository.revokeTokenByHash(tokenHash);

    const payload = {
      sub: tokenRecord.users.id,
      email: tokenRecord.users.email,
      role: tokenRecord.users.role,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await authRepository.createAuthToken({
      user_id: tokenRecord.users.id,
      token_type: token_type.REFRESH,
      token_hash: sha256(newRefreshToken),
      expires_at: getRefreshTokenExpiresAt(),
    });

    return {
      user: mapAuthUser(tokenRecord.users),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await authRepository.revokeTokenByHash(sha256(refreshToken));
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return mapAuthUser(user);
  },

  async forgotPassword(body: ForgotPasswordBody) {
    const user = await authRepository.findUserByEmail(body.email);

    if (!user) {
      return {
        success: true,
      };
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = sha256(`${body.email}:${code}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await authRepository.createResetPasswordToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return {
      success: true,
      devCode: code,
    };
  },

  async verifyResetPasswordCode(body: VerifyResetCodeBody) {
    const tokenHash = sha256(`${body.email}:${body.code}`);
    const tokenRecord =
      await authRepository.findValidResetPasswordToken(tokenHash);

    if (!tokenRecord) {
      throw new BadRequestError(MESSAGE.AUTH.PASSWORD_RESET_CODE_INVALID);
    }

    return {
      verified: true,
    };
  },

  async resetPassword(body: ResetPasswordBody) {
    const tokenHash = sha256(`${body.email}:${body.code}`);
    const tokenRecord =
      await authRepository.findValidResetPasswordToken(tokenHash);

    if (!tokenRecord) {
      throw new BadRequestError(MESSAGE.AUTH.PASSWORD_RESET_CODE_INVALID);
    }

    const newPasswordHash = await hashPassword(body.newPassword);

    await authRepository.updateUserPassword(
      tokenRecord.users.id,
      newPasswordHash,
    );
    await authRepository.markTokenUsed(tokenRecord.id);
    await authRepository.revokeAllRefreshTokensByUserId(tokenRecord.users.id);

    return {
      success: true,
    };
  },
};
