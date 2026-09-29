type PaginationValue = number | string | string[] | undefined;

const toNumber = (value: PaginationValue, fallback: number) =>
  Number(Array.isArray(value) ? value[0] : value) || fallback;

export const buildPagination = (page: PaginationValue = 1, limit: PaginationValue = 10) => {
  const safePage = Math.max(toNumber(page, 1), 1);
  const safeLimit = Math.min(Math.max(toNumber(limit, 10), 1), 100);
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
};

export const paginate = <T>(items: T[], total: number, page: number, limit: number) => ({
  items,
  meta: { page, limit, total, pages: Math.ceil(total / limit) },
});
