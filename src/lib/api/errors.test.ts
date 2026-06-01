import { describe, it, expect } from 'vitest';
import { parseApiError, shouldRetryRequest } from './errors';

describe('parseApiError', () => {
  it('parses Axios 401 error', () => {
    const err = {
      response: { status: 401, data: { message: 'Invalid credentials' } },
    };
    const result = parseApiError(err);
    expect(result.status).toBe(401);
    expect(result.title).toBe('Session Expired');
    expect(result.message).toBe('Invalid credentials');
  });

  it('parses Axios 422 validation error with field errors', () => {
    const err = {
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          errors: {
            email: ['Email is required', 'Email must be valid'],
            name: ['Name is too short'],
          },
        },
      },
    };
    const result = parseApiError(err);
    expect(result.status).toBe(422);
    expect(result.title).toBe('Validation Error');
    expect(result.message).toContain('Email is required');
  });

  it('parses Axios 500 error', () => {
    const err = {
      response: { status: 500, data: { message: 'Database connection failed' } },
    };
    const result = parseApiError(err);
    expect(result.status).toBe(500);
    expect(result.title).toBe('Server Error');
  });

  it('returns fallback for unknown status', () => {
    const err = { response: { status: 418, data: {} } };
    const result = parseApiError(err);
    expect(result.title).toBe('Error');
    expect(result.status).toBe(418);
  });

  it('parses network error (no response)', () => {
    const err = { request: {}, message: 'Network Error' };
    const result = parseApiError(err);
    expect(result.status).toBe(0);
    expect(result.title).toBe('Network Error');
  });

  it('parses timeout error by code', () => {
    const err = { code: 'ECONNABORTED' };
    const result = parseApiError(err);
    expect(result.status).toBe(0);
    expect(result.title).toBe('Request Timed Out');
  });

  it('parses generic Error instance', () => {
    const err = new Error('Something broke');
    const result = parseApiError(err);
    expect(result.message).toBe('Something broke');
  });

  it('redacts internal messages', () => {
    const err = {
      response: { status: 500, data: { message: 'Exception at /api/v1/users: stack trace' } },
    };
    const result = parseApiError(err);
    expect(result.message).not.toContain('stack');
    expect(result.message).toBe(FALLBACK_MESSAGES[500]);
  });

  it('returns default for unknown error', () => {
    const result = parseApiError(null);
    expect(result.message).toBe('An unexpected error occurred.');
  });
});

describe('shouldRetryRequest', () => {
  it('allows retry for 500 errors', () => {
    expect(shouldRetryRequest(0, { response: { status: 500 } })).toBe(true);
    expect(shouldRetryRequest(1, { response: { status: 500 } })).toBe(true);
    expect(shouldRetryRequest(2, { response: { status: 500 } })).toBe(false);
  });

  it('prevents retry for 401/403', () => {
    expect(shouldRetryRequest(0, { response: { status: 401 } })).toBe(false);
    expect(shouldRetryRequest(0, { response: { status: 403 } })).toBe(false);
  });
});

// Need to access internal constant for the redaction test
const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The data may have already been modified.',
  422: 'Some fields contain invalid values.',
  429: 'You\'re making too many requests. Please wait a moment.',
  500: 'The server encountered an error. Please try again in a moment.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The gateway timed out. Please try again later.',
};
