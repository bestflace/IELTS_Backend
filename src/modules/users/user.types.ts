export type UserProfileDto = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: Date;
};

export type AdminUserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
};

export type AdminUpdateUserBody = {
  fullName?: string;
  role?: string;
  status?: string;
};

export type AdminUpdateUserRoleBody = {
  role: string;
};

export type AdminUpdateUserStatusBody = {
  status: string;
};
