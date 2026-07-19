/** Local explore cart (browser) — checkout posts to Doorli orders API. */

export type ExploreCartItem = {
  productId: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price: number;
  quantity: number;
};

const KEY = 'doorli_explore_cart';

export function getExploreCart(): ExploreCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ExploreCartItem[];
  } catch {
    return [];
  }
}

export function setExploreCart(items: ExploreCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToExploreCart(item: ExploreCartItem) {
  const cart = getExploreCart();
  const existing = cart.find((c) => c.productId === item.productId && c.vendorId === item.vendorId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setExploreCart(cart);
}

export function clearExploreCart(vendorId?: string) {
  if (!vendorId) {
    setExploreCart([]);
    return;
  }
  setExploreCart(getExploreCart().filter((i) => i.vendorId !== vendorId));
}

export function updateExploreCartQty(productId: string, quantity: number) {
  const cart = getExploreCart()
    .map((i) => (i.productId === productId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  setExploreCart(cart);
}
