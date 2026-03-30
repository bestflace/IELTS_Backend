import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { blogController } from "./blog.controller";
import {
  adminBlogListQuerySchema,
  blogIdParamsSchema,
  blogSlugParamsSchema,
  createBlogSchema,
  publicBlogListQuerySchema,
  updateBlogSchema,
} from "./blog.validator";

const router = Router();

router.get(
  "/blogs",
  validate({ query: publicBlogListQuerySchema }),
  asyncHandler(blogController.getPublicBlogs),
);

router.get(
  "/blogs/:slug",
  validate({ params: blogSlugParamsSchema }),
  asyncHandler(blogController.getPublicBlogBySlug),
);

router.get(
  "/admin/blogs",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminBlogListQuerySchema }),
  asyncHandler(blogController.getAdminBlogs),
);

router.post(
  "/admin/blogs",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createBlogSchema }),
  asyncHandler(blogController.createBlog),
);

router.get(
  "/admin/blogs/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: blogIdParamsSchema }),
  asyncHandler(blogController.getAdminBlogById),
);

router.patch(
  "/admin/blogs/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: blogIdParamsSchema, body: updateBlogSchema }),
  asyncHandler(blogController.updateBlog),
);

router.delete(
  "/admin/blogs/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: blogIdParamsSchema }),
  asyncHandler(blogController.deleteBlog),
);

router.post(
  "/admin/blogs/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: blogIdParamsSchema }),
  asyncHandler(blogController.publishBlog),
);

router.post(
  "/admin/blogs/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: blogIdParamsSchema }),
  asyncHandler(blogController.unpublishBlog),
);

export default router;
