import { renderTable } from '../components/tableComponent/tableComponent';
import { renderSearchComponent } from '../components/searchBar/searchBar';
import { renderCard } from '../components/cardComponent/cardComponent';
import http from '../api/http';
import { renderTabs } from '../components/tabsComponent/tabsComponent';

export type CaseDto = {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'ON_HOLD' | 'CLOSED';
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
};

// InspectCase - matches the style/behavior of inspectUser
export function inspectCase(c: CaseDto): HTMLElement {
  const overlay: HTMLElement = renderCard({ edit: true, endpoint: 'cases', data: c });
  const card: HTMLElement = overlay.querySelector('.card') as HTMLElement;
  const header: HTMLElement = card.querySelector('.header') as HTMLElement;
  const body: HTMLElement = card.querySelector('.body') as HTMLElement;

  header.innerText = c.title;

  // Body markup
  if (body) {
    body.innerHTML = `
        <div class="card profile-card w-100 shadow-sm border-0">
          <div class="card-body fs-5">
            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Case ID</span>
              <span class="value fw-semibold" data-field="id" data-editable="false">${c.id}</span>
            </div>
            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Title</span>
              <span class="value fw-semibold" data-field="title">${c.title}</span>
            </div>

            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Client</span>
              <span
                class="value dropdown fw-semibold"
                data-field="clientId"
                data-client-id="${c.clientId ?? ''}"
              >
                ${c.clientId ? c.clientId : 'None'}
              </span>            </div>
            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Status</span>
              <span class="value dropdown fw-semibold" data-field="status" data-options="OPEN,ON_HOLD,CLOSED">${c.status}</span>
            </div>

            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Assigned Users</span>
              <span
                class="value dropdown fw-semibold"
                data-field="assignedUsers"
                data-assigned-ids='${JSON.stringify(c.assignedUserIds ?? [])}'
              >
                ${c.assignedUserIds && c.assignedUserIds.length ? c.assignedUserIds.join(', ') : 'None'}
              </span>
            </div>

            <div class="info-row d-flex justify-content-between border-bottom py-3">
              <span class="label text-muted fw-medium">Created</span>
              <span class="value fw-semibold" data-field="createdAt" data-editable="false">${new Date(c.createdAt).toLocaleString('da-DK')}</span>
            </div>

            <div class="info-row d-flex justify-content-between py-3">
              <span class="label text-muted fw-medium">Last Updated</span>
              <span class="value fw-semibold" data-field="updatedAt" data-editable="false">${new Date(c.updatedAt).toLocaleString('da-DK')}</span>
            </div>
          </div>
        </div>
      `;
  }
  card.appendChild(
    renderTabs({ entityType: 'cases', entityId: c.id, description: c.description || '' }),
  );

  return overlay;
}

export function renderCasesPage(): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = `<h1>Cases Overview</h1>`;

  const container = document.createElement('div');
  container.classList.add('container', 'cases-page');
  container.appendChild(div);

  const searchEl = renderSearchComponent((query) => {
    const rows = realDataSection.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // skip header
      const titleCell = row.querySelector('td:first-child'); // assuming title is first column
      row.style.display = titleCell?.textContent?.toLowerCase().includes(query) ? '' : 'none';
    });
  });
  container.appendChild(searchEl);

  const realDataSection = document.createElement('div');
  realDataSection.innerHTML = `<p>Loading...</p>`;
  container.appendChild(realDataSection);

  async function loadCases() {
    try {
      const cases = (await http.get('/cases')) as CaseDto[];

      const caseData = (cases ?? []).map((c) => ({
        address: c.title || 'Untitled',
        status: c.status || 'UNKNOWN',
        Date_Created: new Date(c.createdAt).toLocaleDateString('da-DK'),
      }));

      // clear loading...
      realDataSection.innerHTML = '';

      // render table and append
      const tableElement = renderTable(caseData);
      realDataSection.appendChild(tableElement);

      // make rows clickable like InspectUser
      const rows = tableElement.querySelectorAll('tr');
      rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;

        //Add color coding to status column
        // Status column is the second cell
        const statusCell = row.querySelectorAll('td')[1] as HTMLTableCellElement | undefined;

        switch (statusCell?.textContent) {
          case 'CLOSED':
            statusCell.classList.add('text-danger');
            break;
          case 'OPEN':
            statusCell.classList.add('text-success');
            break;
          case 'ON_HOLD':
            statusCell.classList.add('text-warning');
            statusCell.innerText = 'ON HOLD';
            break;

          default:
            break;
        }

        row.addEventListener('click', (): void => {
          const selectedCase = cases[index - 1]; // match index with case
          const popup = inspectCase(selectedCase);
          document.body.appendChild(popup);
          console.log('case clicked', selectedCase.id);
        });
      });
    } catch (err) {
      console.error('Failed to load cases:', err);
      realDataSection.innerHTML = '<p>Failed to load case data.</p>';
    }
  }

  // initial load
  loadCases();
  (container as any).reload = loadCases;

  return container;
}
