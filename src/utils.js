// utils.js – pure helper functions. They never touch the DOM or the network.

// Turns one raw API object into the flat shape the app uses.
export function toCountry({
  name,
  cca3,
  capital,
  region,
  subregion,
  population,
  area,
  flags,
  languages,
  currencies,
}) {
  return {
    code: cca3,
    name: name?.common ?? "Unknown country",
    officialName: name?.official ?? "",
    capital: capital?.[0] ?? "Not listed",
    region: region ?? "Other",
    subregion: subregion || "Not listed",
    population: population ?? 0,
    area: Math.max(area ?? 0, 0),
    flag: flags?.svg ?? flags?.png ?? "",
    flagAlt: flags?.alt || `Flag of ${name?.common ?? "this country"}`,
    languages: Object.values(languages ?? {}),
    currencies: Object.values(currencies ?? {}).map(({ name: currencyName, symbol }) =>
      symbol ? `${currencyName} (${symbol})` : currencyName,
    ),
  };
}

// Sort options shown in the "Sort by" menu.
const sorters = {
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "population-desc": (a, b) => b.population - a.population,
  "population-asc": (a, b) => a.population - b.population,
  "area-desc": (a, b) => b.area - a.area,
};

// Applies search, region filter and sort. toSorted returns a new array, so state.items never changes.
export function getVisibleItems({ items, query, filter, sort }) {
  const q = query.trim().toLowerCase();

  const filtered = items
    .filter(({ name, capital }) => name.toLowerCase().includes(q) || capital.toLowerCase().includes(q))
    .filter(({ region }) => filter === "all" || region === filter);

  return sorters[sort] ? filtered.toSorted(sorters[sort]) : filtered;
}

// The unique regions in the data, sorted A–Z, with how many countries each has.
export function getRegionOptions(items) {
  const counts = items.reduce(
    (totals, { region }) => ({ ...totals, [region]: (totals[region] ?? 0) + 1 }),
    {},
  );
  return Object.entries(counts).toSorted(([a], [b]) => a.localeCompare(b));
}

// Stats for the stats bar, computed with reduce.
export function getStats(items) {
  const { population, area } = items.reduce(
    (totals, country) => ({
      population: totals.population + country.population,
      area: totals.area + country.area,
    }),
    { population: 0, area: 0 },
  );

  return {
    shown: items.length,
    population,
    averagePopulation: items.length ? Math.round(population / items.length) : 0,
    area: Math.round(area),
  };
}

export const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

// Waits until the user stops calling fn for `delay` ms, then calls it once (used for search).
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}