export const USER_SORT_BY = ["name", "createdAt"] as const;
export const USER_SORT_ORDER = ["asc", "desc"] as const;
export const ADMIN_UPDATE_CREATE_SELECT = {
  id: true,
  name: true,
  email: true,
  storeId: true,
  role: true,
};
export const ADMIN_GET_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  storeId: true,
  isVerified: true,
  createdAt: true,
};
export const ADMIN_DELETE_SELECT = {
  id: true,
  name: true,
  email: true,
  deletedAt: true,
};
