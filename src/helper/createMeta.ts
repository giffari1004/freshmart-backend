export function createMeta(page: number, limit: number, totalData: number) {
  return {
    page,
    limit,
    totalData,
    totalPages: Math.ceil(totalData / limit),
  };
}