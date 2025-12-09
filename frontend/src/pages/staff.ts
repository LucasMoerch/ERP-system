import './pageStyles/staff.scss';
import { renderTable } from '../components/tableComponent/tableComponent';
import { renderSearchComponent } from '../components/searchBar/searchBar';
import { renderCard } from '../components/cardComponent/cardComponent';
import { isAdmin } from '../auth/auth';
import http from '../api/http';
import { renderTabs } from '../components/tabsComponent/tabsComponent';
import { renderNewButton } from '../components/newButton/newButton';
import { renderAddNewStaffCard } from '../components/newCard/addNewStaffCard';

export type UserRole = 'staff' | 'admin';
export type UserStatus = 'invited' | 'active' | 'disabled';

export type UserDTO = {
  id: string;
  roles: UserRole[];
  status: UserStatus;
  auth: {
    provider: 'google';
    email: string;
    emailVerified: boolean;
    pictureUrl?: string | null; // optional on some users
  };

  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    phone?: string | null;
    address?: string | null;
    cpr?: string | null;
  } | null;

  audit?: {
    createdAt?: string | null; // ISO strings from API
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  } | null;
};

export type InvitePayload = {
  email: string;
  roles: UserRole[];
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  address?: string;
  cpr?: string;
};

/**
 * @param payload All invite data (email, roles, and optional profile fields).
 * @returns The UserDTO object returned by the server.
 */
async function inviteUser(payload: InvitePayload): Promise<UserDTO> {
  const url = '/admin/invite';
  const response = (await http.post(url, payload)) as UserDTO;
  return response;
}

function setupInvitationHandler(realDataSection: HTMLElement) {
  const handleInvite = async (payload: InvitePayload) => {
    try {
      if (!payload.email || !payload.roles || payload.roles.length === 0) {
        alert('Please provide both email and role.');
        return false;
      }

      const newUser = await inviteUser(payload);
      alert(
        `Invitation sent successfully to ${newUser.auth.email} with role(s): ${newUser.roles.join(
          ', ',
        )}`,
      );

      loadStaff(realDataSection);
      return true;
    } catch (err) {
      console.error('Invitation Failed:', err);
      const message =
        (err as any).response?.data?.message || 'Failed to send invitation. Check server logs.';
      alert(`Invitation failed: ${message}`);
      return false;
    }
  };

  return handleInvite;
}



// loadStaff takes realDataSection as an argument to be refreshable
async function loadStaff(realDataSection: HTMLElement) {
  try {
    realDataSection.innerHTML = `<h2>Users from Database</h2><p>Loading...</p>`;

    const users = (await http.get('/users')) as UserDTO[];

    const staffData = (users ?? []).map((user) => ({
      name: user.profile?.displayName || user.auth.email, // Use email if display name is null
      role: user.roles,
      status: user.status,
    }));

    realDataSection.innerHTML = '';
    const tableElement = renderTable(staffData);
    realDataSection.appendChild(tableElement);

    // Clickable rows like InspectClient / InspectCase
    const rows = tableElement.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // skip header
      row.addEventListener('click', () => {
        const user = users[index - 1];
        const popup = inspectUser(user);
        document.body.appendChild(popup);
        console.log('client clicked');
      });
    });
  } catch (err) {
    console.error('Failed to load staff:', err);
    realDataSection.innerHTML = '<h2>Users from Database</h2><p>Failed to load staff data.</p>';
  }
}

function inspectUser(user: UserDTO): HTMLElement {
  const overlay: HTMLElement = renderCard({ edit: true, endpoint: 'users', data: user });
  const card: HTMLElement = overlay.querySelector('.card') as HTMLElement;
  const header: HTMLElement = card.querySelector('.header') as HTMLElement;
  const body: HTMLElement = card.querySelector('.body') as HTMLElement;

  header.innerText = user.profile?.displayName || 'No Name';

  // This is the body where the information is displayed like mail, mobile number etc.
  body.innerHTML = `
    <div class="card profile-card w-100 shadow-sm border-0">
      <div class="card-body fs-5">
      <div class="info-row d-flex justify-content-between border-bottom py-3">
        <span class="label text-muted fw-medium">First Name</span>
        <span class="value fw-semibold" data-field="profile.firstName">${user.profile?.firstName || 'N/A'}</span>
      </div>
      <div class="info-row d-flex justify-content-between border-bottom py-3">
        <span class="label text-muted fw-medium">Last Name</span>
        <span class="value fw-semibold" data-field="profile.lastName">${user.profile?.lastName || 'N/A'}</span>
      </div>
        <div class="info-row d-flex justify-content-between border-bottom py-3">
          <span class="label text-muted fw-medium">Display Name</span>
          <span class="value fw-semibold" data-field="profile.displayName">${user.profile?.displayName || 'N/A'}</span>
        </div>
        <div class="info-row d-flex justify-content-between border-bottom py-3">
          <span class="label text-muted fw-medium">Mobile Number</span>
          <span class="value fw-semibold" data-field="profile.phone">${user.profile?.phone || 'N/A'}</span>
        </div>
        <div class="info-row d-flex justify-content-between border-bottom py-3">
          <span class="label text-muted fw-medium">E-mail</span>
          <span class="value fw-semibold" data-field="auth.email" data-editable="false">${user.auth?.email || 'N/A'}</span>
        </div>
        <div class="info-row d-flex justify-content-between border-bottom py-3">
          <span class="label text-muted fw-medium">Address</span>
          <span class="value fw-semibold text-end" data-field="profile.address">${user.profile?.address || 'N/A'}</span>
        </div>
        <div class="info-row d-flex justify-content-between py-3">
          <span class="label text-muted fw-medium">CPR Number</span>
          <span class="value fw-semibold" data-field="profile.cpr">${user.profile?.cpr || 'N/A'}</span>
        </div>
        <div class="info-row d-flex justify-content-between py-3">
          <span class="label text-muted fw-medium">Roles</span>
          <span class="value fw-semibold dropdown" data-field="roles" data-transform="commaList">${Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || 'N/A'
    }</span>
        </div>
        <div class="info-row d-flex justify-content-between py-3">
          <span class="label text-muted fw-medium">Status</span>
          <span
            class="value fw-semibold dropdown"
            data-field="status"
            data-options="active, invited, disabled"
          >
            ${user.status || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(card);
  card.appendChild(header);
  card.appendChild(body);
  card.append(
    renderTabs({
      entityType: 'users',
      entityId: user.id,
    }),
  );

  // delete user button for admins
  if (isAdmin()) {
    const footer = document.createElement('div');
    footer.className = 'd-flex justify-content-end gap-2 p-3';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger';
    deleteBtn.innerText = 'Delete user';

    deleteBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${user.profile?.displayName || user.auth.email}?`,
      );
      if (!confirmed) return;

      try {
        await http.delete(`/users/${user.id}`);
        overlay.remove();

        const staffPage = document.querySelector('.staff-page') as any;
        if (staffPage?.reload) {
          staffPage.reload();
        }
      } catch (err) {
        console.error('Failed to delete user', err);
        alert('Failed to delete user. Please try again.');
      }
    });

    footer.appendChild(deleteBtn);
    card.appendChild(footer);
  }

  return overlay;
}

export function renderStaffPage(): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = `<h1>Staff page</h1>`;

  const container = document.createElement('div');
  container.classList.add('container', 'staff-page');
  container.appendChild(div);

  const searchAndButtonContainer = document.createElement('div');
  searchAndButtonContainer.style.display = 'flex';
  searchAndButtonContainer.style.justifyContent = 'flex-start';
  searchAndButtonContainer.style.alignItems = 'center';

  const searchEl = renderSearchComponent((query) => {
    const rows = realDataSection.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // skip header
      const nameCell = row.querySelector('td:first-child'); // Searches first column
      row.style.display = nameCell?.textContent?.toLowerCase().includes(query) ? '' : 'none';
    });
  });
  searchAndButtonContainer.appendChild(searchEl);

  // New section for real data from backend
  const realDataSection = document.createElement('div');
  realDataSection.innerHTML = `<p>Loading...</p>`;
  container.appendChild(realDataSection);

  // fetch users from backend using axios, which auto-parses JSON.
  //Takes the display name and role from the database. Map takes the specific piece of data that is needed.
  async function loadStaff() {
    try {
      const users = (await http.get('/users')) as UserDTO[];
      const staffData = (users ?? []).map((user) => ({
        name: user.profile?.displayName || user.auth.email,
        role: user.roles.join(', '),
        status: user.status,
        email: user.auth.email,
      }));
      // remove "loading..."
      realDataSection.innerHTML = '';

      //render table
      const tableElement = renderTable(staffData);
      realDataSection.appendChild(tableElement);

      //Taking each row and adding a eventListener
      const rows = tableElement.querySelectorAll('tr');
      rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;

        row.addEventListener('click', (): void => {
          const user = users[index - 1]; // match index with user
          const popup = inspectUser(user);
          document.body.appendChild(popup);
          console.log('user clicked');
        });
      });
      //Error message, if anything goes wrong
    } catch (err) {
      console.error('Failed to load staff:', err);
      realDataSection.innerHTML = '<h2>Users from Database</h2><p>Failed to load staff data.</p>';
    }
  }
  loadStaff();

  // Admin only functionality
  if (isAdmin()) {
    const handleInvite = setupInvitationHandler(realDataSection);

    const existingNewButton = searchEl.querySelector('.button');
    if (existingNewButton) {
      existingNewButton.addEventListener('click', () => {
        const newStaffCard = renderAddNewStaffCard(handleInvite);
        document.body.appendChild(newStaffCard);
      });
    }
  } else {
    console.log('You are not Admin');
  }

  container.appendChild(searchAndButtonContainer);
  container.appendChild(realDataSection);
  (container as any).reload = loadStaff;

  return container;
}
