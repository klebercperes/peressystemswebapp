/**
 * Business Settings Service
 * Fetches business settings from the API
 */

export interface BusinessSettings {
  id: string;
  trading_name?: string;
  business_name?: string;
  abn?: string;
  company_logo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone_number?: string;
  mobile_number?: string;
  email_contact?: string;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  updated_at: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.1.122:8000';

let cachedSettings: BusinessSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getBusinessSettings(): Promise<BusinessSettings> {
  // Return cached settings if still valid
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/business-settings`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const settings = await response.json();
      cachedSettings = settings;
      cacheTimestamp = now;
      return settings;
    }
  } catch (error) {
    console.error('Error fetching business settings:', error);
  }

  // Return default settings if fetch fails
  return {
    id: '',
    country: 'Australia',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export function clearBusinessSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

