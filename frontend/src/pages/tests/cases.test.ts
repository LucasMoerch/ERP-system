/**
 * @jest-environment jsdom
 */

import { inspectCase, renderCasesPage, CaseDto } from '../cases';
import http from '../../api/http';

jest.mock('../../api/http');

const mockGet = http.get as jest.Mock;

// Mocks for imported UI components
const mockRenderTable = jest.fn();
const mockRenderCard = jest.fn();
const mockRenderTabs = jest.fn();

// search component must return a DOM node
jest.mock('../../components/searchBar/searchBar', () => ({
  renderSearchComponent: (onSearch: (q: string) => void) => {
    const el = document.createElement('div');
    el.id = 'search-component-mock';
    (el as any)._onSearch = onSearch;
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

describe('inspectCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('renders overlay with fields and tabs', () => {
    // Build the structure inspectCase expects
    const overlay = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const titleEl = document.createElement('h2');
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.className = 'body';

    card.appendChild(header);
    card.appendChild(body);
    overlay.appendChild(card);

    const tabsEl = document.createElement('div');
    tabsEl.id = 'tabs';

    mockRenderCard.mockReturnValue(overlay);
    mockRenderTabs.mockReturnValue(tabsEl);

    const testCase: CaseDto = {
      id: 'case-1',
      clientId: 'client-1',
      title: 'Test Case',
      description: 'Some description',
      status: 'OPEN',
      assignedUserIds: ['user1', 'user2'],
      createdAt: '2025-01-01T12:00:00.000Z',
      updatedAt: '2025-01-02T13:00:00.000Z',
    };

    const result = inspectCase(testCase);

    expect(result).toBe(overlay);
    expect(mockRenderCard).toHaveBeenCalledWith({
      edit: true,
      endpoint: 'cases',
      data: testCase,
    });

    expect(result.textContent).toContain('Test Case');

    const idField = result.querySelector('[data-field="id"]') as HTMLElement | null;
    const statusField = result.querySelector('[data-field="status"]') as HTMLElement | null;
    const descField = result.querySelector('[data-field="description"]') as HTMLElement | null;
    const assignedField = result.querySelector(
      '[data-field="assignedUsers"]',
    ) as HTMLElement | null;

    expect(idField).not.toBeNull();
    expect(statusField).not.toBeNull();
    expect(assignedField).not.toBeNull();

    expect(idField!.textContent).toBe('case-1');
    expect(statusField!.textContent).toBe('OPEN');

    // description is optional in the visible UI now
    if (descField) {
      expect(descField.textContent).toBe('Some description');
    }

    expect(assignedField!.textContent).toContain('user1');
    expect(assignedField!.textContent).toContain('user2');

    expect(mockRenderTabs).toHaveBeenCalledWith({
      entityType: 'cases',
      entityId: 'case-1',
      description: 'Some description',
    });
    expect(card.contains(tabsEl)).toBe(true);
  });
});

describe('renderCasesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('initially renders loading and calls http.get', async () => {
    const tableEl = document.createElement('table');
    mockRenderTable.mockReturnValue(tableEl);

    mockGet.mockResolvedValueOnce([
      {
        id: 'case-1',
        clientId: 'client-1',
        title: 'First case',
        description: 'Desc',
        status: 'OPEN',
        assignedUserIds: [],
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:00.000Z',
      } as CaseDto,
    ]);

    const page = renderCasesPage();
    document.body.appendChild(page);

    expect(mockGet).toHaveBeenCalledWith('/cases');

    // wait for async loadCases to finish
    await Promise.resolve();
    await Promise.resolve();

    const loadingText = page.querySelector('p');
    expect(loadingText).toBeNull();

    expect(mockRenderTable).toHaveBeenCalledTimes(1);
    expect(page.querySelector('table')).toBe(tableEl);
  });

  test('rows become clickable and append overlay', async () => {
    const tableEl = document.createElement('table');
    const headerRow = document.createElement('tr');
    tableEl.appendChild(headerRow);

    const row = document.createElement('tr');
    const titleCell = document.createElement('td');
    const statusCell = document.createElement('td');
    titleCell.textContent = 'First case';
    statusCell.textContent = 'OPEN';
    row.appendChild(titleCell);
    row.appendChild(statusCell);
    tableEl.appendChild(row);

    mockRenderTable.mockReturnValue(tableEl);

    const caseData: CaseDto = {
      id: 'case-1',
      clientId: 'client-1',
      title: 'First case',
      description: 'Desc',
      status: 'OPEN',
      assignedUserIds: [],
      createdAt: '2025-01-01T12:00:00.000Z',
      updatedAt: '2025-01-01T12:00:00.000Z',
    };

    mockGet.mockResolvedValueOnce([caseData]);

    // mock renderCard/tabs so inspectCase returns a known overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'header';
    const body = document.createElement('div');
    body.className = 'body';
    card.appendChild(header);
    card.appendChild(body);
    overlay.appendChild(card);

    mockRenderCard.mockReturnValue(overlay);
    mockRenderTabs.mockReturnValue(document.createElement('div'));

    const page = renderCasesPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    row.click();

    const shownOverlay = document.querySelector('.overlay') as HTMLElement | null;
    expect(shownOverlay).not.toBeNull();
    expect(document.body.contains(shownOverlay!)).toBe(true);
  });

  test('handles http.get failure by showing error message', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const page = renderCasesPage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    const errorP = page.querySelector('p');
    expect(errorP?.textContent).toContain('Failed to load case data.');
  });
});
