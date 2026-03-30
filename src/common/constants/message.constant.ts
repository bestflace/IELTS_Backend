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
  UPLOAD: {
    PRESIGN_SUCCESS: "Create upload presigned URL successfully",
    COMPLETE_SUCCESS: "Complete upload successfully",
    DELETE_SUCCESS: "Delete uploaded file successfully",

    INVALID_FOLDER: "Invalid upload folder",
    FORBIDDEN_FOLDER: "You do not have permission to upload to this folder",
    INVALID_CONTENT_TYPE: "Content type is not allowed for this folder",
    INVALID_FILE_KEY: "Invalid file key",
    FILE_NOT_FOUND: "Uploaded file not found",
    CANNOT_ACCESS_FOREIGN_FILE:
      "You do not have permission to access this file",
    R2_NOT_CONFIGURED: "R2 storage is not configured",
    EMPTY_UPLOADED_FILE: "Uploaded file is empty",
  },
  ATTEMPT: {
    CREATE_SUCCESS: "Create attempt successfully",
    LIST_SUCCESS: "Get attempts successfully",
    DETAIL_SUCCESS: "Get attempt successfully",
    SESSION_SUCCESS: "Get attempt session successfully",
    GRADING_STATUS_SUCCESS: "Get grading status successfully",

    QUESTION_ANSWERS_SAVED: "Save question answers successfully",
    QUESTION_ANSWER_UPDATED: "Update question answer successfully",

    WRITING_RESPONSES_SAVED: "Save writing responses successfully",

    SPEAKING_RESPONSES_SAVED: "Save speaking responses successfully",
    SPEAKING_RESPONSE_UPDATED: "Update speaking response successfully",

    SUBMIT_SUCCESS: "Submit attempt successfully",
    RESULT_SUCCESS: "Get attempt result successfully",
    REVIEW_SUCCESS: "Get attempt review successfully",
    EXPIRE_SUCCESS: "Expire attempt successfully",

    NOT_FOUND: "Attempt not found",
    SNAPSHOT_NOT_FOUND: "Attempt snapshot not found",
    RESULT_NOT_FOUND: "Attempt result not found",

    TEST_NOT_FOUND: "Test not found",
    TEST_NOT_PUBLISHED: "Test is not published",
    MODE_NOT_SUPPORTED: "Attempt mode is not supported by the selected test",
    INVALID_TIME_LIMIT: "Invalid custom time limit",
    EXPIRED: "Attempt has expired",
    ALREADY_SUBMITTED: "Attempt has already been submitted",
    NOT_IN_PROGRESS: "Attempt is not in progress",

    QUESTION_NOT_IN_ATTEMPT: "Question does not belong to this attempt",
    WRITING_TASK_NOT_IN_ATTEMPT: "Writing task does not belong to this attempt",
    SPEAKING_PROMPT_NOT_IN_ATTEMPT:
      "Speaking prompt does not belong to this attempt",
    SPEAKING_PART_NOT_IN_ATTEMPT:
      "Speaking part does not belong to this attempt",

    FORCE_REQUIRED_AFTER_EXPIRY:
      "Attempt has expired. Use force=true to submit anyway.",
  },
  TEACHER_REVIEW: {
    LIST_SUCCESS: "Get teacher submissions successfully",
    DETAIL_SUCCESS: "Get teacher submission successfully",
    CLAIM_SUCCESS: "Claim submission successfully",
    RELEASE_SUCCESS: "Release submission successfully",
    WRITING_REVIEW_SUCCESS: "Submit writing review successfully",
    SPEAKING_REVIEW_SUCCESS: "Submit speaking review successfully",
    DASHBOARD_SUCCESS: "Get teacher dashboard successfully",

    SUBMISSION_NOT_FOUND: "Teacher submission not found",
    REVIEW_NOT_ALLOWED: "You are not allowed to review this submission",
    SUBMISSION_ALREADY_REVIEWED: "This submission has already been reviewed",
    SUBMISSION_ALREADY_CLAIMED:
      "This submission has been claimed by another teacher",
    SUBMISSION_NOT_CLAIMED_BY_YOU: "This submission is not claimed by you",
    INVALID_SUBMISSION_SKILL:
      "Submission skill is not valid for this review type",
  },
  COMMENT: {
    LIST_SUCCESS: "Get comments successfully",
    CREATE_SUCCESS: "Create comment successfully",
    UPDATE_SUCCESS: "Update comment successfully",
    DELETE_SUCCESS: "Delete comment successfully",
    HIDE_SUCCESS: "Hide comment successfully",
    UNHIDE_SUCCESS: "Unhide comment successfully",

    NOT_FOUND: "Comment not found",
    ATTEMPT_NOT_FOUND: "Attempt not found",
    PARENT_NOT_FOUND: "Parent comment not found",
    FORBIDDEN: "You do not have permission to modify this comment",
  },
  BLOG: {
    LIST_SUCCESS: "Get blogs successfully",
    DETAIL_SUCCESS: "Get blog successfully",
    ADMIN_LIST_SUCCESS: "Get blogs successfully",
    ADMIN_DETAIL_SUCCESS: "Get blog successfully",
    CREATE_SUCCESS: "Create blog successfully",
    UPDATE_SUCCESS: "Update blog successfully",
    DELETE_SUCCESS: "Delete blog successfully",
    PUBLISH_SUCCESS: "Publish blog successfully",
    UNPUBLISH_SUCCESS: "Unpublish blog successfully",

    NOT_FOUND: "Blog not found",
    TAG_NOT_FOUND: "One or more tags do not exist",
    SLUG_EXISTS: "Blog slug already exists",
  },
  NOTIFICATION: {
    LIST_SUCCESS: "Get notifications successfully",
    UNREAD_COUNT_SUCCESS: "Get unread notification count successfully",
    READ_SUCCESS: "Mark notification as read successfully",
    READ_ALL_SUCCESS: "Mark all notifications as read successfully",
    INTERNAL_TEST_PUBLISHED_SUCCESS:
      "Send test published notifications successfully",
    INTERNAL_SUBMISSION_REVIEWED_SUCCESS:
      "Send submission reviewed notification successfully",

    NOT_FOUND: "Notification not found",
    TEST_NOT_FOUND: "Test not found",
    ATTEMPT_NOT_FOUND: "Attempt not found",
  },
  REPORT: {
    USER_OVERVIEW_SUCCESS: "Get user overview report successfully",
    USER_SKILLS_SUCCESS: "Get user skill report successfully",
    USER_TIMELINE_SUCCESS: "Get user timeline report successfully",

    TEACHER_OVERVIEW_SUCCESS: "Get teacher overview report successfully",
    TEACHER_PERFORMANCE_SUCCESS: "Get teacher performance report successfully",

    ADMIN_OVERVIEW_SUCCESS: "Get admin overview report successfully",
    ADMIN_ATTEMPTS_SUCCESS: "Get admin attempt report successfully",
    ADMIN_TESTS_SUCCESS: "Get admin test report successfully",
    ADMIN_USERS_SUCCESS: "Get admin user report successfully",
    ADMIN_TEACHER_GRADING_SUCCESS:
      "Get admin teacher grading report successfully",
    ADMIN_BANDS_SUCCESS: "Get admin band distribution report successfully",
  },
  IMPORT: {
    LIST_SUCCESS: "Get import jobs successfully",
    DETAIL_SUCCESS: "Get import job successfully",
    CREATE_SUCCESS: "Create import job successfully",
    ERRORS_SUCCESS: "Get import job errors successfully",
    RETRY_SUCCESS: "Retry import job successfully",

    NOT_FOUND: "Import job not found",
    INVALID_RETRY_STATE: "Import job cannot be retried while processing",
  },
} as const;
