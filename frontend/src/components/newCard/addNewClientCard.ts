import { renderCard } from '../cardComponent/cardComponent';
import { createFloatingInput } from '../floatingLabel/floatingLabel';
import http from '../../api/http';
import { showCancelConfirmation } from '../cancelPopUp/cancelPopUp';

export function renderAddNewClientCard(): HTMLElement {
  const overlay = renderCard({
    edit: false,
    endpoint: 'clients/create',
    hasChanges: () => isTyped,
  });
  const card = overlay.querySelector('.card') as HTMLElement;
  const header = card.querySelector('.header') as HTMLElement;
  const titleEl: HTMLElement = header.querySelector('h2') as HTMLElement;
  const body = card.querySelector('.body') as HTMLElement;

  titleEl.innerHTML = `<h4 class="m-0 text-center fw-semibold">Add New Client</h4>`;

  const formContainer = document.createElement('div');
  formContainer.className = 'container p-4 rounded';

  //Use the new reusable floating label helpers
  const nameField = createFloatingInput('clientName', 'Full Name *', 'text');
  const emailField = createFloatingInput('clientEmail', 'Email *', 'email');
  const phoneField = createFloatingInput('clientPhone', 'Phone *', 'tel');

  formContainer.appendChild(nameField);
  formContainer.appendChild(emailField);
  formContainer.appendChild(phoneField);

  const buttonRow = document.createElement('div');
  buttonRow.className = 'd-flex justify-content-center gap-3 p-3';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary rounded-pill px-4';
  saveBtn.innerText = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-danger text-white rounded-pill px-4';
  cancelBtn.innerText = 'Cancel';

  buttonRow.appendChild(saveBtn);
  buttonRow.appendChild(cancelBtn);
  body.appendChild(formContainer);
  body.appendChild(buttonRow);

  //Only show the cancel if the user has typed something
  let isTyped = false;

  const markTypedInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
    if (el.value.trim() !== '') isTyped = true;
  };

  const nameInput = formContainer.querySelector('#clientName') as HTMLInputElement;
  const emailInput = formContainer.querySelector('#clientEmail') as HTMLInputElement;
  const phoneInput = formContainer.querySelector('#clientPhone') as HTMLInputElement;

  // CPR / CVR selection
  const typeContainer = document.createElement('div');
  typeContainer.className = 'my-3';
  typeContainer.innerHTML = `
  <label class="form-label fw-semibold">Registration Type *</label>
  <select id="idType" class="form-select">
    <option value="cpr">CPR</option>
    <option value="cvr">CVR</option>
  </select>
  `;

  const idField = createFloatingInput('clientIdentifier', 'CPR Number *', 'text');

  formContainer.appendChild(typeContainer);
  formContainer.appendChild(idField);

  nameInput.addEventListener('input', () => markTypedInput(nameInput));
  emailInput.addEventListener('input', () => markTypedInput(emailInput));
  phoneInput.addEventListener('input', () => markTypedInput(phoneInput));

  const idTypeSelect = formContainer.querySelector('#idType') as HTMLSelectElement;
  const idInput = formContainer.querySelector('#clientIdentifier') as HTMLInputElement;

  //CPR/CVR formatting & restrictions
  idInput.addEventListener('input', () => {
    isTyped = true;

    if (idTypeSelect.value === 'cpr') {
      // Remove all non-digits
      let digits = idInput.value.replace(/\D/g, '');

      // Max 10 digits
      if (digits.length > 10) digits = digits.slice(0, 10);

      // Insert hyphen after first 6 digits
      if (digits.length > 6) {
        idInput.value = digits.slice(0, 6) + '-' + digits.slice(6);
      } else {
        idInput.value = digits;
      }
    }

    if (idTypeSelect.value === 'cvr') {
      // CVR: only digits, max 8 characters
      idInput.value = idInput.value.replace(/\D/g, '').slice(0, 8);
    }
  });

  //Changes depend on if you choose cpr or cvr.
  idTypeSelect.addEventListener('change', () => {
    isTyped = true;

    const idLabel = formContainer.querySelector(
      'label[for="clientIdentifier"]',
    ) as HTMLLabelElement;

    if (idTypeSelect.value === 'cpr') {
      idInput.placeholder = 'CPR';
      if (idLabel) idLabel.textContent = 'CPR Number *';
    } else {
      idInput.placeholder = 'CVR';
      if (idLabel) idLabel.textContent = 'CVR Number *';
    }

    idInput.value = '';
  });

  idInput.addEventListener('input', () => markTypedInput(idInput));

  cancelBtn.addEventListener('click', () => {
    if (isTyped) {
      showCancelConfirmation(overlay);
    } else {
      overlay.remove();
    }
  });

  saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const idValue = idInput.value.trim();
    const idType = idTypeSelect.value;

    // RESET previous errors
    nameInput.classList.remove('is-invalid');
    emailInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-invalid');
    idInput.classList.remove('is-invalid');

    let hasError = false;

    if (!name) {
      nameInput.classList.add('is-invalid');
      hasError = true;
    }

    if (!email) {
      emailInput.classList.add('is-invalid');
      hasError = true;
    }

    if (!phone) {
      phoneInput.classList.add('is-invalid');
      hasError = true;
    }

    // Validate CPR
    if (idType === 'cpr') {
      const cprRegex = /^\d{6}-\d{4}$/;
      if (!cprRegex.test(idValue)) {
        hasError = true;
        idInput.classList.add('is-invalid');
      }
    }

    // Validate CVR
    if (idType === 'cvr') {
      const cvrRegex = /^\d{8}$/;
      if (!cvrRegex.test(idValue)) {
        hasError = true;
        idInput.classList.add('is-invalid');
      }
    }

    if (hasError) {
      alert('Please fill out the required fields.');
      return;
    }

    saveBtn.disabled = true;
    try {
      const created = await http.post('/clients/create', {
        name,
        contactEmail: email,
        contactPhone: phone,
        identifierType: idType, // "cpr" / "cvr"
        identifierValue: idValue, // the actual number
      });
      console.log('Client created:', created);
      overlay.remove();

      const clientsPage = document.querySelector('.clients-page') as any;

      if (clientsPage?.reload) {
        clientsPage.reload(); // reload the client page
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save client';
      console.error(err);
      alert(msg);
    } finally {
      saveBtn.disabled = false;
    }
  });

  return overlay;
}
