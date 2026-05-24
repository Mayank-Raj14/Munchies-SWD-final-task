export type PaginationInput = {
  page: number;
  limit: number;
};

export const getPagination = ({ page, limit }: PaginationInput) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

export const buildPaginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
