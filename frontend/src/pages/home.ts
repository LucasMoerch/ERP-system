import './pageStyles/home.scss';
import http from '../api/http';
import type { CaseDto } from './cases';
import { renderAddNewCaseCard } from '../components/newCard/addNewCaseCard';
import { inspectCase } from './cases';
import { isAdmin, userId } from '../auth/auth';

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
    <div class="d-flex align-items-center mb-2 justify-content-around">
      <span id="hoursThisWeekValue" class="fs-large fw-semibold">–</span>
      <i class="fa-regular fa-clock fs-big"></i>
    </div>
    <p class="fs-6 fw-medium mb-0">Hours worked</p>
    <p class="fs-6 text-muted mb-0">This week</p>
  `;


  hoursContainer.appendChild(hours_worked);
  cardsContainer.appendChild(hoursContainer);

  if (isAdmin()) {

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


    create_new.addEventListener('click', (): void => {
      const newCaseCard = renderAddNewCaseCard();
      document.body.appendChild(newCaseCard);
      console.log('creating new case clicked');
    });
  } else {
    // make hours container take full width when not admin
    hoursContainer.style.flex = '0 0 100%';
    hoursContainer.style.maxWidth = '100%';
  }

  container.appendChild(cardsContainer);
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

  const active_cases_container = document.createElement('div');
  active_cases_container.className =
    'd-flex flex-wrap justify-content-between align-items-start w-100 mt-3';
  container.appendChild(active_cases_container);

  async function loadCases() {
    try {
      const cases = (await http.get('/cases')) as CaseDto[];
      console.log('Fetched cases:', cases);

      const meId = userId();

      // Only OPEN cases
      let visibleCases = (cases ?? []).filter((c) => c.status === 'OPEN');

      // If not admin, only open cases assigned to current user
      if (!isAdmin() && meId) {
        visibleCases = visibleCases.filter((c) =>
          Array.isArray(c.assignedUserIds) ? c.assignedUserIds.includes(meId) : false,
        );
      }

      // Newest created first
      visibleCases.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      active_cases_container.innerHTML = ''; // Clear old content

      visibleCases.forEach((c) => {
        const assignedCount = Array.isArray(c.assignedUserIds)
          ? c.assignedUserIds.length
          : 0;


        const createdLabel = new Date(c.createdAt).toLocaleDateString('da-DK');

        const caseBtn = document.createElement('button');
        caseBtn.type = 'button';
        caseBtn.className = `
          card border-0 shadow-sm bg-white text-dark rounded p-3
          d-flex flex-column justify-content-between gap-2 mb-3 text-start
        `;
        caseBtn.style.flex = '0 0 calc(50% - 0.5rem)'; // two per row with small gap
        caseBtn.style.cursor = 'pointer';
        caseBtn.style.overflow = 'hidden';

        caseBtn.innerHTML = `
          <div class="d-flex align-items-start justify-content-between mb-1 w-100">
            <div class="me-2 flex-grow-1 overflow-hidden">
              <div class="case-title fw-semibold text-truncate">
                ${c.title}
              </div>
              <div class="case-desc text-muted small text-truncate">
                ${c.description || 'No description'}
              </div>
            </div>
              <i class="fa-solid fa-folder-open"></i>
          </div>

          <div class="d-flex justify-content-between align-items-center small text-muted pt-1 w-100">
            <span class="text-truncate">
              <i class="fa-regular fa-calendar me-1"></i>
              ${createdLabel}
            </span>
            <span class="text-truncate text-end">
              <i class="fa-regular fa-user me-1"></i>
              ${assignedCount}
            </span>
          </div>
        `;


        caseBtn.addEventListener('click', () => {
          const popup = inspectCase(c);
          document.body.appendChild(popup);
        });

        active_cases_container.appendChild(caseBtn);
      });

    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  }

  loadCases();
  loadHoursThisWeek();
  (container as any).reload = () => {
    loadCases();
    loadHoursThisWeek();
  };
  return container;

}

async function loadHoursThisWeek() {
  try {
    const meId = userId();
    if (!meId) return;

    // Compute this week from monday to sunday
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    type TimeDto = {
      date?: string | null;
      totalTime?: string | null;
    };

    const times = (await http.get(`/times/users/${meId}`)) as TimeDto[];

    const totalSeconds = (times ?? []).reduce((sum, t) => {
      if (!t.date || !t.totalTime) return sum;

      // Parse date "dd-MM-yyyy"
      const [dd, mm, yyyy] = t.date.split('-').map((s) => parseInt(s, 10));
      if (!dd || !mm || !yyyy) return sum;
      const d = new Date(yyyy, mm - 1, dd); // JS months are 0-based

      if (d < monday || d > sunday) return sum;

      // Parse totalTime "HH:MM:SS" to seconds
      const [hhStr, minStr, ssStr] = t.totalTime.split(':');
      const h = parseInt(hhStr ?? '0', 10);
      const m = parseInt(minStr ?? '0', 10);
      const s = parseInt(ssStr ?? '0', 10);
      const seconds = h * 3600 + m * 60 + s;

      return sum + (Number.isNaN(seconds) ? 0 : seconds);
    }, 0);

    const totalHours = totalSeconds / 3600;

    const span = document.getElementById('hoursThisWeekValue');
    if (span) {
      span.textContent = totalHours.toFixed(1);
    }
  } catch (err) {
    console.error('Failed to load hours this week:', err);
  }
}
