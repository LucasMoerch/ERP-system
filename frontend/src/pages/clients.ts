import { renderSearchComponent } from '../components/searchBar/searchBar';
import { renderTable } from '../components/tableComponent/tableComponent';
import { renderCard } from '../components/cardComponent/cardComponent';
import { renderTabs } from '../components/tabsComponent/tabsComponent';
import http from '../api/http';
import { isAdmin } from '../auth/auth';

export type ClientDTO = {
  id: string;
  name: string;
  contactPhone?: string;
  contactEmail?: string;
};

export function renderClientsPage(): HTMLElement {
  const container = document.createElement('div');
  container.classList.add('container', 'clients-page');

  const header = document.createElement('h1');
  header.textContent = 'Clients Overview';
  container.appendChild(header);

  const searchEl = renderSearchComponent((query) => {
    const rows = realDataSection.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // skip header
      const nameCell = row.querySelector('td:first-child'); // Searches first column
      row.style.display = nameCell?.textContent?.toLowerCase().includes(query) ? '' : 'none';
    });
  });
  container.appendChild(searchEl);

  const realDataSection = document.createElement('div');
  realDataSection.innerHTML = '<p>Loading...</p>';
  container.appendChild(realDataSection);

  // Fetch clients from backend
  async function loadClients() {
    try {
      const clients = (await http.get('/clients')) as ClientDTO[];

      const clientData = (clients ?? []).map((c) => ({
        name: c.name,
        phone: c.contactPhone || 'N/A',
        email: c.contactEmail || 'N/A',
      }));

      realDataSection.innerHTML = '';
      const tableElement = renderTable(clientData);
      realDataSection.appendChild(tableElement);

      // Clickable rows like InspectUser / InspectCase
      const rows = tableElement.querySelectorAll('tr');
      rows.forEach((row, index) => {
        if (index === 0) return; // skip header
        row.addEventListener('click', () => {
          const client = clients[index - 1];
          const popup = inspectClient(client);
          document.body.appendChild(popup);
          console.log('client clicked');
        });
      });
    } catch (err) {
      console.error('Failed to load clients:', err);
      realDataSection.innerHTML = '<p class="text-danger">Failed to load clients.</p>';
    }
  }

  // Inspect Client popup — same layout as InspectUser
  function inspectClient(client: ClientDTO): HTMLElement {
    const overlay = renderCard({ edit: true, endpoint: 'clients', data: client });
    const card: HTMLElement = overlay.querySelector('.card') as HTMLElement;
    const headerEl: HTMLElement = card.querySelector('.header') as HTMLElement;
    const titleEl: HTMLElement = headerEl.querySelector('h2') as HTMLElement;
    const body: HTMLElement = card.querySelector('.body') as HTMLElement;

    const backButton = overlay.querySelector('.closeBtn');
    if (backButton) backButton.remove();

    titleEl.innerText = client.name;

    const back = headerEl.querySelector('.exit-button');
    back?.addEventListener('click', () => overlay.remove());

    // Body info like InspectUser
    body.innerHTML = `
      <div class="card profile-card w-100 shadow-sm border-0">
        <div class="card-body fs-5">
          <div class="info-row d-flex justify-content-between border-bottom py-3">
            <span class="label text-muted fw-medium">Name</span>
            <span class="value fw-semibold" data-field="name">${client.name}</span>
          </div>
          <div class="info-row d-flex justify-content-between border-bottom py-3">
            <span class="label text-muted fw-medium">Phone</span>
            <span class="value fw-semibold" data-field="contactPhone">${client.contactPhone || 'N/A'}</span>
          </div>
          <div class="info-row d-flex justify-content-between border-bottom py-3">
            <span class="label text-muted fw-medium">Email</span>
            <span class="value fw-semibold" data-field="contactEmail">${client.contactEmail || 'N/A'}</span>
          </div>
        </div>
      </div>
    `;
    card.appendChild(body);
    card.appendChild(renderTabs({ entityType: 'clients', entityId: client.id }));

    // Delete button for admins
    if (isAdmin()) {
      const footer = document.createElement('div');
      footer.className = 'd-flex justify-content-end gap-2 p-3';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-outline-danger delete-client-button';
      deleteBtn.innerText = 'Delete client';

      deleteBtn.addEventListener('click', async () => {
        const confirmed = window.confirm(
          `Are you sure you want to permanently delete client "${client.name}"?`,
        );
        if (!confirmed) return;

        try {
          await http.delete(`/clients/${client.id}`);
          overlay.remove();

          const clientsPage = document.querySelector('.clients-page') as any;
          if (clientsPage?.reload) clientsPage.reload();
        } catch (err) {
          console.error('Failed to delete client', err);
          alert('Failed to delete client. Please try again.');
        }
      });

      footer.appendChild(deleteBtn);
      card.appendChild(footer);
    }

    return overlay;
  }

  loadClients();
  (container as any).reload = loadClients;
  return container;
}
