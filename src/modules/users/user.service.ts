import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import { comparePassword, hashPassword } from "../../common/utils/hash";
import { userRepository } from "./user.repository";

function mapProfile(user: {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: Date;
}) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
  };
}

export const userService = {
  async getMyProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return mapProfile(user);
  },

  async updateMyProfile(
    userId: string,
    body: {
      fullName?: string;
      avatarUrl?: string | null;
    },
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updated = await userRepository.updateProfile(userId, {
      ...(body.fullName !== undefined ? { full_name: body.fullName } : {}),
      ...(body.avatarUrl !== undefined ? { avatar_url: body.avatarUrl } : {}),
    });

    return mapProfile(updated);
  },

  async changeMyPassword(
    userId: string,
    body: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isCorrect = await comparePassword(
      body.currentPassword,
      user.password_hash,
    );

    if (!isCorrect) {
      throw new BadRequestError(MESSAGE.AUTH.CURRENT_PASSWORD_INCORRECT);
    }

    const newPasswordHash = await hashPassword(body.newPassword);

    await userRepository.updatePassword(userId, newPasswordHash);

    return {
      success: true,
    };
  },
};
