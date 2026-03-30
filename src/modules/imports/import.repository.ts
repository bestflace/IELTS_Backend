import { import_status, import_type } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const importRepository = {
  findImportById(id: string) {
    return prisma.import_jobs.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },

  findImports(params: {
    skip: number;
    take: number;
    type?: import_type;
    status?: import_status;
  }) {
    return prisma.import_jobs.findMany({
      where: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countImports(params: { type?: import_type; status?: import_status }) {
    return prisma.import_jobs.count({
      where: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    });
  },

  createImportJob(data: {
    type: import_type;
    file_url: string;
    uploaded_by: string;
  }) {
    return prisma.import_jobs.create({
      data: {
        type: data.type,
        file_url: data.file_url,
        uploaded_by: data.uploaded_by,
        status: "PENDING",
        request_json: {
          createdByEndpoint: true,
        } as any,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },

  retryImportJob(id: string) {
    return prisma.import_jobs.update({
      where: { id },
      data: {
        status: "PENDING",
        error_message: null,
        started_at: null,
        finished_at: null,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },
};
