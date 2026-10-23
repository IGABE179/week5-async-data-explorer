// api.js – every network request in the app goes through this file.

const BASE = "https://dummyjson.com";

// Fetches a URL and returns the JSON. Throws an Error with the status if the request fails.
export async function getJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Network error: check your internet connection and try again.");
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

// All products (limit=0 asks DummyJSON for every product).
export const getProducts = () => getJSON(`${BASE}/products?limit=0`);

// The list of categories, e.g. [{ slug: "beauty", name: "Beauty" }].
export const getCategories = () => getJSON(`${BASE}/products/categories`);

// One product by its id.
export const getProduct = (id) => getJSON(`${BASE}/products/${id}`);

// Loads products and categories at the same time.
// If only the categories fail, the app still works and uses the category slugs instead.
export async function getCatalogue() {
  const [productsResult, categoriesResult] = await Promise.allSettled([
    getProducts(),
    getCategories(),
  ]);

  if (productsResult.status === "rejected") throw productsResult.reason;

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  return { products: productsResult.value.products, categories };
}