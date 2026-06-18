// countryDataProcessor.ts
export interface Country {
  name: string;
  code: string;
  iso: string;
  flag: string;
  cleanCode: string; // +1264 format
  displayCode: string; // +1-264 format
}

// Original country data (your JSON)
const originalCountryData = [
  {
    name: "Aruba",
    code: "+297",
    iso: "AW",
    flag: "🇦🇼",
  },
  {
    name: "Afghanistan",
    code: "+93",
    iso: "AF",
    flag: "🇦🇫",
  },
  // ... আপনার সম্পূর্ণ ডেটা
];

// Process country data
export const processCountryData = (): Country[] => {
  return originalCountryData.map((country) => {
    const originalCode = country.code;

    // Clean code for validation/storage (+1264)
    const cleanCode = originalCode.replace(/[^+\d]/g, "");

    // Display code (keep original format)
    const displayCode = originalCode;

    return {
      ...country,
      cleanCode,
      displayCode,
    };
  });
};

// Sort countries alphabetically
export const getSortedCountries = (): Country[] => {
  const countries = processCountryData();
  return countries.sort((a, b) => a.name.localeCompare(b.name));
};

// Find country by ISO code
export const findCountryByIso = (iso: string): Country | undefined => {
  const countries = processCountryData();
  return countries.find((c) => c.iso === iso);
};

// Get default country (Bangladesh)
export const getDefaultCountry = (): Country => {
  const bangladesh = findCountryByIso("BD");
  if (bangladesh) return bangladesh;

  // Fallback to first country
  const countries = processCountryData();
  return countries[0];
};

export const countryData = getSortedCountries();
