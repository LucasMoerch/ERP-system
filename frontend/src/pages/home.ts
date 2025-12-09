import './pageStyles/home.scss';
import http from '../api/http';
import type { CaseDto } from './cases';
import { renderAddNewCaseCard } from '../components/newCard/addNewCaseCard';
import { inspectCase } from './cases';

export function renderHomePage(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'home-container';

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards-container';
  //card for hours worked
  const hoursContainer = document.createElement('div');
  hoursContainer.className = 'hours-worked-container';

  const hours_worked = document.createElement('button');
  hours_worked.className = `
      card border-0 shadow-sm lighter-bg text-dark rounded p-3
      d-flex flex-column justify-content-start gap-1 w-100
      `;
  hours_worked.style.height = '130px';
  hours_worked.style.cursor = 'pointer';

  hours_worked.innerHTML = `
      <div class="d-flex align-items-center mb-2" style="justify-content: space-around;"">
        <span class="fs-large fw-semibold">16.5</span>
        <i class="fa-regular fa-clock fs-big"></i>
      </div>
      <p class="fs-6 fw-medium mb-0">Hours worked</p>
      <p class="fs-6 text-muted mb-0">This week</p>
      `;

  hoursContainer.appendChild(hours_worked);
  cardsContainer.appendChild(hoursContainer);

  //Card for when you want to create a new case.
  const create_new_container = document.createElement('div');
  create_new_container.className = 'create-new-container';

  const create_new = document.createElement('button');
  create_new.className = `
      card border-0 shadow-sm lighter-bg text-dark rounded
      d-flex flex-column justify-content-center align-items-center
      w-100 p-3
      `;
  create_new.style.height = '130px';
  create_new.style.cursor = 'pointer';

  create_new.innerHTML = `
      <i class="fa-solid fa-circle-plus fs-1"></i>
      `;

  create_new_container.appendChild(create_new);
  cardsContainer.appendChild(create_new_container);

  container.appendChild(cardsContainer);

  create_new.addEventListener('click', (): void => {
    const newCaseCard = renderAddNewCaseCard();
    document.body.appendChild(newCaseCard);
    console.log('creating new case clicked');
  });

  //Text for active cases
  const headerRow = document.createElement('div');
  headerRow.className = 'cases-header';

  const activeCasesText = document.createElement('p');
  activeCasesText.className = 'active-cases';
  activeCasesText.textContent = 'Active Cases';

  headerRow.appendChild(activeCasesText);

  //sort
  const sort = document.createElement('div');
  sort.className = 'sort-by';
  sort.innerHTML = `<i class="fa-solid fa-arrow-down-short-wide"></i>`;

  headerRow.appendChild(sort);

  container.appendChild(headerRow);

  //Creates the box to hold active tasks
  const active_cases_container = document.createElement('div');
  active_cases_container.className = `d-flex flex-wrap justify-content-between align-items-start w-100 mt-3`;
  container.appendChild(active_cases_container);

  async function loadCases() {
    try {
      const cases = (await http.get('/cases')) as CaseDto[];
      console.log('Fetched cases:', cases);

      // Only show active/open cases
      const activeCases = cases.filter((c) => c.status === 'OPEN');
      active_cases_container.innerHTML = ''; // Clear old content

      activeCases.forEach((c) => {
        const caseBtn = document.createElement('button');
        caseBtn.className = `
                card border-0 shadow-sm bg-white text-dark rounded p-3
                d-flex flex-column justify-content-start gap-1 mb-3
                `;
        caseBtn.style.width = '48%';
        caseBtn.style.height = '130px';
        caseBtn.style.cursor = 'pointer';

        caseBtn.innerHTML = `
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="case-title fs-5 fw-semibold">${c.title}</span>
                <i class="fa-solid fa-folder-open fs-5"></i>
              </div>
              <p class="case-desc text-muted mb-1">${c.description || 'No description'}</p>
              <p class="fs-6 text-muted mb-0">Created: ${new Date(c.createdAt).toLocaleDateString('da-DK')}</p>
              `;

        // When clicked, open the case popup
        caseBtn.addEventListener('click', () => {
          const popup = inspectCase(c);
          document.body.appendChild(popup);
          console.log('Opened case:', c.id);
        });

        active_cases_container.appendChild(caseBtn);
      });
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  }

  loadCases();
  (container as any).reload = loadCases;


    return container;
}
