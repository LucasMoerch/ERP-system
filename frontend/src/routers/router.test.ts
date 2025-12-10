/**
 * @jest-environment jsdom
 */

import { resolveRoute } from './router';

const homeEl = document.createElement('div');
homeEl.id = 'home-page';

const loginEl = document.createElement('div');
loginEl.id = 'login-page';

const casesEl = document.createElement('div');
casesEl.id = 'cases-page';

const clientsEl = document.createElement('div');
clientsEl.id = 'clients-page';

const myProfileEl = document.createElement('div');
myProfileEl.id = 'my-profile-page';

const staffEl = document.createElement('div');
staffEl.id = 'staff-page';

const mockRenderHomePage = jest.fn(() => homeEl);
const mockRenderLoginPage = jest.fn(() => loginEl);
const mockRenderCasesPage = jest.fn(() => casesEl);
const mockRenderClientsPage = jest.fn(() => clientsEl);
const mockRenderMyProfilePage = jest.fn(() => myProfileEl);
const mockRenderStaffPage = jest.fn(() => staffEl);

const mockIsAuthenticated = jest.fn();

jest.mock('../pages/home', () => ({
  renderHomePage: () => mockRenderHomePage(),
}));

jest.mock('../pages/loginPage/login', () => ({
  renderLoginPage: () => mockRenderLoginPage(),
}));

jest.mock('../pages/cases', () => ({
  renderCasesPage: () => mockRenderCasesPage(),
}));

jest.mock('../pages/clients', () => ({
  renderClientsPage: () => mockRenderClientsPage(),
}));

jest.mock('../pages/myProfile', () => ({
  renderMyProfilePage: () => mockRenderMyProfilePage(),
}));

jest.mock('../pages/staff', () => ({
  renderStaffPage: () => mockRenderStaffPage(),
}));

jest.mock('../auth/auth', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  isAdmin: jest.fn().mockReturnValue(true),
}));

describe('resolveRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns login page for /login', () => {
    mockIsAuthenticated.mockReturnValue(true);

    const result = resolveRoute('/login');

    expect(mockRenderLoginPage).toHaveBeenCalledTimes(1);
    expect(result).toBe(loginEl);
  });

  test('returns specific pages when authenticated', () => {
    mockIsAuthenticated.mockReturnValue(true);

    expect(resolveRoute('/cases')).toBe(casesEl);
    expect(mockRenderCasesPage).toHaveBeenCalledTimes(1);

    expect(resolveRoute('/clients')).toBe(clientsEl);
    expect(mockRenderClientsPage).toHaveBeenCalledTimes(1);

    expect(resolveRoute('/myProfile')).toBe(myProfileEl);
    expect(mockRenderMyProfilePage).toHaveBeenCalledTimes(1);

    expect(resolveRoute('/staff')).toBe(staffEl);
    expect(mockRenderStaffPage).toHaveBeenCalledTimes(1);
  });

  test('falls back to home page for unknown route', () => {
    mockIsAuthenticated.mockReturnValue(true);

    const result = resolveRoute('/unknown-route');

    expect(mockRenderHomePage).toHaveBeenCalledTimes(1);
    expect(result).toBe(homeEl);
  });
});
