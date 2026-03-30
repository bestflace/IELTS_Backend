import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { blogService } from "./blog.service";

export const blogController = {
  async getPublicBlogs(req: Request, res: Response) {
    const result = await blogService.getPublicBlogs(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.BLOG.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicBlogBySlug(req: Request, res: Response) {
    const result = await blogService.getPublicBlogBySlug(
      String(req.params.slug),
    );

    return sendSuccess(res, {
      message: MESSAGE.BLOG.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminBlogs(req: Request, res: Response) {
    const result = await blogService.getAdminBlogs(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.BLOG.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminBlogById(req: Request, res: Response) {
    const result = await blogService.getAdminBlogById(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.BLOG.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createBlog(req: Request, res: Response) {
    const result = await blogService.createBlog(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.BLOG.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateBlog(req: Request, res: Response) {
    const result = await blogService.updateBlog(
      String(req.params.id),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.BLOG.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteBlog(req: Request, res: Response) {
    const result = await blogService.deleteBlog(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.BLOG.DELETE_SUCCESS,
      data: result,
    });
  },

  async publishBlog(req: Request, res: Response) {
    const result = await blogService.publishBlog(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.BLOG.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishBlog(req: Request, res: Response) {
    const result = await blogService.unpublishBlog(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.BLOG.UNPUBLISH_SUCCESS,
      data: result,
    });
  },
};
