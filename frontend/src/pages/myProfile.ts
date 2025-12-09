import { getMe } from '../auth/auth';
import http from '../api/http';
import { loadTimeEntries } from '../components/tabsComponent/timeTab';
import { loadFiles } from '../components/tabsComponent/fileTab';

export function renderMyProfilePage(): HTMLElement {
  const me = getMe();
  if (!me) {
    const fallback = document.createElement('div');
    fallback.className = 'container py-4';
    fallback.innerHTML = '<p class="text-muted">No profile data available.</p>';
    return fallback;
  }

  const container = document.createElement('div');
  container.className = 'container my-profile-page py-4';

  const title = document.createElement('h1');
  title.className = 'mb-4';
  title.textContent = 'My Profile';
  container.appendChild(title);

  const row = document.createElement('div');
  row.className = 'row g-4';
  container.appendChild(row);

  // Profile card
  const profileCol = document.createElement('div');
  profileCol.className = 'col-12 col-lg-4';

  const profileCard = document.createElement('div');
  profileCard.className = 'card profile-card shadow-sm border-0 h-100';

  const profileBody = document.createElement('div');
  profileBody.className = 'card-body fs-6';

  profileBody.innerHTML = `
    <div class="d-flex align-items-center mb-4 gap-3">
      <img
        src="${me.pictureUrl || ''}"
        alt="Profile picture"
        class="rounded-circle border"
        style="width: 64px; height: 64px; object-fit: cover;"
      />
      <div>
        <div class="fw-semibold fs-5">${me.displayName || 'No name'}</div>
        <div class="text-muted small">${me.email || ''}</div>
      </div>
    </div>

    <div class="info-row d-flex justify-content-between border-bottom py-2">
      <span class="label text-muted fw-medium">First name</span>
      <span class="value fw-semibold">${me.firstName || 'N/A'}</span>
    </div>
    <div class="info-row d-flex justify-content-between border-bottom py-2">
      <span class="label text-muted fw-medium">Last name</span>
      <span class="value fw-semibold">${me.lastName || 'N/A'}</span>
    </div>
    <div class="info-row d-flex justify-content-between border-bottom py-2">
      <span class="label text-muted fw-medium">CPR</span>
      <span class="value fw-semibold text-end">${me.cpr || 'N/A'}</span>
    </div>
    <div class="info-row d-flex justify-content-between border-bottom py-2">
      <span class="label text-muted fw-medium">Phone</span>
      <span class="value fw-semibold text-end">${me.phoneNumber || 'N/A'}</span>
    </div>
    <div class="info-row d-flex justify-content-between border-bottom py-2">
      <span class="label text-muted fw-medium">Address</span>
      <span class="value fw-semibold text-end">${me.address || 'N/A'}</span>
    </div>
    <div class="info-row d-flex justify-content-between py-2">
      <span class="label text-muted fw-medium">Status</span>
      <span class="value fw-semibold">${me.status || 'N/A'}</span>
    </div>
  `;

  const profileFooter = document.createElement('div');
  profileFooter.className = 'card-footer bg-transparent border-0 pt-0 d-flex justify-content-end';

  const editButton = document.createElement('button');
  editButton.className = 'btn btn-outline-primary btn-sm';
  editButton.textContent = 'Edit';

  editButton.addEventListener('click', () => {
    const infoRows = profileBody.querySelectorAll('.info-row');
    infoRows.forEach((row) => {
      const valueSpan = row.querySelector('.value') as HTMLElement | null;
      if (!valueSpan) return;
      if (!valueSpan.querySelector('input')) {
        const currentValue = valueSpan.textContent?.trim() || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.className = 'form-control text-end fw-semibold';
        valueSpan.textContent = '';
        valueSpan.appendChild(input);
      }
    });
  });

  profileFooter.appendChild(editButton);
  profileCard.appendChild(profileBody);
  profileCard.appendChild(profileFooter);
  profileCol.appendChild(profileCard);
  row.appendChild(profileCol);

  // Time registrations card
  const timeCol = document.createElement('div');
  timeCol.className = 'col-12 col-lg-4';

  const timeCard = document.createElement('div');
  timeCard.className = 'card shadow-sm border-0 h-100';

  const timeBody = document.createElement('div');
  timeBody.className = 'card-body';

  const timeRegistrations = document.createElement('div');
  timeRegistrations.id = 'time-registrations';
  timeRegistrations.innerHTML = `
    <h5 class="card-title">My Time Registrations</h5>
    <div id="times-content" class="mt-3"></div>
  `;

  timeBody.appendChild(timeRegistrations);
  timeCard.appendChild(timeBody);
  timeCol.appendChild(timeCard);
  row.appendChild(timeCol);

  // Documents card
  const docsCol = document.createElement('div');
  docsCol.className = 'col-12 col-lg-4';

  const docsCard = document.createElement('div');
  docsCard.className = 'card shadow-sm border-0 h-100';

  const docsBody = document.createElement('div');
  docsBody.className = 'card-body';

  const documents = document.createElement('div');
  documents.id = 'files';
  documents.innerHTML = `
    <h5 class="card-title">My documents</h5>
    <div id="files-content" class="mt-3"></div>
  `;

  docsBody.appendChild(documents);
  docsCard.appendChild(docsBody);
  docsCol.appendChild(docsCard);
  row.appendChild(docsCol);

  // Load time entries and files
  if (me.id) {
    loadTimeEntries({
      entityType: 'users',
      entityId: me.id,
      container: timeRegistrations,
    });
    loadFiles({ entityType: 'users', entityId: me.id.toString(), container: documents });
  }

  return container;
}
