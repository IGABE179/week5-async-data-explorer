// utils.js – pure helper functions. They never touch the DOM or the network.

// Turns one raw product from the API into the shape the app uses.
export function toProduct(
  { id, title, description, category, price, discountPercentage, rating, stock, brand, thumbnail, images, availabilityStatus, warrantyInformation, shippingInformation, reviews },
  categoryNames = {},
) {
  return {
    id,
    title: title ?? "Untitled product",
    description: description ?? "",
    category: category ?? "other",
    categoryName: categoryNames[category] ?? category ?? "Other",
    price: price ?? 0,
    discount: discountPercentage ?? 0,
    rating: rating ?? 0,
    stock: stock ?? 0,
    brand: brand ?? "No brand",
    image: thumbnail ?? images?.[0] ?? "",
    availability: availabilityStatus ?? (stock > 0 ? "In Stock" : "Out of Stock"),
    warranty: warrantyInformation ?? "Not listed",
    shipping: shippingInformation ?? "Not listed",
    reviewCount: reviews?.length ?? 0,
  };
}

// Builds { slug: "Display name" } from the categories endpoint.
export const toCategoryNames = (categories) =>
  Object.fromEntries(categories.map(({ slug, name }) => [slug, name]));

// Sort options shown in the "Sort by" menu.
const sorters = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "rating-desc": (a, b) => b.rating - a.rating,
  "name-asc": (a, b) => a.title.localeCompare(b.title),
};

// Applies search, category filter and sort. toSorted returns a new array, so state.items never changes.
export function getVisibleItems({ items, query, filter, sort }) {
  const q = query.trim().toLowerCase();

  const filtered = items
    .filter(({ title, brand }) => title.toLowerCase().includes(q) || brand.toLowerCase().includes(q))
    .filter(({ category }) => filter === "all" || category === filter);

  return sorters[sort] ? filtered.toSorted(sorters[sort]) : filtered;
}

// The unique categories in the data, sorted A–Z, with how many products each has.
export function getCategoryOptions(items) {
  const counts = items.reduce(
    (totals, { category, categoryName }) => ({
      ...totals,
      [category]: { name: categoryName, count: (totals[category]?.count ?? 0) + 1 },
    }),
    {},
  );
  return Object.entries(counts).toSorted(([, a], [, b]) => a.name.localeCompare(b.name));
}

// Stats for the stats bar, computed with reduce.
export function getStats(items) {
  const { priceTotal, ratingTotal, stock } = items.reduce(
    (totals, product) => ({
      priceTotal: totals.priceTotal + product.price,
      ratingTotal: totals.ratingTotal + product.rating,
      stock: totals.stock + product.stock,
    }),
    { priceTotal: 0, ratingTotal: 0, stock: 0 },
  );

  const count = items.length;
  return {
    shown: count,
    averagePrice: count ? priceTotal / count : 0,
    averageRating: count ? ratingTotal / count : 0,
    stock,
  };
}

export const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

// Waits until the user stops calling fn for `delay` ms, then calls it once (used for search).
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}