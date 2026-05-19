export const CACHE_KEYS = {
  ALL_PRODUCTS: 'products:all',
  PRODUCT: (id: string) => `products:${id}`,
  ACTIVE_DEALS: 'deals:active',
  DEAL: (id: string) => `deals:${id}`,
};