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
  ADMIN_USER: {
    LIST_SUCCESS: "Get users successfully",
    DETAIL_SUCCESS: "Get user successfully",
    UPDATE_SUCCESS: "Update user successfully",
    ROLE_UPDATED: "Update user role successfully",
    STATUS_UPDATED: "Update user status successfully",
    NOT_FOUND: "User not found",
    CANNOT_BLOCK_SELF: "You cannot block yourself",
    CANNOT_REMOVE_OWN_ADMIN_ROLE: "You cannot remove your own admin role",
  },
  TAG: {
    LIST_SUCCESS: "Get tags successfully",
    CREATE_SUCCESS: "Create tag successfully",
    UPDATE_SUCCESS: "Update tag successfully",
    DELETE_SUCCESS: "Delete tag successfully",
    NOT_FOUND: "Tag not found",
    NAME_EXISTS: "Tag name already exists",
    SLUG_EXISTS: "Tag slug already exists",
    IN_USE: "Tag is being used and cannot be deleted",
    INVALID_SLUG: "Slug format is invalid",
  },
  SYSTEM_CONFIG: {
    PUBLIC_SUCCESS: "Get public system config successfully",
    ADMIN_SUCCESS: "Get system config successfully",
    UPDATE_SUCCESS: "Update system config successfully",
    INVALID_TIMING_RANGE: "Invalid timing range configuration",
    INVALID_TIMING_VALUE: "Timing values must be greater than zero",
  },
  SPEAKING: {
    LIST_SUCCESS: "Get speaking sets successfully",
    DETAIL_SUCCESS: "Get speaking set detail successfully",
    ADMIN_LIST_SUCCESS: "Get speaking sets successfully",
    ADMIN_DETAIL_SUCCESS: "Get speaking set successfully",
    CREATE_SUCCESS: "Create speaking set successfully",
    UPDATE_SUCCESS: "Update speaking set successfully",
    DELETE_SUCCESS: "Delete speaking set successfully",
    PUBLISH_SUCCESS: "Publish speaking set successfully",
    UNPUBLISH_SUCCESS: "Unpublish speaking set successfully",

    PART_CREATE_SUCCESS: "Create speaking part successfully",
    PART_UPDATE_SUCCESS: "Update speaking part successfully",
    PART_DELETE_SUCCESS: "Delete speaking part successfully",

    PROMPT_CREATE_SUCCESS: "Create speaking prompt successfully",
    PROMPT_UPDATE_SUCCESS: "Update speaking prompt successfully",
    PROMPT_DELETE_SUCCESS: "Delete speaking prompt successfully",

    ITEM_CREATE_SUCCESS: "Create speaking prompt item successfully",
    ITEM_UPDATE_SUCCESS: "Update speaking prompt item successfully",
    ITEM_DELETE_SUCCESS: "Delete speaking prompt item successfully",

    SET_NOT_FOUND: "Speaking set not found",
    PART_NOT_FOUND: "Speaking part not found",
    PROMPT_NOT_FOUND: "Speaking prompt not found",
    ITEM_NOT_FOUND: "Speaking prompt item not found",

    SET_ID_EXISTS: "Speaking set id already exists",
    SET_IN_USE: "Speaking set is being used in tests and cannot be deleted",
    TAG_NOT_FOUND: "One or more tags do not exist",

    PART_TYPE_EXISTS: "Speaking part type already exists in this speaking set",
    PART_SORT_ORDER_EXISTS:
      "Speaking part sort order already exists in this speaking set",
    PROMPT_SORT_ORDER_EXISTS:
      "Speaking prompt sort order already exists in this speaking part",
    ITEM_SORT_ORDER_EXISTS:
      "Speaking prompt item sort order already exists in this prompt",

    PUBLISH_TOPIC_REQUIRED: "Topic is required before publishing",
    PUBLISH_LEVEL_REQUIRED: "Level is required before publishing",
    PUBLISH_PART_REQUIRED:
      "At least one speaking part is required before publishing",
    PUBLISH_PROMPT_REQUIRED:
      "Each speaking part must have at least one prompt before publishing",
    PUBLISH_CUE_CARD_ITEM_REQUIRED:
      "Cue card prompt must have at least one prompt item before publishing",
  },
  READING: {
    LIST_SUCCESS: "Get reading sets successfully",
    DETAIL_SUCCESS: "Get reading set detail successfully",
    ADMIN_LIST_SUCCESS: "Get reading sets successfully",
    ADMIN_DETAIL_SUCCESS: "Get reading set successfully",
    CREATE_SUCCESS: "Create reading set successfully",
    UPDATE_SUCCESS: "Update reading set successfully",
    DELETE_SUCCESS: "Delete reading set successfully",
    PUBLISH_SUCCESS: "Publish reading set successfully",
    UNPUBLISH_SUCCESS: "Unpublish reading set successfully",

    QUESTION_CREATE_SUCCESS: "Create reading question successfully",
    QUESTION_UPDATE_SUCCESS: "Update reading question successfully",
    QUESTION_DELETE_SUCCESS: "Delete reading question successfully",

    SET_NOT_FOUND: "Reading set not found",
    QUESTION_NOT_FOUND: "Reading question not found",

    SET_ID_EXISTS: "Reading set id already exists",
    SET_IN_USE: "Reading set is being used in tests and cannot be deleted",
    SET_HAS_ATTEMPT_DATA: "Reading set has attempt data and cannot be deleted",
    QUESTION_IN_USE: "Reading question has attempt data and cannot be deleted",
    TAG_NOT_FOUND: "One or more tags do not exist",

    QUESTION_QNO_EXISTS: "Question number already exists in this reading set",
    QUESTION_SORT_ORDER_EXISTS:
      "Question sort order already exists in this reading set",

    PUBLISH_TITLE_REQUIRED: "Title is required before publishing",
    PUBLISH_LEVEL_REQUIRED: "Level is required before publishing",
    PUBLISH_PASSAGE_REQUIRED: "Passage content is required before publishing",
    PUBLISH_QUESTION_REQUIRED:
      "At least one question is required before publishing",
    PUBLISH_CORRECT_ANSWER_REQUIRED:
      "Each question must have a valid correct answer before publishing",
  },
  LISTENING: {
    LIST_SUCCESS: "Get listening sets successfully",
    DETAIL_SUCCESS: "Get listening set detail successfully",
    ADMIN_LIST_SUCCESS: "Get listening sets successfully",
    ADMIN_DETAIL_SUCCESS: "Get listening set successfully",
    CREATE_SUCCESS: "Create listening set successfully",
    UPDATE_SUCCESS: "Update listening set successfully",
    DELETE_SUCCESS: "Delete listening set successfully",
    PUBLISH_SUCCESS: "Publish listening set successfully",
    UNPUBLISH_SUCCESS: "Unpublish listening set successfully",

    QUESTION_CREATE_SUCCESS: "Create listening question successfully",
    QUESTION_UPDATE_SUCCESS: "Update listening question successfully",
    QUESTION_DELETE_SUCCESS: "Delete listening question successfully",

    SET_NOT_FOUND: "Listening set not found",
    QUESTION_NOT_FOUND: "Listening question not found",

    SET_ID_EXISTS: "Listening set id already exists",
    SET_IN_USE: "Listening set is being used in tests and cannot be deleted",
    SET_HAS_ATTEMPT_DATA:
      "Listening set has attempt data and cannot be deleted",
    QUESTION_IN_USE:
      "Listening question has attempt data and cannot be deleted",
    TAG_NOT_FOUND: "One or more tags do not exist",

    QUESTION_QNO_EXISTS: "Question number already exists in this listening set",
    QUESTION_SORT_ORDER_EXISTS:
      "Question sort order already exists in this listening set",

    PUBLISH_TITLE_REQUIRED: "Title is required before publishing",
    PUBLISH_LEVEL_REQUIRED: "Level is required before publishing",
    PUBLISH_AUDIO_REQUIRED: "Audio URL is required before publishing",
    PUBLISH_AUDIO_SOURCE_REQUIRED: "Audio source is required before publishing",
    PUBLISH_QUESTION_REQUIRED:
      "At least one question is required before publishing",
    PUBLISH_CORRECT_ANSWER_REQUIRED:
      "Each question must have a valid correct answer before publishing",
  },
  WRITING: {
    LIST_SUCCESS: "Get writing tasks successfully",
    DETAIL_SUCCESS: "Get writing task detail successfully",
    ADMIN_LIST_SUCCESS: "Get writing tasks successfully",
    ADMIN_DETAIL_SUCCESS: "Get writing task successfully",
    CREATE_SUCCESS: "Create writing task successfully",
    UPDATE_SUCCESS: "Update writing task successfully",
    DELETE_SUCCESS: "Delete writing task successfully",
    PUBLISH_SUCCESS: "Publish writing task successfully",
    UNPUBLISH_SUCCESS: "Unpublish writing task successfully",

    TASK_NOT_FOUND: "Writing task not found",
    TASK_ID_EXISTS: "Writing task id already exists",
    TASK_IN_USE: "Writing task is being used in tests and cannot be deleted",
    TASK_HAS_ATTEMPT_DATA:
      "Writing task has attempt data and cannot be deleted",
    TAG_NOT_FOUND: "One or more tags do not exist",

    PUBLISH_TASK_NO_REQUIRED: "Task number is required before publishing",
    PUBLISH_TITLE_REQUIRED: "Title is required before publishing",
    PUBLISH_PROMPT_REQUIRED: "Prompt text is required before publishing",
    PUBLISH_LEVEL_REQUIRED: "Level is required before publishing",
  },
  TEST: {
    LIST_SUCCESS: "Get tests successfully",
    DETAIL_SUCCESS: "Get test detail successfully",
    ADMIN_LIST_SUCCESS: "Get tests successfully",
    ADMIN_DETAIL_SUCCESS: "Get test successfully",
    CREATE_SUCCESS: "Create test successfully",
    UPDATE_SUCCESS: "Update test successfully",
    DELETE_SUCCESS: "Delete test successfully",

    SECTION_CREATE_SUCCESS: "Create test section successfully",
    SECTION_UPDATE_SUCCESS: "Update test section successfully",
    SECTION_DELETE_SUCCESS: "Delete test section successfully",
    SECTIONS_REPLACED: "Replace test sections successfully",

    PUBLISH_SUCCESS: "Publish test successfully",
    UNPUBLISH_SUCCESS: "Unpublish test successfully",

    RANDOM_BUILD_SUCCESS: "Random build test successfully",
    PREVIEW_BUILD_SUCCESS: "Preview build test successfully",
    REROLL_SUCCESS: "Reroll test section successfully",

    NOT_FOUND: "Test not found",
    SECTION_NOT_FOUND: "Test section not found",
    ID_EXISTS: "Test id already exists",
    TAG_NOT_FOUND: "One or more tags do not exist",
    HAS_ATTEMPTS: "Test already has attempts and cannot be deleted",
    CANNOT_MUTATE_PUBLISHED:
      "Published test cannot be modified. Please unpublish it first.",

    INVALID_SECTION_SOURCE: "Invalid section source",
    INVALID_SECTION_FOR_TEST_TYPE:
      "Section type is not compatible with test type",
    SECTION_SORT_ORDER_EXISTS: "Section sort order already exists in this test",

    PUBLISH_TITLE_REQUIRED: "Title is required before publishing",
    PUBLISH_LEVEL_REQUIRED: "Level is required before publishing",
    PUBLISH_SECTION_REQUIRED:
      "At least one section is required before publishing",
    PUBLISH_SECTION_SOURCE_MUST_BE_PUBLISHED:
      "All referenced section sources must be published before publishing the test",
    FULL_TEST_MISSING_SECTIONS:
      "Full test must contain Reading, Listening, Writing, and Speaking sections",

    RANDOM_BUILD_NOT_ENOUGH_CONTENT:
      "Not enough published content to build the requested test",
    REROLL_NOT_AVAILABLE: "No alternative content is available for reroll",
  },
} as const;
