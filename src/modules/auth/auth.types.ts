export type RegisterBody = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RefreshBody = {
  refreshToken?: string;
};

export type ForgotPasswordBody = {
  email: string;
};

export type VerifyResetCodeBody = {
  email: string;
  code: string;
};

export type ResetPasswordBody = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};
