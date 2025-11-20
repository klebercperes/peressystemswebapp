import { Service } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cache for services
let servicesCache: Service[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getServices = async (): Promise<Service[]> => {
  // Return cached data if still valid
  const now = Date.now();
  if (servicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return servicesCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't include credentials for public endpoints
      credentials: 'omit',
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch services: ${response.status} ${errorText}`);
    }

    const services = await response.json();
    
    // Filter only active services and sort by order
    const activeServices = services
      .filter((service: Service) => service.is_active)
      .sort((a: Service, b: Service) => {
        const orderA = parseInt(a.order || '0', 10);
        const orderB = parseInt(b.order || '0', 10);
        return orderA - orderB;
      });

    // Update cache
    servicesCache = activeServices;
    cacheTimestamp = now;

    return activeServices;
  } catch (error) {
    console.error('Error fetching services:', error);
    // Return cached data even if expired, if available
    if (servicesCache) {
      return servicesCache;
    }
    throw error;
  }
};

export const getServiceById = async (serviceId: string): Promise<Service | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
};

// Clear cache (useful after updates)
export const clearServicesCache = (): void => {
  servicesCache = null;
  cacheTimestamp = 0;
};

