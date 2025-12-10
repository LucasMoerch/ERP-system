/**
 * @jest-environment jsdom
 */

import { renderHomePage } from '../home';
import type { CaseDto } from '../cases';

const mockHttpGet = jest.fn();
const mockRenderAddNewCaseCard = jest.fn();
const mockInspectCase = jest.fn();

jest.mock('../../api/http', () => ({
  __esModule: true,
  default: {
    get: (url: string) => mockHttpGet(url),
  },
}));

jest.mock('../../auth/auth', () => ({
  __esModule: true,
  isAdmin: jest.fn().mockReturnValue(true),
  userId: jest.fn().mockReturnValue('user-1'),
}));

jest.mock('../../components/newCard/addNewCaseCard', () => ({
  renderAddNewCaseCard: () => mockRenderAddNewCaseCard(),
}));

jest.mock('../cases', () => {
  const actual = jest.requireActual('../cases');
  return {
    __esModule: true,
    ...actual,
    inspectCase: (c: CaseDto) => mockInspectCase(c),
  };
});

describe('renderHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('renders static cards and calls /cases', async () => {
    mockHttpGet.mockResolvedValueOnce([]);

    const page = renderHomePage();
    document.body.appendChild(page);

    // page IS the .home-container element
    expect(page.classList.contains('home-container')).toBe(true);
    expect(page.querySelector('.cards-container')).not.toBeNull();
    expect(mockHttpGet).toHaveBeenCalledWith('/cases');

    await Promise.resolve();
    await Promise.resolve();

    const activeButtons = page.querySelectorAll(
      '.d-flex.flex-wrap.justify-content-between.align-items-start.w-100.mt-3 button',
    );
    expect(activeButtons.length).toBe(0);
  });

  test('clicking create_new opens new case card', () => {
    mockHttpGet.mockResolvedValueOnce([]);

    const overlay = document.createElement('div');
    overlay.className = 'new-case-overlay';
    mockRenderAddNewCaseCard.mockReturnValue(overlay);

    const page = renderHomePage();
    document.body.appendChild(page);

    const createBtn = page.querySelector('.create-new-container button') as HTMLButtonElement;
    expect(createBtn).not.toBeNull();

    createBtn.click();

    expect(mockRenderAddNewCaseCard).toHaveBeenCalledTimes(1);
    expect(document.body.contains(overlay)).toBe(true);
  });

  test('renders active OPEN cases as buttons and clicking opens inspectCase', async () => {
    const cases: CaseDto[] = [
      {
        id: 'case-open',
        clientId: 'client-1',
        title: 'Open Case',
        description: 'Desc',
        status: 'OPEN',
        assignedUserIds: [],
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:00.000Z',
      },
      {
        id: 'case-closed',
        clientId: 'client-2',
        title: 'Closed Case',
        description: 'Desc2',
        status: 'CLOSED',
        assignedUserIds: [],
        createdAt: '2025-01-02T12:00:00.000Z',
        updatedAt: '2025-01-02T12:00:00.000Z',
      },
    ];
    mockHttpGet.mockResolvedValueOnce(cases);

    const popup = document.createElement('div');
    popup.className = 'case-popup';
    mockInspectCase.mockReturnValue(popup);

    const page = renderHomePage();
    document.body.appendChild(page);

    await Promise.resolve();
    await Promise.resolve();

    const activeContainer = page.querySelector(
      '.d-flex.flex-wrap.justify-content-between.align-items-start.w-100.mt-3',
    ) as HTMLElement;
    const buttons = activeContainer.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Open Case');

    buttons[0].click();

    expect(mockInspectCase).toHaveBeenCalledWith(cases[0]);
    expect(document.body.contains(popup)).toBe(true);
  });
});
