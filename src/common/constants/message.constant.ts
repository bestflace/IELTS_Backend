export const MESSAGE = {
  COMMON: {
    OK: "OK",
    CREATED: "Created successfully",
    UPDATED: "Updated successfully",
    DELETED: "Deleted successfully",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_SERVER_ERROR: "Internal server error",
  },

  AUTH: {
    REGISTER_SUCCESS: "Register successfully",
    LOGIN_SUCCESS: "Login successfully",
    REFRESH_SUCCESS: "Refresh token successfully",
    LOGOUT_SUCCESS: "Logout successfully",
    ME_SUCCESS: "Get current user successfully",
    INVALID_CREDENTIALS: "Email or password is incorrect",
    INVALID_REFRESH_TOKEN: "Refresh token is invalid or expired",
    ACCOUNT_BLOCKED: "Your account has been blocked",
    EMAIL_EXISTS: "Email already exists",
    PASSWORD_RESET_CODE_SENT: "Reset password code sent successfully",
    PASSWORD_RESET_CODE_VERIFIED: "Reset code verified successfully",
    PASSWORD_RESET_CODE_INVALID: "Reset code is invalid or expired",
    PASSWORD_RESET_SUCCESS: "Reset password successfully",
    CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  },

  USER: {
    PROFILE_SUCCESS: "Get profile successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    PASSWORD_CHANGED: "Password changed successfully",
  },
} as const;
