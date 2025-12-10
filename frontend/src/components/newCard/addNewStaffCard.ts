import { renderCard } from '../cardComponent/cardComponent';
import { createFloatingInput, createFloatingTextarea } from '../floatingLabel/floatingLabel';
import type { UserRole } from '../../pages/staff';
import { showCancelConfirmation } from '../cancelPopUp/cancelPopUp';
import type { InvitePayload } from '../../pages/staff';

export function renderAddNewStaffCard(
  onInvite?: (payload: InvitePayload) => Promise<boolean>,
): HTMLElement {
  // Create overlay
  const overlay = renderCard({ edit: false, endpoint: 'users/create', hasChanges: () => isTyped });
  const card: HTMLElement = overlay.querySelector('.card') as HTMLElement;
  const header: HTMLElement = card.querySelector('.header') as HTMLElement;
  const body: HTMLElement = card.querySelector('.body') as HTMLElement;

  // HEADER
  header.innerHTML = `<h4 class="m-0 text-center fw-semibold">Add New Staff</h4>`;

  // BODY CONTENT
  const formContainer = document.createElement('div');
  formContainer.className = 'container p-4 rounded';

  //Use the new reusable floating label helpers
  const firstNameField = createFloatingInput('staffFirstName', 'First Name *', 'text');
  const lastNameField = createFloatingInput('staffLastName', 'Last Name *', 'text');
  const phoneField = createFloatingInput('staffPhone', 'Mobile Number', 'tel');
  const emailField = createFloatingInput('staffEmail', 'Email *', 'email');
  const addressField = createFloatingInput('staffAddress', 'Address', 'text');
  const cprField = createFloatingInput('staffCpr', 'CPR *', 'tel');

  const adminCheckWrapper = document.createElement('div');
  adminCheckWrapper.className = 'd-flex gap-3 mb-3';
  adminCheckWrapper.innerHTML = `
    <div class="form-check">
      <input type="checkbox" class="form-check-input" id="isStaff" checked />
      <label class="form-check-label" for="isStaff">Staff access</label>
    </div>
    <div class="form-check">
      <input type="checkbox" class="form-check-input" id="isAdmin" />
      <label class="form-check-label" for="isAdmin">Admin access</label>
    </div>
    `;

  formContainer.appendChild(firstNameField);
  formContainer.appendChild(lastNameField);
  formContainer.appendChild(phoneField);
  formContainer.appendChild(emailField);
  formContainer.appendChild(addressField);
  formContainer.appendChild(cprField);
  formContainer.appendChild(adminCheckWrapper);

  // BUTTON ROW
  const buttonRow = document.createElement('div');
  buttonRow.className = 'd-flex justify-content-center gap-3 p-3';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary rounded-pill px-4';
  saveBtn.innerText = 'Invite';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-danger text-white rounded-pill px-4';
  cancelBtn.innerText = 'Cancel';

  buttonRow.appendChild(saveBtn);
  buttonRow.appendChild(cancelBtn);

  // BUILD CARD
  body.appendChild(formContainer);
  body.appendChild(buttonRow);
  card.appendChild(header);
  card.appendChild(body);
  overlay.appendChild(card);

  //Only show the cancel if the user has typed something
  let isTyped = false;

  const markTypedInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
    if (el.value.trim() !== '') isTyped = true;
  };

  const firstNameInput = formContainer.querySelector('#staffFirstName') as HTMLInputElement;
  const lastNameInput = formContainer.querySelector('#staffLastName') as HTMLInputElement;
  const phoneInput = formContainer.querySelector('#staffPhone') as HTMLInputElement;
  const emailInput = formContainer.querySelector('#staffEmail') as HTMLInputElement;
  const addressInput = formContainer.querySelector('#staffAddress') as HTMLInputElement;
  const cprInput = formContainer.querySelector('#staffCpr') as HTMLInputElement;
  const isStaffInput = formContainer.querySelector('#isStaff') as HTMLInputElement;
  const isAdminInput = formContainer.querySelector('#isAdmin') as HTMLInputElement;

  // CPR formatting (xxxxxx-xxxx)
  cprInput.addEventListener('input', () => {
    isTyped = true;

    // remove non-digits
    let digits = cprInput.value.replace(/\D/g, '');

    // max 10 digits
    if (digits.length > 10) digits = digits.slice(0, 10);

    // insert hyphen after first 6 i.e. "-"
    if (digits.length > 6) {
      cprInput.value = digits.slice(0, 6) + '-' + digits.slice(6);
    } else {
      cprInput.value = digits;
    }
  });

  firstNameInput.addEventListener('input', () => markTypedInput(firstNameInput));
  lastNameInput.addEventListener('input', () => markTypedInput(lastNameInput));
  cprInput.addEventListener('input', () => markTypedInput(cprInput));
  phoneInput.addEventListener('input', () => markTypedInput(phoneInput));
  emailInput.addEventListener('input', () => markTypedInput(emailInput));
  addressInput.addEventListener('input', () => markTypedInput(addressInput));
  isStaffInput.addEventListener('input', () => markTypedInput(isStaffInput));
  isAdminInput.addEventListener('input', () => markTypedInput(isAdminInput));

  cancelBtn.addEventListener('click', () => {
    if (isTyped) {
      showCancelConfirmation(overlay);
    } else {
      overlay.remove();
    }
  });

  saveBtn.addEventListener('click', async () => {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const name = `${firstName} ${lastName}`.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const address = addressInput.value.trim();
    const cpr = cprInput.value.trim();
    const isStaff = isStaffInput.checked;
    const isAdmin = isAdminInput.checked;

    const roles: UserRole[] = [];
    if (isStaff) roles.push('staff');
    if (isAdmin) roles.push('admin');

    // Reset all invalid states
    firstNameInput.classList.remove('is-invalid');
    lastNameInput.classList.remove('is-invalid');
    emailInput.classList.remove('is-invalid');
    cprInput.classList.remove('is-invalid');

    let hasError = false;

    if (!firstName) {
      firstNameInput.classList.add('is-invalid');
      hasError = true;
    }
    if (!lastName) {
      lastNameInput.classList.add('is-invalid');
      hasError = true;
    }

    if (!email) {
      emailInput.classList.add('is-invalid');
      hasError = true;
    }

    // Validate CPR format
    const cprRegex = /^\d{6}-\d{4}$/;
    if (!cprRegex.test(cpr)) {
      cprInput.classList.add('is-invalid');
      hasError = true;
    }

    if (hasError) {
      alert('Please fill out the required fields.');
      return;
    }

    console.log('Submitting:', { name, phone, email, address, cpr, roles });

    if (!onInvite) {
      console.warn('No invite callback provided.');
      overlay.remove();
      return;
    }

    const success = await onInvite({
      email,
      roles,
      fullName: name,
      firstName,
      lastName,
      phone,
      address,
      cpr,
    });
    if (success) {
      overlay.remove();

      const staffPage = document.querySelector('.staff-page') as any;

      if (staffPage?.reload) {
        staffPage.reload(); // reload the staff page
      }
    }
  });

  return overlay;
}
