// api.js – every network request in the app goes through this file.

const BASE = "https://restcountries.com/v3.1";
const FIELDS = "name,cca3,capital,region,subregion,population,area,flags,languages,currencies";

export const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

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

// All countries of one region, e.g. "Africa".
export const getRegion = (region) =>
  getJSON(`${BASE}/region/${region.toLowerCase()}?fields=${FIELDS}`);

// One country by its three-letter code, e.g. "RWA".
export const getCountry = (code) => getJSON(`${BASE}/alpha/${code}?fields=${FIELDS}`);

// Loads the 5 regions in parallel. A failed region does not stop the others.
export async function getAllRegions() {
  const results = await Promise.allSettled(REGIONS.map(getRegion));

  const countries = results
    .filter(({ status }) => status === "fulfilled")
    .flatMap(({ value }) => value);

  const failedRegions = REGIONS.filter((_, index) => results[index].status === "rejected");
  const firstError = results.find(({ status }) => status === "rejected")?.reason;

  return { countries, failedRegions, firstError };
}