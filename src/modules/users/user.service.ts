import { user_role, user_status } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import { comparePassword, hashPassword } from "../../common/utils/hash";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import {
  AdminUpdateUserBody,
  AdminUpdateUserRoleBody,
  AdminUpdateUserStatusBody,
  UserProfileDto,
} from "./user.types";
import { userRepository } from "./user.repository";

function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function mapProfile(user: {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: Date;
}): UserProfileDto {
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
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
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
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
    }

    const updated = await userRepository.updateProfile(userId, {
      ...(body.fullName !== undefined
        ? { full_name: normalizeFullName(body.fullName) }
        : {}),
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
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
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

  async adminListUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const search = query.search?.trim() || undefined;
    const role = query.role as user_role | undefined;
    const status = query.status as user_status | undefined;

    const [users, total] = await Promise.all([
      userRepository.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        search,
        role,
        status,
      }),
      userRepository.countMany({
        search,
        role,
        status,
      }),
    ]);

    return {
      items: users.map(mapProfile),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async adminGetUserById(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
    }

    return mapProfile(user);
  },

  async adminUpdateUser(
    adminUserId: string,
    targetUserId: string,
    body: AdminUpdateUserBody,
  ) {
    const targetUser = await userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
    }

    if (adminUserId === targetUserId && body.status === user_status.BLOCKED) {
      throw new ForbiddenError(MESSAGE.ADMIN_USER.CANNOT_BLOCK_SELF);
    }

    if (
      adminUserId === targetUserId &&
      body.role &&
      body.role !== user_role.ADMIN
    ) {
      throw new ForbiddenError(MESSAGE.ADMIN_USER.CANNOT_REMOVE_OWN_ADMIN_ROLE);
    }

    const updated = await userRepository.updateAdminUser(targetUserId, {
      ...(body.fullName !== undefined
        ? { full_name: normalizeFullName(body.fullName) }
        : {}),
      ...(body.role !== undefined ? { role: body.role as user_role } : {}),
      ...(body.status !== undefined
        ? { status: body.status as user_status }
        : {}),
    });

    return mapProfile(updated);
  },

  async adminUpdateUserRole(
    adminUserId: string,
    targetUserId: string,
    body: AdminUpdateUserRoleBody,
  ) {
    const targetUser = await userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
    }

    if (adminUserId === targetUserId && body.role !== user_role.ADMIN) {
      throw new ForbiddenError(MESSAGE.ADMIN_USER.CANNOT_REMOVE_OWN_ADMIN_ROLE);
    }

    const updated = await userRepository.updateAdminUser(targetUserId, {
      role: body.role as user_role,
    });

    return mapProfile(updated);
  },

  async adminUpdateUserStatus(
    adminUserId: string,
    targetUserId: string,
    body: AdminUpdateUserStatusBody,
  ) {
    const targetUser = await userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundError(MESSAGE.ADMIN_USER.NOT_FOUND);
    }

    if (adminUserId === targetUserId && body.status === user_status.BLOCKED) {
      throw new ForbiddenError(MESSAGE.ADMIN_USER.CANNOT_BLOCK_SELF);
    }

    const updated = await userRepository.updateAdminUser(targetUserId, {
      status: body.status as user_status,
    });

    return mapProfile(updated);
  },
};
