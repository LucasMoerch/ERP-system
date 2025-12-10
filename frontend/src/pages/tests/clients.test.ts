/**
 * @jest-environment jsdom
 */

import { renderClientsPage, ClientDTO } from '../clients';
import http from '../../api/http';
jest.mock('../../api/http');

const mockGet = http.get as jest.Mock;

const mockRenderSearchComponent = jest.fn();
const mockRenderTable = jest.fn();
const mockRenderCard = jest.fn();
const mockRenderTabs = jest.fn();

jest.mock('../../components/searchBar/searchBar', () => ({
  renderSearchComponent: (onSearch: (q: string) => void) => {
    const el = document.createElement('div');
    el.id = 'search-component-clients';
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

describe('renderClientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('renders header, search, and loads clients into table', async () => {
    const tableEl = document.createElement('table');
    mockRenderTable.mockReturnValue(tableEl);

    mockGet.mockResolvedValueOnce([
      {
        id: '1',
        name: 'Acme Corp',
        contactPhone: '123',
        contactEmail: 'test@example.com',
      },
    ]);

    const page = renderClientsPage();
    document.body.appendChild(page);

    expect(page.querySelector('h1')?.textContent).toContain('Clients Overview');
    expect(mockGet).toHaveBeenCalledWith('/clients');

    await Promise.resolve();
    await Promise.resolve();

    expect(mockRenderTable).toHaveBeenCalledWith([
      {
        name: 'Acme Corp',
        phone: '123',
        email: 'test@example.com',
      },
    ]);
    expect(page.querySelector('table')).toBe(tableEl);
  });

  test('search filters rows by name', async () => {
    const tableEl = document.createElement('table');

    const headerRow = document.createElement('tr');
    tableEl.appendChild(headerRow);

    const row1 = document.createElement('tr');
    const name1 = document.createElement('td');
    name1.textContent = 'Acme Corp';
    row1.appendChild(name1);
    tableEl.appendChild(row1);

    const row2 = document.createElement('tr');
    const name2 = document.createElement('td');
    name2.textContent = 'Other Client';
    row2.appendChild(name2);
    tableEl.appendChild(row2);

    mockRenderTable.mockReturnValue(tableEl);
    mockGet.mockResolvedValueOnce([
      { id: 'c1', name: 'Acme Corp' } as ClientDTO,
      { id: 'c2', name: 'Other Client' } as ClientDTO,
    ]);

    const page = renderClientsPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    const searchEl = page.querySelector('#search-component-clients') as any;
    const onSearch = searchEl._onSearch as (q: string) => void;

    onSearch('acme');

    expect(row1.style.display).toBe('');
    expect(row2.style.display).toBe('none');
  });

  test('row click opens client inspect popup', async () => {
    const tableEl = document.createElement('table');
    const headerRow = document.createElement('tr');
    tableEl.appendChild(headerRow);

    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = 'Acme Corp';
    row.appendChild(nameCell);
    tableEl.appendChild(row);

    mockRenderTable.mockReturnValue(tableEl);

    const clients: ClientDTO[] = [
      {
        id: 'c1',
        name: 'Acme Corp',
        contactPhone: '123',
        contactEmail: 'test@example.com',
      },
    ];
    mockGet.mockResolvedValueOnce(clients);

    const overlay = document.createElement('div');
    overlay.className = 'overlay client-overlay';
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

    const page = renderClientsPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    row.click();

    const shownOverlay = document.querySelector('.overlay') as HTMLElement | null;
    expect(shownOverlay).not.toBeNull();
    expect(document.body.contains(shownOverlay!)).toBe(true);
    expect(shownOverlay!.textContent).toContain('Acme Corp');

    expect(document.body.contains(overlay)).toBe(true);
    expect(overlay.textContent).toContain('Acme Corp');
  });

  test('handles http.get failure by showing error message', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const page = renderClientsPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    const errorP = page.querySelector('p.text-danger');
    expect(errorP?.textContent).toContain('Failed to load clients.');
  });
});
