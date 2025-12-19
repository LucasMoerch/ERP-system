/**
 * @jest-environment jsdom
 */

import { renderCard } from '../cardComponent';
import http from '../../../api/http';

jest.mock('../../../api/http');

const mockHttpPut = http.put as jest.Mock;

// Mocks for dependencies used inside renderCard
const mockLoadUsersAndClients = jest.fn();
const mockCreateCheckboxDropdown = jest.fn();
const mockNormalizeIdArray = jest.fn((v: any) => (Array.isArray(v) ? v : v ? [v] : []));
const mockFriendlyForValue = jest.fn((value: any, map: Map<string, string> | undefined) => '');
const mockShowCancelConfirmation = jest.fn();

jest.mock('../dataLoader', () => ({
  loadUsersAndClients: (...args: any[]) => mockLoadUsersAndClients(...args),
}));

jest.mock('../checkboxDropdown', () => ({
  createCheckboxDropdown: (...args: any[]) => mockCreateCheckboxDropdown(...args),
}));

jest.mock('../utils', () => ({
  normalizeIdArray: (value: any) => mockNormalizeIdArray(value),
  friendlyForValue: (value: any, map: Map<string, string> | undefined) =>
    mockFriendlyForValue(value, map),
}));

jest.mock('../../cancelPopUp/cancelPopUp', () => ({
  showCancelConfirmation: (...args: any[]) => mockShowCancelConfirmation(...args),
}));

describe('renderCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    (mockHttpPut as jest.Mock).mockReset();
    // default: any loadUsersAndClients call returns an empty result Promise
    (mockLoadUsersAndClients as jest.Mock).mockResolvedValue({
      users: [],
      clients: [],
    });
  });

  test('renders basic overlay and card structure', () => {
    const overlay = renderCard();

    expect(overlay.classList.contains('overlay')).toBe(true);
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');

    const card = overlay.querySelector('.card') as HTMLElement | null;
    const header = card?.querySelector('.header') as HTMLElement | null;
    const body = card?.querySelector('.body') as HTMLElement | null;

    expect(card).not.toBeNull();
    expect(header).not.toBeNull();
    expect(body).not.toBeNull();
  });

  test('adds invisible spacer button when edit is false', () => {
    const overlay = renderCard({ edit: false });
    const card = overlay.querySelector('.card') as HTMLElement;
    const header = card.querySelector('.header') as HTMLElement;

    const headerGroups = header.querySelectorAll('div.d-flex.align-items-center.gap-2');
    // first is left group, second is actions group
    expect(headerGroups.length).toBe(2);
    const headerActions = headerGroups[1] as HTMLElement;

    const spacer = headerActions.querySelector('button.invisible') as HTMLButtonElement | null;
    expect(spacer).not.toBeNull();
    expect(spacer!.querySelector('i.fa-pen-to-square')).not.toBeNull();
  });

  test('adds edit button and no spacer when edit is true', () => {
    const overlay = renderCard({ edit: true, endpoint: 'cases' });
    const card = overlay.querySelector('.card') as HTMLElement;
    const header = card.querySelector('.header') as HTMLElement;

    const headerGroups = header.querySelectorAll('div.d-flex.align-items-center.gap-2');
    expect(headerGroups.length).toBe(2);
    const headerActions = headerGroups[1] as HTMLElement;

    const spacer = headerActions.querySelector('button.invisible') as HTMLButtonElement | null;
    const editBtn = headerActions.querySelector('button.edit-button') as HTMLButtonElement | null;

    expect(spacer).toBeNull();
    expect(editBtn).not.toBeNull();
    expect(editBtn!.innerHTML).toContain('fa-pen-to-square');
  });

  test('close button removes overlay when there are no changes', () => {
    const overlay = renderCard();
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.card') as HTMLElement;
    const header = card.querySelector('.header') as HTMLElement;
    const closeBtn = header.querySelector('.back-button') as HTMLButtonElement;

    expect(document.body.contains(overlay)).toBe(true);

    closeBtn.click();

    expect(mockShowCancelConfirmation).not.toHaveBeenCalled();
    expect(document.body.contains(overlay)).toBe(false);
  });

  test('close button shows confirmation when hasChanges returns true', () => {
    const overlay = renderCard({
      hasChanges: () => true,
    });
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.card') as HTMLElement;
    const header = card.querySelector('.header') as HTMLElement;
    const closeBtn = header.querySelector('.back-button') as HTMLButtonElement;

    closeBtn.click();

    expect(mockShowCancelConfirmation).toHaveBeenCalledTimes(1);
    expect(mockShowCancelConfirmation).toHaveBeenCalledWith(overlay);
    expect(document.body.contains(overlay)).toBe(true);
  });

  test('clicking outside card triggers same close/confirm logic', () => {
    const overlay = renderCard({
      hasChanges: () => true,
    });
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.card') as HTMLElement;
    const clickEvent = new MouseEvent('click', { bubbles: true });

    // dispatch click on overlay, but not on card
    overlay.dispatchEvent(clickEvent);

    expect(mockShowCancelConfirmation).toHaveBeenCalledTimes(1);
    expect(mockShowCancelConfirmation).toHaveBeenCalledWith(overlay);

    // clicking inside card should not trigger
    mockShowCancelConfirmation.mockClear();
    const innerClick = new MouseEvent('click', { bubbles: true });
    card.dispatchEvent(innerClick);
    expect(mockShowCancelConfirmation).not.toHaveBeenCalled();
  });

  test('edit click switches to save button and sends PUT with updated fields', async () => {
    (mockHttpPut as jest.Mock).mockResolvedValue({});

    const overlay = renderCard({
      edit: true,
      endpoint: 'cases',
      data: {
        id: 'case-1',
        title: 'Old title',
      },
    });
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.card') as HTMLElement;
    const header = card.querySelector('.header') as HTMLElement;
    const headerGroups = header.querySelectorAll('div.d-flex.align-items-center.gap-2');
    const headerActions = headerGroups[1] as HTMLElement;
    const editBtn = headerActions.querySelector('.edit-button') as HTMLButtonElement;

    // simulate info-row/title DOM so edit mode will find something to turn into input
    const body = card.querySelector('.body') as HTMLElement;
    const row = document.createElement('div');
    row.className = 'info-row';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'value fw-semibold text-end';
    valueSpan.dataset.field = 'title';
    valueSpan.textContent = 'Old title';
    row.appendChild(valueSpan);
    body.appendChild(row);

    // enter edit mode
    await editBtn.click();

    const input = valueSpan.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('Old title');

    // change value
    input.value = 'New title';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const saveBtn = headerActions.querySelector('button.btn-primary') as HTMLButtonElement;
    expect(saveBtn).not.toBeNull();

    await saveBtn.click();

    expect(mockHttpPut).toHaveBeenCalledTimes(1);
    expect(mockHttpPut).toHaveBeenCalledWith('/cases/case-1', {
      id: 'case-1',
      title: 'New title',
    });
  });
});
