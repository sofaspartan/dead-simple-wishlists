import { getOwnerById } from "./auth.mjs";
import { generateId, generateShareSlug } from "./crypto.mjs";
import {
  slugIndexStore,
  userWishlistsStore,
  userWishesStore,
  wishesStore,
  wishlistsStore,
} from "./store.mjs";

function publicItem(item, { includeClaims = true, isOwner = false } = {}) {
  const claimed = Boolean(item.claimedAt);
  return {
    id: item.id,
    name: item.name,
    url: item.url || "",
    notes: item.notes || "",
    price: item.price || "",
    wishlistIds: Array.isArray(item.wishlistIds) ? item.wishlistIds : [],
    claimed,
    claimedBy:
      includeClaims && claimed
        ? item.claimedBy || (item.claimedAnonymous ? "Anonymous" : "")
        : claimed
          ? "Claimed"
          : null,
    claimedAnonymous: includeClaims ? Boolean(item.claimedAnonymous) : undefined,
    claimedAt: includeClaims && claimed ? item.claimedAt : undefined,
    canUnclaim: isOwner && claimed,
  };
}

function publicWishlist(list, items, { includeClaims = true, isOwner = false, owner = null } = {}) {
  return {
    id: list.id,
    title: list.title,
    description: list.description || "",
    shareSlug: list.shareSlug,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    ownerId: isOwner ? list.userId : undefined,
    owner: owner || null,
    items: (items || []).map((item) => publicItem(item, { includeClaims, isOwner })),
  };
}

async function indexWish(userId, wishId) {
  const index = userWishesStore();
  const ids = (await index.get(userId)) || [];
  if (!ids.includes(wishId)) {
    ids.unshift(wishId);
    await index.setJSON(userId, ids);
  }
}

async function unindexWish(userId, wishId) {
  const index = userWishesStore();
  const ids = ((await index.get(userId)) || []).filter((id) => id !== wishId);
  await index.setJSON(userId, ids);
}

/** Move nested wishlist.items into the wishes store (idempotent). */
async function migrateWishlistItems(list) {
  if (!Array.isArray(list.items) || list.items.length === 0) {
    if (list.items) {
      delete list.items;
      await wishlistsStore().setJSON(list.id, list);
    }
    return;
  }

  const wishes = wishesStore();
  for (const raw of list.items) {
    const existing = await wishes.get(raw.id);
    if (existing) {
      const ids = new Set(existing.wishlistIds || []);
      ids.add(list.id);
      existing.wishlistIds = [...ids];
      await wishes.setJSON(existing.id, existing);
      await indexWish(list.userId, existing.id);
      continue;
    }
    const wish = {
      id: raw.id || generateId("it"),
      userId: list.userId,
      name: raw.name,
      url: raw.url || "",
      notes: raw.notes || "",
      price: raw.price || "",
      claimedBy: raw.claimedBy ?? null,
      claimedAnonymous: Boolean(raw.claimedAnonymous),
      claimedAt: raw.claimedAt ?? null,
      wishlistIds: [list.id],
      createdAt: raw.createdAt || list.createdAt || new Date().toISOString(),
      updatedAt: list.updatedAt || new Date().toISOString(),
    };
    await wishes.setJSON(wish.id, wish);
    await indexWish(list.userId, wish.id);
  }

  delete list.items;
  await wishlistsStore().setJSON(list.id, list);
}

async function wishesForWishlist(wishlistId, userId) {
  const index = userWishesStore();
  const wishes = wishesStore();
  const ids = (await index.get(userId)) || [];
  const out = [];
  for (const id of ids) {
    const wish = await wishes.get(id);
    if (wish && wish.userId === userId && (wish.wishlistIds || []).includes(wishlistId)) {
      out.push(wish);
    }
  }
  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return out;
}

async function withOwner(list, opts = {}) {
  await migrateWishlistItems(list);
  const owner = await getOwnerById(list.userId);
  const items = await wishesForWishlist(list.id, list.userId);
  return publicWishlist(list, items, { ...opts, owner });
}

export async function listWishlistsForUser(userId) {
  const index = userWishlistsStore();
  const wishlists = wishlistsStore();
  const ids = (await index.get(userId)) || [];
  const owner = await getOwnerById(userId);
  const lists = [];
  for (const id of ids) {
    const list = await wishlists.get(id);
    if (!list) continue;
    await migrateWishlistItems(list);
    const items = await wishesForWishlist(list.id, userId);
    lists.push(publicWishlist(list, items, { isOwner: true, owner }));
  }
  lists.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return lists;
}

export async function listWishesForUser(userId, { filter = "all" } = {}) {
  const index = userWishesStore();
  const wishes = wishesStore();
  // Ensure nested items are migrated for this user first
  const listIds = (await userWishlistsStore().get(userId)) || [];
  for (const listId of listIds) {
    const list = await wishlistsStore().get(listId);
    if (list) await migrateWishlistItems(list);
  }

  const ids = (await index.get(userId)) || [];
  const out = [];
  for (const id of ids) {
    const wish = await wishes.get(id);
    if (!wish || wish.userId !== userId) continue;
    const listed = (wish.wishlistIds || []).length > 0;
    if (filter === "unlisted" && listed) continue;
    out.push(publicItem(wish, { isOwner: true }));
  }
  out.sort((a, b) => {
    const aw = a.claimed ? 1 : 0;
    const bw = b.claimed ? 1 : 0;
    if (aw !== bw) return aw - bw;
    return 0;
  });
  return out;
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
  while (await slugs.get(shareSlug, { retry: false })) {
    shareSlug = generateShareSlug();
  }
  const now = new Date().toISOString();
  const list = {
    id,
    userId,
    title: title.trim(),
    description: (description || "").trim(),
    shareSlug,
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
  await migrateWishlistItems(list);
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
  const wishes = wishesStore();

  // Detach wishes; do not delete them (they become unlisted if no other lists)
  const wishIds = (await userWishesStore().get(userId)) || [];
  for (const wishId of wishIds) {
    const wish = await wishes.get(wishId);
    if (!wish || wish.userId !== userId) continue;
    if (!(wish.wishlistIds || []).includes(wishlistId)) continue;
    wish.wishlistIds = (wish.wishlistIds || []).filter((id) => id !== wishlistId);
    wish.updatedAt = new Date().toISOString();
    await wishes.setJSON(wish.id, wish);
  }

  await wishlists.delete(list.id);
  await slugs.delete(list.shareSlug);
  const ids = ((await index.get(userId)) || []).filter((id) => id !== wishlistId);
  await index.setJSON(userId, ids);
  return { ok: true };
}

async function validateWishlistIds(userId, wishlistIds) {
  const ids = Array.isArray(wishlistIds)
    ? [...new Set(wishlistIds.filter((id) => typeof id === "string" && id))]
    : [];
  for (const id of ids) {
    await getOwnedWishlist(userId, id);
  }
  return ids;
}

export async function createWish(userId, data) {
  if (!data?.name?.trim()) {
    const err = new Error("Item name is required");
    err.status = 400;
    throw err;
  }
  const wishlistIds = await validateWishlistIds(userId, data.wishlistIds || []);
  const now = new Date().toISOString();
  const wish = {
    id: generateId("it"),
    userId,
    name: data.name.trim(),
    url: (data.url || "").trim(),
    notes: (data.notes || "").trim(),
    price: (data.price || "").trim(),
    claimedBy: null,
    claimedAnonymous: false,
    claimedAt: null,
    wishlistIds,
    createdAt: now,
    updatedAt: now,
  };
  await wishesStore().setJSON(wish.id, wish);
  await indexWish(userId, wish.id);
  for (const listId of wishlistIds) {
    const list = await getOwnedWishlist(userId, listId);
    list.updatedAt = now;
    await wishlistsStore().setJSON(list.id, list);
  }
  return publicItem(wish, { isOwner: true });
}

export async function getOwnedWish(userId, wishId) {
  // Migrate first so nested items are findable
  const listIds = (await userWishlistsStore().get(userId)) || [];
  for (const listId of listIds) {
    const list = await wishlistsStore().get(listId);
    if (list) await migrateWishlistItems(list);
  }

  const wish = await wishesStore().get(wishId);
  if (!wish || wish.userId !== userId) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  return wish;
}

export async function updateWish(userId, wishId, data) {
  const wish = await getOwnedWish(userId, wishId);
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      const err = new Error("Item name is required");
      err.status = 400;
      throw err;
    }
    wish.name = data.name.trim();
  }
  if (data.url !== undefined) wish.url = data.url.trim();
  if (data.notes !== undefined) wish.notes = data.notes.trim();
  if (data.price !== undefined) wish.price = data.price.trim();
  if (data.wishlistIds !== undefined) {
    wish.wishlistIds = await validateWishlistIds(userId, data.wishlistIds);
  }
  wish.updatedAt = new Date().toISOString();
  await wishesStore().setJSON(wish.id, wish);
  return publicItem(wish, { isOwner: true });
}

export async function deleteWish(userId, wishId) {
  const wish = await getOwnedWish(userId, wishId);
  await wishesStore().delete(wish.id);
  await unindexWish(userId, wish.id);
  return { ok: true };
}

export async function addItem(userId, wishlistId, data) {
  await getOwnedWishlist(userId, wishlistId);
  const wish = await createWish(userId, { ...data, wishlistIds: [wishlistId] });
  const list = await getOwnedWishlist(userId, wishlistId);
  return withOwner(list, { isOwner: true });
}

export async function updateItem(userId, wishlistId, itemId, data) {
  await getOwnedWishlist(userId, wishlistId);
  const wish = await getOwnedWish(userId, itemId);
  if (!(wish.wishlistIds || []).includes(wishlistId)) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  await updateWish(userId, itemId, data);
  const list = await getOwnedWishlist(userId, wishlistId);
  return withOwner(list, { isOwner: true });
}

export async function deleteItem(userId, wishlistId, itemId) {
  await getOwnedWishlist(userId, wishlistId);
  const wish = await getOwnedWish(userId, itemId);
  if (!(wish.wishlistIds || []).includes(wishlistId)) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  // Remove from this list only; delete wish if no lists remain
  wish.wishlistIds = (wish.wishlistIds || []).filter((id) => id !== wishlistId);
  if (wish.wishlistIds.length === 0) {
    await wishesStore().delete(wish.id);
    await unindexWish(userId, wish.id);
  } else {
    wish.updatedAt = new Date().toISOString();
    await wishesStore().setJSON(wish.id, wish);
  }
  const list = await getOwnedWishlist(userId, wishlistId);
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { isOwner: true });
}

export async function unclaimItem(userId, wishlistId, itemId) {
  await getOwnedWishlist(userId, wishlistId);
  const wish = await getOwnedWish(userId, itemId);
  if (!(wish.wishlistIds || []).includes(wishlistId)) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  wish.claimedBy = null;
  wish.claimedAnonymous = false;
  wish.claimedAt = null;
  wish.updatedAt = new Date().toISOString();
  await wishesStore().setJSON(wish.id, wish);
  const list = await getOwnedWishlist(userId, wishlistId);
  return withOwner(list, { isOwner: true });
}

export async function unclaimWish(userId, wishId) {
  const wish = await getOwnedWish(userId, wishId);
  wish.claimedBy = null;
  wish.claimedAnonymous = false;
  wish.claimedAt = null;
  wish.updatedAt = new Date().toISOString();
  await wishesStore().setJSON(wish.id, wish);
  return publicItem(wish, { isOwner: true });
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
  const list = await wishlistsStore().get(ref.wishlistId);
  if (!list) {
    const err = new Error("Wishlist not found");
    err.status = 404;
    throw err;
  }
  await migrateWishlistItems(list);
  const wish = await wishesStore().get(itemId);
  if (!wish || !(wish.wishlistIds || []).includes(list.id)) {
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  if (wish.claimedAt) {
    const err = new Error("This item is already claimed");
    err.status = 409;
    throw err;
  }
  const isAnonymous = Boolean(anonymous) || !name?.trim();
  wish.claimedAnonymous = isAnonymous;
  wish.claimedBy = isAnonymous ? null : name.trim().slice(0, 80);
  wish.claimedAt = new Date().toISOString();
  wish.updatedAt = new Date().toISOString();
  await wishesStore().setJSON(wish.id, wish);
  list.updatedAt = new Date().toISOString();
  await wishlistsStore().setJSON(list.id, list);
  return withOwner(list, { includeClaims: true, isOwner: false });
}

export { publicWishlist, withOwner, publicItem };
