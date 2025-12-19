/**
 * @jest-environment jsdom
 */

import { renderTable } from './tableComponent';

describe('renderTable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns "No data found." element when data is empty', () => {
    const result = renderTable([]);

    expect(result.tagName.toLowerCase()).toBe('div');
    expect(result.textContent).toContain('No data found.');
  });

  test('builds a table with correct headers and rows', () => {
    const data = [
      { name: 'Alice', role: 'admin', status: 'active' },
      { name: 'Bob', role: 'staff', status: 'inactive' },
    ];

    const container = renderTable(data);
    document.body.appendChild(container);

    const table = container.querySelector('table') as HTMLTableElement | null;
    expect(table).not.toBeNull();

    const thead = table!.querySelector('thead') as HTMLTableSectionElement | null;
    const tbody = table!.querySelector('tbody') as HTMLTableSectionElement | null;
    expect(thead).not.toBeNull();
    expect(tbody).not.toBeNull();

    const headerCells = thead!.querySelectorAll('th');
    expect(headerCells.length).toBe(3);
    expect(headerCells[0].textContent).toBe('Name');
    expect(headerCells[1].textContent).toBe('Role');
    expect(headerCells[2].textContent).toBe('Status');

    const rows = tbody!.querySelectorAll('tr');
    expect(rows.length).toBe(2);

    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('Alice');
    expect(firstRowCells[1].textContent).toBe('admin');
    expect(firstRowCells[2].textContent).toBe('active');
  });

  test('applies responsive classes to columns after the second', () => {
    const data = [{ col1: 'a', col2: 'b', col3: 'c', col4: 'd' }];

    const container = renderTable(data);
    document.body.appendChild(container);

    const table = container.querySelector('table') as HTMLTableElement;
    const thead = table.querySelector('thead') as HTMLTableSectionElement;
    const tbody = table.querySelector('tbody') as HTMLTableSectionElement;

    const headerCells = thead.querySelectorAll('th');
    expect(headerCells.length).toBe(4);

    // first two visible, rest hidden on small screens
    expect(headerCells[0].classList.contains('d-none')).toBe(false);
    expect(headerCells[1].classList.contains('d-none')).toBe(false);
    expect(headerCells[2].classList.contains('d-none')).toBe(true);
    expect(headerCells[2].classList.contains('d-md-table-cell')).toBe(true);
    expect(headerCells[3].classList.contains('d-none')).toBe(true);
    expect(headerCells[3].classList.contains('d-md-table-cell')).toBe(true);

    const row = tbody.querySelector('tr') as HTMLTableRowElement;
    const cells = row.querySelectorAll('td');

    expect(cells[0].classList.contains('d-none')).toBe(false);
    expect(cells[1].classList.contains('d-none')).toBe(false);
    expect(cells[2].classList.contains('d-none')).toBe(true);
    expect(cells[2].classList.contains('d-md-table-cell')).toBe(true);
    expect(cells[3].classList.contains('d-none')).toBe(true);
    expect(cells[3].classList.contains('d-md-table-cell')).toBe(true);
  });

  test('formats header names by replacing underscores and capitalizing', () => {
    const data = [{ first_name: 'Alice', last_name: 'Smith' }];

    const container = renderTable(data);
    document.body.appendChild(container);

    const table = container.querySelector('table') as HTMLTableElement;
    const headerCells = table.querySelectorAll('thead th');

    expect(headerCells[0].textContent).toBe('First name');
    expect(headerCells[1].textContent).toBe('Last name');
  });
});
