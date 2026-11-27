import { getOwnerById } from "./auth.mjs";
import { generateId, generateShareSlug } from "./crypto.mjs";
import { slugIndexStore, userWishlistsStore, wishlistsStore } from "./store.mjs";

function publicWishlist(list, { includeClaims = true, isOwner = false, owner = null } = {}) {
  return {
    id: list.id,
    title: list.title,
    description: list.description || "",
    shareSlug: list.shareSlug,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    ownerId: isOwner ? list.userId : undefined,
    owner: owner || null,
    items: (list.items || []).map((item) => publicItem(item, { includeClaims, isOwner })),
  };
}

async function withOwner(list, opts = {}) {
  const owner = await getOwnerById(list.userId);
  return publicWishlist(list, { ...opts, owner });
}

function publicItem(item, { includeClaims = true, isOwner = false } = {}) {
  const claimed = Boolean(item.claimedAt);
  return {
    id: item.id,
    name: item.name,
    url: item.url || "",
    notes: item.notes || "",
    price: item.price || "",
    claimed,
    claimedBy: includeClaims && claimed ? item.claimedBy || (item.claimedAnonymous ? "Anonymous" : "") : claimed ? "Claimed" : null,
    claimedAnonymous: includeClaims ? Boolean(item.claimedAnonymous) : undefined,
    claimedAt: includeClaims && claimed ? item.claimedAt : undefined,
    canUnclaim: isOwner && claimed,
  };
}

export async function listWishlistsForUser(userId) {
  const index = userWishlistsStore();
  const wishlists = wishlistsStore();
  const ids = (await index.get(userId)) || [];
  const owner = await getOwnerById(userId);
  const lists = [];
  for (const id of ids) {
    const list = await wishlists.get(id);
    if (list) lists.push(publicWishlist(list, { isOwner: true, owner }));
  }
  lists.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return lists;
}

export async function createWishlist(userId, { title, description }) {
  if (!title?.trim()) {
    const err = new Error("Title is required");
    err.status = 400;
    throw err;
  }
  const wishlists = wishlistsStore();
  const index = userWishlistsStore();
  const slugs = slugIndexStore();
  const id = generateId("wl");
  let shareSlug = generateShareSlug();
  while (await slugs.get(shareSlug)) {
    shareSlug = generateShareSlug();
  }
  const now = new Date().toISOString();
  const list = {
    id,
    userId,
    title: title.trim(),
    description: (description || "").trim(),
    shareSlug,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  await wishlists.setJSON(id, list);
  await slugs.setJSON(shareSlug, { wishlistId: id });
  const ids = (await index.get(userId)) || [];
  ids.unshift(id);
  await index.setJSON(userId, ids);
  return withOwner(list, { isOwner: true });
}

export async function getOwnedWishlist(userId, wishlistId) {
  const wishlists = wishlistsStore();
  const list = await wishlists.get(wishlistId);
  if (!list || list.userId !== userId) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  return list;
}

export async function updateWishlist(userId, wishlistId, { title, description }) {
  const list = await getOwnedWishlist(userId, wishlistId);
  if (title !== undefined) {
    if (!title.trim()) {
      const err = new Error("Title is required");
      err.status = 400;
      throw err;
    }
    list.title = title.trim();
  }
  if (description !== undefined) list.description = description.trim();
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function deleteWishlist(userId, wishlistId) {
  const list = await getOwnedWishlist(userId, wishlistId);
  const wishlists = wishlistsStore();
  const index = userWishlistsStore();
  const slugs = slugIndexStore();
  await wishlists.delete(list.id);
  await slugs.delete(list.shareSlug);
  const ids = ((await index.get(userId)) || []).filter((id) => id !== wishlistId);
  await index.setJSON(userId, ids);
  return { ok: true };
}

export async function addItem(userId, wishlistId, data) {
  const list = await getOwnedWishlist(userId, wishlistId);
  if (!data?.name?.trim()) {
    const err = new Error("Item name is required");
    err.status = 400;
    throw err;
  }
  const item = {
    id: generateId("it"),
    name: data.name.trim(),
    url: (data.url || "").trim(),
    notes: (data.notes || "").trim(),
    price: (data.price || "").trim(),
    claimedBy: null,
    claimedAnonymous: false,
    claimedAt: null,
    createdAt: new Date().toISOString(),
  };
  list.items.push(item);
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function updateItem(userId, wishlistId, itemId, data) {
  const list = await getOwnedWishlist(userId, wishlistId);
  const item = list.items.find((i) => i.id === itemId);
  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      const err = new Error("Item name is required");
      err.status = 400;
      throw err;
    }
    item.name = data.name.trim();
  }
  if (data.url !== undefined) item.url = data.url.trim();
  if (data.notes !== undefined) item.notes = data.notes.trim();
  if (data.price !== undefined) item.price = data.price.trim();
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function deleteItem(userId, wishlistId, itemId) {
  const list = await getOwnedWishlist(userId, wishlistId);
  const before = list.items.length;
  list.items = list.items.filter((i) => i.id !== itemId);
  if (list.items.length === before) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function unclaimItem(userId, wishlistId, itemId) {
  const list = await getOwnedWishlist(userId, wishlistId);
  const item = list.items.find((i) => i.id === itemId);
  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  item.claimedBy = null;
  item.claimedAnonymous = false;
  item.claimedAt = null;
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function getSharedWishlist(slug) {
  const slugs = slugIndexStore();
  const ref = await slugs.get(slug);
  if (!ref?.wishlistId) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  const list = await wishlistsStore().get(ref.wishlistId);
  if (!list) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  return withOwner(list, { includeClaims: true, isOwner: false });
}

export async function claimItem(slug, itemId, { name, anonymous }) {
  const slugs = slugIndexStore();
  const ref = await slugs.get(slug);
  if (!ref?.wishlistId) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  const wishlists = wishlistsStore();
  const list = await wishlists.get(ref.wishlistId);
  if (!list) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  const item = list.items.find((i) => i.id === itemId);
  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  if (item.claimedAt) {
    const err = new Error("This item is already claimed");
    err.status = 409;
    throw err;
  }
  const isAnonymous = Boolean(anonymous) || !name?.trim();
  item.claimedAnonymous = isAnonymous;
  item.claimedBy = isAnonymous ? null : name.trim().slice(0, 80);
  item.claimedAt = new Date().toISOString();
  list.updatedAt = new Date().toISOString();
  await wishlists.setJSON(list.id, list);
  return withOwner(list, { includeClaims: true, isOwner: false });
}

export { publicWishlist, withOwner };
