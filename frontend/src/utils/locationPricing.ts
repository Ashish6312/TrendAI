// Location-based pricing utility
export interface CountryPricing {
  country: string;
  currency: string;
  symbol: string;
  free: {
    price: number;
    originalPrice?: number;
  };
  professional: {
    monthly: number;
    yearly: number;
    originalMonthly?: number;
    originalYearly?: number;
  };
  enterprise: {
    monthly: number;
    yearly: number;
    originalMonthly?: number;
    originalYearly?: number;
  };
  purchasingPower: number; // Relative purchasing power (1.0 = baseline)
}

// Comprehensive location-based pricing data
export const locationPricing: Record<string, CountryPricing> = {
  // North America
  'United States': {
    country: 'United States',
    currency: 'USD',
    symbol: '$',
    free: { price: 0 },
    professional: { monthly: 97, yearly: 67, originalMonthly: 147, originalYearly: 97 },
    enterprise: { monthly: 297, yearly: 197, originalMonthly: 447, originalYearly: 297 },
    purchasingPower: 1.0
  },
  'Canada': {
    country: 'Canada',
    currency: 'CAD',
    symbol: 'C$',
    free: { price: 0 },
    professional: { monthly: 89, yearly: 62, originalMonthly: 129, originalYearly: 89 },
    enterprise: { monthly: 259, yearly: 194, originalMonthly: 389, originalYearly: 259 },
    purchasingPower: 0.95
  },

  // Europe
  'United Kingdom': {
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    free: { price: 0 },
    professional: { monthly: 78, yearly: 54, originalMonthly: 118, originalYearly: 78 },
    enterprise: { monthly: 239, yearly: 159, originalMonthly: 359, originalYearly: 239 },
    purchasingPower: 1.05
  },
  'Germany': {
    country: 'Germany',
    currency: 'EUR',
    symbol: '€',
    free: { price: 0 },
    professional: { monthly: 89, yearly: 62, originalMonthly: 139, originalYearly: 89 },
    enterprise: { monthly: 276, yearly: 184, originalMonthly: 414, originalYearly: 276 },
    purchasingPower: 1.02
  },
  'France': {
    country: 'France',
    currency: 'EUR',
    symbol: '€',
    free: { price: 0 },
    professional: { monthly: 62, yearly: 44, originalMonthly: 89, originalYearly: 62 },
    enterprise: { monthly: 184, yearly: 138, originalMonthly: 276, originalYearly: 184 },
    purchasingPower: 1.02
  },
  'Netherlands': {
    country: 'Netherlands',
    currency: 'EUR',
    symbol: '€',
    free: { price: 0 },
    professional: { monthly: 62, yearly: 44, originalMonthly: 89, originalYearly: 62 },
    enterprise: { monthly: 184, yearly: 138, originalMonthly: 276, originalYearly: 184 },
    purchasingPower: 1.08
  },

  // Asia-Pacific
  'India': {
    country: 'India',
    currency: 'INR',
    symbol: '₹',
    free: { price: 0 },
    professional: { monthly: 1999, yearly: 1399, originalMonthly: 2999, originalYearly: 1999 },
    enterprise: { monthly: 5999, yearly: 4499, originalMonthly: 8999, originalYearly: 5999 },
    purchasingPower: 0.25
  },
  'China': {
    country: 'China',
    currency: 'CNY',
    symbol: '¥',
    free: { price: 0 },
    professional: { monthly: 299, yearly: 209, originalMonthly: 449, originalYearly: 299 },
    enterprise: { monthly: 899, yearly: 674, originalMonthly: 1349, originalYearly: 899 },
    purchasingPower: 0.45
  },
  'Japan': {
    country: 'Japan',
    currency: 'JPY',
    symbol: '¥',
    free: { price: 0 },
    professional: { monthly: 7900, yearly: 5500, originalMonthly: 11900, originalYearly: 7900 },
    enterprise: { monthly: 23900, yearly: 17900, originalMonthly: 35900, originalYearly: 23900 },
    purchasingPower: 0.85
  },
  'Australia': {
    country: 'Australia',
    currency: 'AUD',
    symbol: 'A$',
    free: { price: 0 },
    professional: { monthly: 97, yearly: 68, originalMonthly: 147, originalYearly: 97 },
    enterprise: { monthly: 294, yearly: 220, originalMonthly: 441, originalYearly: 294 },
    purchasingPower: 0.92
  },
  'Singapore': {
    country: 'Singapore',
    currency: 'SGD',
    symbol: 'S$',
    free: { price: 0 },
    professional: { monthly: 89, yearly: 62, originalMonthly: 134, originalYearly: 89 },
    enterprise: { monthly: 269, yearly: 202, originalMonthly: 404, originalYearly: 269 },
    purchasingPower: 1.15
  },

  // Latin America
  'Brazil': {
    country: 'Brazil',
    currency: 'BRL',
    symbol: 'R$',
    free: { price: 0 },
    professional: { monthly: 199, yearly: 139, originalMonthly: 299, originalYearly: 199 },
    enterprise: { monthly: 599, yearly: 449, originalMonthly: 899, originalYearly: 599 },
    purchasingPower: 0.35
  },
  'Mexico': {
    country: 'Mexico',
    currency: 'MXN',
    symbol: 'MX$',
    free: { price: 0 },
    professional: { monthly: 899, yearly: 629, originalMonthly: 1349, originalYearly: 899 },
    enterprise: { monthly: 2699, yearly: 2024, originalMonthly: 4049, originalYearly: 2699 },
    purchasingPower: 0.40
  },
  'Argentina': {
    country: 'Argentina',
    currency: 'ARS',
    symbol: 'AR$',
    free: { price: 0 },
    professional: { monthly: 15999, yearly: 11199, originalMonthly: 23999, originalYearly: 15999 },
    enterprise: { monthly: 47999, yearly: 35999, originalMonthly: 71999, originalYearly: 47999 },
    purchasingPower: 0.20
  },

  // Middle East & Africa
  'South Africa': {
    country: 'South Africa',
    currency: 'ZAR',
    symbol: 'R',
    free: { price: 0 },
    professional: { monthly: 799, yearly: 559, originalMonthly: 1199, originalYearly: 799 },
    enterprise: { monthly: 2399, yearly: 1799, originalMonthly: 3599, originalYearly: 2399 },
    purchasingPower: 0.30
  },
  'United Arab Emirates': {
    country: 'United Arab Emirates',
    currency: 'AED',
    symbol: 'AED',
    free: { price: 0 },
    professional: { monthly: 249, yearly: 174, originalMonthly: 374, originalYearly: 249 },
    enterprise: { monthly: 749, yearly: 562, originalMonthly: 1124, originalYearly: 749 },
    purchasingPower: 0.95
  },

  // Eastern Europe
  'Poland': {
    country: 'Poland',
    currency: 'PLN',
    symbol: 'zł',
    free: { price: 0 },
    professional: { monthly: 199, yearly: 139, originalMonthly: 299, originalYearly: 199 },
    enterprise: { monthly: 599, yearly: 449, originalMonthly: 899, originalYearly: 599 },
    purchasingPower: 0.55
  },
  'Czech Republic': {
    country: 'Czech Republic',
    currency: 'CZK',
    symbol: 'Kč',
    free: { price: 0 },
    professional: { monthly: 1299, yearly: 909, originalMonthly: 1949, originalYearly: 1299 },
    enterprise: { monthly: 3899, yearly: 2924, originalMonthly: 5849, originalYearly: 3899 },
    purchasingPower: 0.60
  },

  // Southeast Asia
  'Thailand': {
    country: 'Thailand',
    currency: 'THB',
    symbol: '฿',
    free: { price: 0 },
    professional: { monthly: 1999, yearly: 1399, originalMonthly: 2999, originalYearly: 1999 },
    enterprise: { monthly: 5999, yearly: 4499, originalMonthly: 8999, originalYearly: 5999 },
    purchasingPower: 0.35
  },
  'Malaysia': {
    country: 'Malaysia',
    currency: 'MYR',
    symbol: 'RM',
    free: { price: 0 },
    professional: { monthly: 249, yearly: 174, originalMonthly: 374, originalYearly: 249 },
    enterprise: { monthly: 749, yearly: 562, originalMonthly: 1124, originalYearly: 749 },
    purchasingPower: 0.45
  },
  'Indonesia': {
    country: 'Indonesia',
    currency: 'IDR',
    symbol: 'Rp',
    free: { price: 0 },
    professional: { monthly: 799000, yearly: 559000, originalMonthly: 1199000, originalYearly: 799000 },
    enterprise: { monthly: 2399000, yearly: 1799000, originalMonthly: 3599000, originalYearly: 2399000 },
    purchasingPower: 0.25
  }
};

// Default pricing for unknown countries (USD baseline)
export const defaultPricing: CountryPricing = {
  country: 'Global',
  currency: 'USD',
  symbol: '$',
  free: { price: 0 },
  professional: { monthly: 97, yearly: 67, originalMonthly: 147, originalYearly: 97 },
  enterprise: { monthly: 297, yearly: 197, originalMonthly: 447, originalYearly: 297 },
  purchasingPower: 1.0
};

// Get pricing for a specific country
export function getPricingForCountry(country: string): CountryPricing {
  return locationPricing[country] || defaultPricing;
}

// Format price with currency symbol
export function formatPrice(amount: number, pricing: CountryPricing): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: pricing.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // For some currencies, we want to show the symbol differently
  if (pricing.currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  } else if (pricing.currency === 'JPY') {
    return `¥${amount.toLocaleString('ja-JP')}`;
  } else if (pricing.currency === 'CNY') {
    return `¥${amount.toLocaleString('zh-CN')}`;
  } else if (pricing.currency === 'IDR') {
    return `Rp${amount.toLocaleString('id-ID')}`;
  }
  
  return formatter.format(amount);
}

// Get savings percentage
export function getSavingsPercentage(monthly: number, yearly: number): number {
  const savings = ((monthly - yearly) / monthly) * 100;
  return Math.round(savings);
}

// Get purchasing power adjusted pricing
export function getAdjustedPricing(basePricing: CountryPricing, targetCountry: string): CountryPricing {
  const targetPricing = getPricingForCountry(targetCountry);
  
  // If we have specific pricing for the country, use it
  if (locationPricing[targetCountry]) {
    return targetPricing;
  }
  
  // Otherwise, adjust based on purchasing power
  const adjustment = targetPricing.purchasingPower;
  
  return {
    ...targetPricing,
    professional: {
      monthly: Math.round(basePricing.professional.monthly * adjustment),
      yearly: Math.round(basePricing.professional.yearly * adjustment),
      originalMonthly: basePricing.professional.originalMonthly ? Math.round(basePricing.professional.originalMonthly * adjustment) : undefined,
      originalYearly: basePricing.professional.originalYearly ? Math.round(basePricing.professional.originalYearly * adjustment) : undefined,
    },
    enterprise: {
      monthly: Math.round(basePricing.enterprise.monthly * adjustment),
      yearly: Math.round(basePricing.enterprise.yearly * adjustment),
      originalMonthly: basePricing.enterprise.originalMonthly ? Math.round(basePricing.enterprise.originalMonthly * adjustment) : undefined,
      originalYearly: basePricing.enterprise.originalYearly ? Math.round(basePricing.enterprise.originalYearly * adjustment) : undefined,
    }
  };
}