import { import_status, import_type } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { importRepository } from "./import.repository";
import { enqueueImportJob } from "../../jobs/queues";

function mapImport(item: any) {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    fileUrl: item.file_url,
    uploadedBy: item.uploaded_by,
    requestJson: item.request_json,
    resultJson: item.result_json,
    errorMessage: item.error_message,
    startedAt: item.started_at,
    finishedAt: item.finished_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    uploader: item.users
      ? {
          id: item.users.id,
          fullName: item.users.full_name,
          email: item.users.email,
        }
      : null,
  };
}

export const importService = {
  async createImportJob(
    userId: string,
    body: { type: string; fileUrl: string },
  ) {
    const created = await importRepository.createImportJob({
      type: body.type as import_type,
      file_url: body.fileUrl.trim(),
      uploaded_by: userId,
    });

    await enqueueImportJob(created.id);

    return mapImport(created);
  },

  async getImportJobs(query: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      importRepository.findImports({
        skip: pagination.skip,
        take: pagination.limit,
        type: query.type as import_type | undefined,
        status: query.status as import_status | undefined,
      }),
      importRepository.countImports({
        type: query.type as import_type | undefined,
        status: query.status as import_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapImport),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getImportJobById(id: string) {
    const item = await importRepository.findImportById(id);

    if (!item) {
      throw new NotFoundError(MESSAGE.IMPORT.NOT_FOUND);
    }

    return mapImport(item);
  },

  async getImportErrors(id: string) {
    const item = await importRepository.findImportById(id);

    if (!item) {
      throw new NotFoundError(MESSAGE.IMPORT.NOT_FOUND);
    }

    return {
      id: item.id,
      status: item.status,
      errorMessage: item.error_message,
      errors:
        item.result_json &&
        typeof item.result_json === "object" &&
        "errors" in (item.result_json as any)
          ? (item.result_json as any).errors
          : [],
    };
  },

  async retryImportJob(id: string) {
    const item = await importRepository.findImportById(id);

    if (!item) {
      throw new NotFoundError(MESSAGE.IMPORT.NOT_FOUND);
    }

    if (item.status === "PROCESSING") {
      throw new BadRequestError(MESSAGE.IMPORT.INVALID_RETRY_STATE);
    }

    const retried = await importRepository.retryImportJob(id);
    await enqueueImportJob(retried.id);

    return mapImport(retried);
  },
  async deleteImportJob(id: string) {
    const item = await importRepository.findImportById(id);

    if (!item) {
      throw new NotFoundError(MESSAGE.IMPORT.NOT_FOUND);
    }

    if (item.status === "PROCESSING") {
      throw new BadRequestError("Không thể xoá import job đang xử lý.");
    }

    await importRepository.deleteImportJob(id);

    return {
      id,
      deleted: true,
    };
  },
};
