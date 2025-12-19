/**
 * @jest-environment jsdom
 */

import { renderStaffPage, UserDTO } from '../staff';

const mockRenderSearchComponent = jest.fn();
const mockRenderTable = jest.fn();
const mockRenderCard = jest.fn();
const mockRenderTabs = jest.fn();
const mockRenderNewButton = jest.fn();
const mockRenderAddNewStaffCard = jest.fn();
const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();
const mockIsAdmin = jest.fn();

jest.mock('../../components/searchBar/searchBar', () => ({
  renderSearchComponent: (onSearch: (q: string) => void) => {
    const el = document.createElement('div');
    el.id = 'search-component-staff';
    (el as any)._onSearch = onSearch;
    mockRenderSearchComponent(onSearch);
    return el;
  },
}));

jest.mock('../../components/tableComponent/tableComponent', () => ({
  renderTable: (data: any[]) => mockRenderTable(data),
}));

jest.mock('../../components/cardComponent/cardComponent', () => ({
  renderCard: (opts: any) => mockRenderCard(opts),
}));

jest.mock('../../components/tabsComponent/tabsComponent', () => ({
  renderTabs: (opts: any) => mockRenderTabs(opts),
}));

jest.mock('../../components/newButton/newButton', () => ({
  renderNewButton: () => mockRenderNewButton(),
}));

jest.mock('../../components/newCard/addNewStaffCard', () => ({
  renderAddNewStaffCard: (handleInvite: any) => mockRenderAddNewStaffCard(handleInvite),
}));

jest.mock('../../api/http', () => ({
  __esModule: true,
  default: {
    get: (url: string) => mockHttpGet(url),
    post: (url: string, data: any) => mockHttpPost(url, data),
  },
}));

jest.mock('../../auth/auth', () => ({
  isAdmin: () => mockIsAdmin(),
}));

describe('renderStaffPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('renders header, search, and loads staff table', async () => {
    mockIsAdmin.mockReturnValue(false);

    const tableEl = document.createElement('table');
    mockRenderTable.mockReturnValue(tableEl);

    const users: UserDTO[] = [
      {
        id: 'u1',
        roles: ['staff'],
        status: 'active',
        auth: {
          provider: 'google',
          email: 'user@example.com',
          emailVerified: true,
        },
        profile: {
          displayName: 'User One',
        },
        audit: null,
      },
    ];
    mockHttpGet.mockResolvedValueOnce(users);

    const page = renderStaffPage();
    document.body.appendChild(page);

    expect(page.querySelector('h1')?.textContent).toContain('Staff page');
    expect(mockHttpGet).toHaveBeenCalledWith('/users');

    await Promise.resolve();
    await Promise.resolve();

    expect(mockRenderTable).toHaveBeenCalledWith([
      {
        name: 'User One',
        role: 'staff',
        status: 'active',
        email: 'user@example.com',
      },
    ]);
    expect(page.querySelector('table')).toBe(tableEl);
  });

  test('row click opens inspectUser popup', async () => {
    mockIsAdmin.mockReturnValue(false);

    const tableEl = document.createElement('table');
    const headerRow = document.createElement('tr');
    tableEl.appendChild(headerRow);

    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = 'User One';
    row.appendChild(nameCell);
    tableEl.appendChild(row);

    mockRenderTable.mockReturnValue(tableEl);

    const users: UserDTO[] = [
      {
        id: 'u1',
        roles: ['staff'],
        status: 'active',
        auth: {
          provider: 'google',
          email: 'user@example.com',
          emailVerified: true,
        },
        profile: {
          displayName: 'User One',
          phone: '123',
        },
        audit: null,
      },
    ];
    mockHttpGet.mockResolvedValueOnce(users);

    const overlay = document.createElement('div');
    overlay.className = 'user-overlay';
    const card = document.createElement('div');
    card.className = 'card';
    const headerEl = document.createElement('div');
    headerEl.className = 'header';
    const bodyEl = document.createElement('div');
    bodyEl.className = 'body';
    card.appendChild(headerEl);
    card.appendChild(bodyEl);
    overlay.appendChild(card);

    mockRenderCard.mockReturnValue(overlay);
    mockRenderTabs.mockReturnValue(document.createElement('div'));

    const page = renderStaffPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    row.click();

    expect(document.body.contains(overlay)).toBe(true);
    expect(overlay.textContent).toContain('User One');
  });

  test('handles /users failure by showing error message', async () => {
    mockIsAdmin.mockReturnValue(false);
    mockHttpGet.mockRejectedValueOnce(new Error('Network error'));

    const page = renderStaffPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    const errorP = page.querySelector('p');
    expect(errorP?.textContent).toContain('Failed to load staff data.');
  });
});
