import { renderCard } from '../cardComponent/cardComponent';
import { createFloatingInput, createFloatingTextarea } from '../floatingLabel/floatingLabel';
import http from '../../api/http';
import { showCancelConfirmation } from '../cancelPopUp/cancelPopUp';

export function renderAddNewCaseCard(): HTMLElement {
  const overlay = renderCard({ edit: false, endpoint: 'cases/create', hasChanges: () => isTyped });
  const card = overlay.querySelector('.card') as HTMLElement;
  const header = card.querySelector('.header') as HTMLElement;
  const body = card.querySelector('.body') as HTMLElement;

  header.innerHTML = `<h4 class="m-0 text-center fw-semibold">Add New Case</h4>`;

  const formContainer = document.createElement('div');
  formContainer.className = 'container p-4 rounded';

  const titleField = createFloatingInput('caseTitle', 'Case Title *', 'text');
  const descriptionField = createFloatingTextarea('caseDescription', 'Description', 4);

  formContainer.appendChild(titleField);
  formContainer.appendChild(descriptionField);

  const dropDown = document.createElement('div');
  dropDown.className = 'mb-3';
  dropDown.innerHTML = `
    <div class="mb-3">
      <select id="caseStatus" class="form-select">
        <option value="" selected disabled>Choose status... *</option>
        <option value="OPEN">Open</option>
        <option value="ON_HOLD">On Hold</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>
  `;

  formContainer.appendChild(dropDown);

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

  const markTypedSelect = (el: HTMLSelectElement) => {
    if (el.value !== '') isTyped = true;
  };

  const titleInput = formContainer.querySelector('#caseTitle') as HTMLInputElement;
  const descriptionInput = formContainer.querySelector('#caseDescription') as HTMLTextAreaElement;
  const statusInput = formContainer.querySelector('#caseStatus') as HTMLSelectElement;

  titleInput.addEventListener('input', () => markTypedInput(titleInput));
  descriptionInput.addEventListener('input', () => markTypedInput(descriptionInput));
  statusInput.addEventListener('change', () => markTypedSelect(statusInput));

  cancelBtn.addEventListener('click', () => {
    if (isTyped) {
      showCancelConfirmation(overlay);
    } else {
      overlay.remove();
    }
  });

  saveBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value;

    // RESET previous errors
    titleInput.classList.remove('is-invalid');
    statusInput.classList.remove('is-invalid');

    let hasError = false;

    if (!title) {
      titleInput.classList.add('is-invalid');
      hasError = true;
    }

    if (!status) {
      statusInput.classList.add('is-invalid');
      hasError = true;
    }

    if (hasError) {
      alert('Please fill out the required fields.');
      return;
    }

    saveBtn.disabled = true;
    try {
      const data = await http.post('/cases/create', null, {
        params: { title, description, status },
      });

      console.log('Case created successfully:', data);
      alert(`Case created successfully.`);

      overlay.remove();

      const casesPage = document.querySelector('.cases-page') as any;

      if (casesPage?.reload) {
        casesPage.reload(); // reload the cases page
      }

      const homePage = document.querySelector('.home-container') as any;
      if (homePage?.reload) {
            homePage.reload();

      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create case.';
      console.error('Error creating case:', err);
      alert(msg);
    } finally {
      saveBtn.disabled = false;
    }
  });

  return overlay;
}
