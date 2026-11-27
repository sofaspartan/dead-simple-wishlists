export type User = {
  id: string;
  username: string;
  displayName: string;
  recoveryCodesRemaining: number;
  createdAt: string;
};

export type WishlistItem = {
  id: string;
  name: string;
  url: string;
  notes: string;
  price: string;
  claimed: boolean;
  claimedBy: string | null;
  claimedAnonymous?: boolean;
  claimedAt?: string;
  canUnclaim?: boolean;
};

export type Wishlist = {
  id: string;
  title: string;
  description: string;
  shareSlug: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  items: WishlistItem[];
};

type ApiResult<T> = T & { error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>;
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  signup: (username: string, password: string) =>
    request<{ user: User; recoveryCodes: string[] }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  reset: (username: string, recoveryCode: string, newPassword: string) =>
    request<{ user: User }>("/auth/reset", {
      method: "POST",
      body: JSON.stringify({ username, recoveryCode, newPassword }),
    }),
  listWishlists: () => request<{ wishlists: Wishlist[] }>("/wishlists"),
  createWishlist: (title: string, description = "") =>
    request<{ wishlist: Wishlist }>("/wishlists", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),
  getWishlist: (id: string) => request<{ wishlist: Wishlist }>(`/wishlists/${id}`),
  updateWishlist: (id: string, data: { title?: string; description?: string }) =>
    request<{ wishlist: Wishlist }>(`/wishlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteWishlist: (id: string) =>
    request<{ ok: boolean }>(`/wishlists/${id}`, { method: "DELETE" }),
  addItem: (
    wishlistId: string,
    data: { name: string; url?: string; notes?: string; price?: string }
  ) =>
    request<{ wishlist: Wishlist }>(`/wishlists/${wishlistId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateItem: (
    wishlistId: string,
    itemId: string,
    data: { name?: string; url?: string; notes?: string; price?: string }
  ) =>
    request<{ wishlist: Wishlist }>(`/wishlists/${wishlistId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteItem: (wishlistId: string, itemId: string) =>
    request<{ wishlist: Wishlist }>(`/wishlists/${wishlistId}/items/${itemId}`, {
      method: "DELETE",
    }),
  unclaimItem: (wishlistId: string, itemId: string) =>
    request<{ wishlist: Wishlist }>(
      `/wishlists/${wishlistId}/items/${itemId}/unclaim`,
      { method: "POST", body: "{}" }
    ),
  getShared: (slug: string) =>
    request<{ wishlist: Wishlist }>(`/share/${slug}`),
  claim: (slug: string, itemId: string, name?: string, anonymous?: boolean) =>
    request<{ wishlist: Wishlist }>(`/share/${slug}/claim`, {
      method: "POST",
      body: JSON.stringify({ itemId, name, anonymous }),
    }),
  health: () => request<{ ok: boolean; blobs: string }>("/health"),
};
