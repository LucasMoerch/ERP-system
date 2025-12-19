/**
 * @jest-environment jsdom
 */

import { navigate } from './main';

// Mock routed content
const mockResolveRoute = jest.fn((path: string) => {
  const el = document.createElement('div');
  el.id = 'route-content';
  el.textContent = `Route: ${path}`;
  return el;
});

// Mock time tracker
const mockRenderTimeTracker = jest.fn(() => {
  const el = document.createElement('button');
  el.textContent = 'Time tracker';
  return el;
});

// Mock navbar
const mockRenderHeaderAndNavbar = jest.fn(() => {
  const el = document.createElement('header');
  el.id = 'navbar-title';
  el.textContent = 'Initial title';
  return el;
});

const mockGetPageTitle = jest.fn((path: string) => `Title for ${path}`);

// Replace real imports from main.ts with mocks
jest.mock('./routers/router', () => ({
  resolveRoute: (path: string) => mockResolveRoute(path),
}));

jest.mock('./components/timeTracker/timeTracker', () => ({
  renderTimeTracker: () => mockRenderTimeTracker(),
}));

jest.mock('./components/navbar', () => ({
  renderHeaderAndNavbar: () => mockRenderHeaderAndNavbar(),
  getPageTitle: (path: string) => mockGetPageTitle(path),
}));

describe('main.ts routing and layout', () => {
  beforeEach(() => {
    // Fresh DOM for each test
    document.body.innerHTML = '<div id="app"></div>';
    // Reset mocks
    jest.clearAllMocks();
  });

  test('navigate() renders route content into #app', () => {
    navigate('/some-path');

    const app = document.getElementById('app')!;
    const routeContent = app.querySelector('#route-content');

    expect(mockResolveRoute).toHaveBeenCalledWith('/some-path');
    expect(routeContent).not.toBeNull();
    expect(routeContent?.textContent).toBe('Route: /some-path');
  });

  test('navigate() adds time tracker button on non-excluded pages', () => {
    navigate('/home');

    const tracker = document.getElementById('time-tracker-button');

    expect(mockRenderTimeTracker).toHaveBeenCalledTimes(1);
    expect(tracker).not.toBeNull();
    expect(tracker?.textContent).toContain('Time tracker');
  });

  test('navigate() does NOT add time tracker button on /login', () => {
    navigate('/login');

    const tracker = document.getElementById('time-tracker-button');

    expect(mockRenderTimeTracker).not.toHaveBeenCalled();
    expect(tracker).toBeNull();
  });

  test('navbar is rendered and title updated on non-excluded pages', () => {
    navigate('/dashboard');

    const navbarContainer = document.getElementById('navbar-container');
    const navbarTitle = document.getElementById('navbar-title');

    expect(mockRenderHeaderAndNavbar).toHaveBeenCalledTimes(1);
    expect(navbarContainer).not.toBeNull();
    expect(navbarTitle).not.toBeNull();
    expect(mockGetPageTitle).toHaveBeenCalledWith('/dashboard');
    expect(navbarTitle?.textContent).toBe('Title for /dashboard');
  });

  test('navbar is removed on /login', () => {
    // First go to a normal page to create navbar
    navigate('/dashboard');
    expect(document.getElementById('navbar-container')).not.toBeNull();

    // Then go to excluded page
    navigate('/login');
    expect(document.getElementById('navbar-container')).toBeNull();
  });
});
