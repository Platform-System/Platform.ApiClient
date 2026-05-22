import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { configurePlatformApi, getApiClient, getPublicApiClient, getKeycloak } from './apiClient';

// Mock Keycloak library
vi.mock('keycloak-js', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        authenticated: true,
        token: 'mock-auth-token-123',
        updateToken: vi.fn().mockResolvedValue(true),
        logout: vi.fn(),
      };
    }),
  };
});

describe('Platform API Client', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    // Stub window global for browser-only Keycloak initialization check
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    mockAxios.restore();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should configure base URL and instance reset', () => {
    configurePlatformApi({
      baseURL: 'https://api.test.com',
      keycloak: {
        url: 'https://auth.test.com',
        realm: 'test-realm',
        clientId: 'test-client-id',
      },
    });

    const client = getApiClient();
    expect(client.defaults.baseURL).toBe('https://api.test.com');
  });

  it('should attach Bearer token to request headers in authenticated client', async () => {
    configurePlatformApi({
      baseURL: 'https://api.test.com',
      keycloak: {
        url: 'https://auth.test.com',
        realm: 'test-realm',
        clientId: 'test-client-id',
      },
    });

    mockAxios.onGet('/data').reply(200, { success: true });

    const client = getApiClient();
    const response = await client.get('/data');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true });
    // Verify interceptor injected the Bearer token
    expect(mockAxios.history.get[0].headers?.Authorization).toBe('Bearer mock-auth-token-123');
  });

  it('should call onUnauthorized callback on 401 response status code', async () => {
    const onUnauthorizedMock = vi.fn();
    configurePlatformApi({
      baseURL: 'https://api.test.com',
      keycloak: {
        url: 'https://auth.test.com',
        realm: 'test-realm',
        clientId: 'test-client-id',
      },
      onUnauthorized: onUnauthorizedMock,
    });

    mockAxios.onGet('/secure-endpoint').reply(401);

    const client = getApiClient();
    
    await expect(client.get('/secure-endpoint')).rejects.toThrow();
    expect(onUnauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback on other error responses', async () => {
    const onErrorMock = vi.fn();
    configurePlatformApi({
      baseURL: 'https://api.test.com',
      keycloak: {
        url: 'https://auth.test.com',
        realm: 'test-realm',
        clientId: 'test-client-id',
      },
      onError: onErrorMock,
    });

    mockAxios.onGet('/error-endpoint').reply(500, { message: 'Internal Error' });

    const client = getApiClient();
    
    await expect(client.get('/error-endpoint')).rejects.toThrow();
    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });

  it('should not attach Authorization header to public API client requests', async () => {
    configurePlatformApi({
      baseURL: 'https://api.test.com',
      keycloak: {
        url: 'https://auth.test.com',
        realm: 'test-realm',
        clientId: 'test-client-id',
      },
    });

    mockAxios.onGet('/public-data').reply(200, { data: 'hello' });

    const publicClient = getPublicApiClient();
    const response = await publicClient.get('/public-data');

    expect(response.status).toBe(200);
    expect(mockAxios.history.get[0].headers?.Authorization).toBeUndefined();
  });
});
