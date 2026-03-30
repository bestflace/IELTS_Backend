import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { commentService } from "./comment.service";

export const commentController = {
  async getAttemptComments(req: Request, res: Response) {
    const result = await commentService.getAttemptComments(
      String(req.user!.sub),
      String(req.user!.role),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.COMMENT.LIST_SUCCESS,
      data: result,
    });
  },

  async createComment(req: Request, res: Response) {
    const result = await commentService.createComment(
      String(req.user!.sub),
      String(req.user!.role),
      String(req.params.id),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.COMMENT.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateComment(req: Request, res: Response) {
    const result = await commentService.updateComment(
      String(req.user!.sub),
      String(req.user!.role),
      String(req.params.commentId),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.COMMENT.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteComment(req: Request, res: Response) {
    const result = await commentService.deleteComment(
      String(req.user!.sub),
      String(req.user!.role),
      String(req.params.commentId),
    );

    return sendSuccess(res, {
      message: MESSAGE.COMMENT.DELETE_SUCCESS,
      data: result,
    });
  },

  async hideComment(req: Request, res: Response) {
    const result = await commentService.hideComment(
      String(req.params.commentId),
    );

    return sendSuccess(res, {
      message: MESSAGE.COMMENT.HIDE_SUCCESS,
      data: result,
    });
  },

  async unhideComment(req: Request, res: Response) {
    const result = await commentService.unhideComment(
      String(req.params.commentId),
    );

    return sendSuccess(res, {
      message: MESSAGE.COMMENT.UNHIDE_SUCCESS,
      data: result,
    });
  },
};
