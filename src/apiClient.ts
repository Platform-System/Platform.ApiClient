import axios from 'axios';
import type { AxiosInstance } from 'axios';
import Keycloak from 'keycloak-js';

export interface PlatformApiConfig {
  baseURL: string;
  keycloak?: {
    url: string;
    realm: string;
    clientId: string;
    redirectUri?: string;
  };
  onUnauthorized?: () => void;
  onError?: (error: any) => void;
}

let globalConfig: PlatformApiConfig | null = null;
let keycloakInstance: Keycloak | null = null;
let apiClientInstance: AxiosInstance | null = null;
let publicApiClientInstance: AxiosInstance | null = null;

export function configurePlatformApi(config: PlatformApiConfig) {
  globalConfig = config;

  // Reset instances if config is updated
  keycloakInstance = null;
  apiClientInstance = null;
  publicApiClientInstance = null;
}

export function getKeycloak(): Keycloak | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!keycloakInstance) {
    if (!globalConfig?.keycloak) {
      console.warn("Keycloak configuration is missing. Call configurePlatformApi first.");
      return null;
    }
    keycloakInstance = new Keycloak({
      url: globalConfig.keycloak.url,
      realm: globalConfig.keycloak.realm,
      clientId: globalConfig.keycloak.clientId,
    });
  }
  return keycloakInstance;
}

export async function getValidToken(): Promise<string | undefined> {
  const kc = getKeycloak();
  if (!kc || !kc.authenticated) {
    return undefined;
  }
  try {
    // If token expires in less than 30 seconds, refresh it
    await kc.updateToken(30);
    return kc.token;
  } catch (error) {
    console.error('Failed to update Keycloak token:', error);
    if (globalConfig?.keycloak?.redirectUri) {
      kc.logout({ redirectUri: globalConfig.keycloak.redirectUri });
    }
    return undefined;
  }
}

export function getApiClient(): AxiosInstance {
  if (!apiClientInstance) {
    const baseURL = globalConfig?.baseURL || '';
    apiClientInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    apiClientInstance.interceptors.request.use(async (config) => {
      const token = await getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    apiClientInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && globalConfig?.onUnauthorized) {
          globalConfig.onUnauthorized();
        } else if (globalConfig?.onError) {
          globalConfig.onError(error);
        }
        return Promise.reject(error);
      }
    );
  }
  return apiClientInstance;
}

export function getPublicApiClient(): AxiosInstance {
  if (!publicApiClientInstance) {
    const baseURL = globalConfig?.baseURL || '';
    publicApiClientInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }
  return publicApiClientInstance;
}
