import '@testing-library/jest-dom';

import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './msw/server';

// Radix UI uses Pointer Events and scroll APIs that jsdom does not implement
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
