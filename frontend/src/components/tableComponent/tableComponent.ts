export function renderTable(data: Array<Record<string, unknown>>): HTMLElement {
  const tableContainer = document.createElement('div');
  tableContainer.classList.add('col-12');
  tableContainer.style.overflowX = 'hidden';

  const table = document.createElement('table');
  table.className = 'table table-striped table-hover align-middle mb-0 mt-4';
  table.classList.add('w-100');
  table.style.tableLayout = 'fixed';

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // If not array or no data
  if (!Array.isArray(data) || data.length === 0) {
    const missingData = document.createElement('div');
    missingData.innerHTML = 'No data found.';
    return missingData;
  }

  // Use the first data object to define column names
  const columnNames: string[] = [];
  for (const key of Object.keys(data[0])) {
    columnNames.push(key);
  }

  // Build header
  const headTr = document.createElement('tr');
  for (const [index, col] of columnNames.entries()) {
    const th = document.createElement('th');

    const formattedCol = col.replace(/_/g, ' ');
    th.textContent = formattedCol.charAt(0).toUpperCase() + formattedCol.slice(1);

    // hide columns after the 2nd one on small screens, show from md+
    if (index >= 2) {
      th.classList.add('d-none', 'd-md-table-cell');
    }

    headTr.appendChild(th);
  }
  thead.classList.add('table-dark');
  thead.appendChild(headTr);

  // Build rows
  for (const row of data) {
    const tr = document.createElement('tr');

    columnNames.forEach((col, index) => {
      const td = document.createElement('td');
      td.textContent = String((row as any)[col] ?? '');
      td.style.whiteSpace = 'normal';
      td.style.wordBreak = 'break-word';
      td.style.overflowWrap = 'anywhere';

      // Mirror the same responsive visibility classes as header
      if (index >= 2) {
        td.classList.add('d-none', 'd-md-table-cell');
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  return tableContainer;
}
