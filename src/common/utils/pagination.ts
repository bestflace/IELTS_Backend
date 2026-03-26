export function parsePagination(query: { page?: unknown; limit?: unknown }) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;

  const skip = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip,
  };
}

export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  total: number;
}) {
  return {
    page: params.page,
    limit: params.limit,
    total: params.total,
    totalPages: Math.ceil(params.total / params.limit),
  };
}
