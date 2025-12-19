import http from '../../api/http';
import './timetracker.scss';
import '../../styles/custom.scss';
import { renderCard } from '../cardComponent/cardComponent';
import { renderCalendar } from '../calendarComponent/calendar';
import { CaseDto } from '../../pages/cases';
import { userId as getUserId, getDisplayName } from '../../auth/auth';
export type TimeEntryDto = {
  startTime: string;
  stopTime?: string | null;
};

//api functions
async function checkForUnresolvedTime(
  buttonRow: HTMLDivElement,
  startTimeBtn: HTMLButtonElement,
  stopTimeBtn: HTMLButtonElement,
) {
  try {
    const currentUserId = getUserId();
    if (!currentUserId) {
      console.error('User ID is not available.');
      return;
    }

    const last = (await http.get(`/times/users/${currentUserId}/last-time`)) as TimeEntryDto;
    if (!last) {
      return;
    }

    const entry = {
      startTime: last.startTime ?? '00:00:00',
      // stopTime can be undefined if the time entry wasn't completed
      stopTime: last.stopTime ?? undefined,
    };
    if (entry.stopTime === undefined) {
      startTimeBtn.remove();
      buttonRow.appendChild(stopTimeBtn);
      displayTime('startTime', entry.startTime);
      return entry.startTime;
    } else {
      return;
    }

    //api functions
  } catch (err) {
    console.error('Failed to load cases:', err);
  }
}

async function loadCases() {
  try {
    const cases = (await http.get('/cases')) as CaseDto[];

    const caseData = (cases ?? []).map((c) => ({
      title: c.title || 'Untitled',
      id: c.id || 'Untitled',
    }));

    const casesSelect = document.getElementById('caseSelect') as HTMLSelectElement;
    if (!casesSelect) {
      console.error('Case select element not found');
      return;
    }
    caseData.forEach((caseItem) => {
      const option = document.createElement('option');
      option.value = caseItem.title;
      option.textContent = caseItem.title;
      option.id = caseItem.id;
      casesSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load cases:', err);
  }
}

async function sendStartTimeData(
  startTime: string,
  userId: string,
  currentUserName: string,
  caseId?: string,
): Promise<void> {
  try {
    const params = new URLSearchParams({ startTime, userId, currentUserName });
    if (caseId) {
      params.append('caseId', caseId);
    }

    const response = await http.post('/times/start', params);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function updateTimeData(
  startTime: string,
  stopTime: string,
  totalTime: string,
  description: string,
  date: string,
  caseId: string,
  originalStartTime: string,
): Promise<void> {
  try {
    const response = await http.patch(
      '/times/update',
      new URLSearchParams({
        startTime,
        stopTime,
        totalTime,
        description,
        date,
        caseId,
        originalStartTime,
      }),
    );
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// ----------------------------------------Regular functions------------------------------------------------
function getTimeNow(): string {
  const startTime: Date = new Date(); // stores the current time the moment the start button is clicked
  const timeNow: string =
    startTime.getHours().toString().padStart(2, '0') +
    ':' +
    startTime.getMinutes().toString().padStart(2, '0') +
    ':' +
    startTime.getSeconds().toString().padStart(2, '0');

  return timeNow;
}

function displayTime(elementId: string, time: string): void {
  const element = document.getElementById(elementId);
  //if the element is found, check if it's an input or a span and set the value or innerHTML accordingly
  if (element) {
    if (element instanceof HTMLInputElement) {
      element.value = time;
    } else {
      element.innerHTML = time;
    }
  }
}

function normalizeTimeToHMS(t: string): string {
  // iOS often returns "HH:MM" even when step=1
  const parts = (t || '').split(':');
  const hh = (parts[0] ?? '00').padStart(2, '0');
  const mm = (parts[1] ?? '00').padStart(2, '0');
  const ss = (parts[2] ?? '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function calculateTotalTime(startTime: string, stopTime: string): string {
  const start = normalizeTimeToHMS(startTime);
  const stop = normalizeTimeToHMS(stopTime);

  const [startHours, startMinutes, startSeconds] = start.split(':').map(Number);
  const [stopHours, stopMinutes, stopSeconds] = stop.split(':').map(Number);

  let totalSeconds =
    stopHours * 3600 +
    stopMinutes * 60 +
    stopSeconds -
    (startHours * 3600 + startMinutes * 60 + startSeconds);

  if (totalSeconds < 0) totalSeconds += 24 * 3600;

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getDateNow(date: string): string {
  if (date) {
    // if date is not empty, return the selected date
    const [year, month, day] = date.split('-').map(Number);
    return `${day}-${month}-${year}`;
  }
  // if no date was chosen from the calender. then return the current date
  const dateObj: Date = new Date();
  const month: string = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day: string = dateObj.getDate().toString().padStart(2, '0');
  const year: string = dateObj.getFullYear().toString();
  return `${day}-${month}-${year}`;
}
function getCaseIdFromSelect(): string {
  const casesSelect = document.getElementById('caseSelect') as HTMLSelectElement;
  const selectedOption = casesSelect.options[casesSelect.selectedIndex];
  const selectedCaseId = selectedOption.id;
  return selectedCaseId;
}

function updateTotalTimeField(
  startTimeInput: HTMLInputElement | null,
  stopTimeInput: HTMLInputElement | null,
  totalTimeInput: HTMLInputElement | null,
): void {
  //if any of the inputs are null, return
  if (!startTimeInput || !stopTimeInput || !totalTimeInput) {
    return;
  }

  const startValue = startTimeInput.value;
  const stopValue = stopTimeInput.value;
  const isZero = (v: string) => v === '00:00:00' || v === '00:00' || v === '';
  if (isZero(startValue) || isZero(stopValue)) {
    totalTimeInput.value = '00:00:00';
    return;
  }

  totalTimeInput.value = calculateTotalTime(startValue, stopValue);
}

function toHM(t: string): string {
  const [hh, mm] = normalizeTimeToHMS(t).split(':');
  return `${hh}:${mm}`;
}

export function renderTimeTracker(): HTMLElement {
  const div = document.createElement('div');
  div.className = 'time-tracker-container p-4 rounded';

  const openCardButton = document.createElement('button');
  openCardButton.className = 'time-tracker-button shadow';
  openCardButton.innerHTML = '<i class="fa-solid fa-stopwatch"></i>';

  openCardButton.addEventListener('click', (): void => {
    const cardEl = renderTimeTrackingCard();
    document.body.appendChild(cardEl);
  });

  div.appendChild(openCardButton);

  function renderTimeTrackingCard(): HTMLElement {
    // Create overlay
    const overlay = renderCard({ edit: false, endpoint: 'times' });
    const card: HTMLElement = overlay.querySelector('.card') as HTMLElement;
    const header: HTMLElement = card.querySelector('.header') as HTMLElement;
    const titleEl: HTMLElement = header.querySelector('h2') as HTMLElement;
    const body: HTMLElement = card.querySelector('.body') as HTMLElement;

    card.classList.add('d-flex', 'flex-column', 'h-100');
    header.classList.add('flex-shrink-0');
    body.classList.add('d-flex', 'flex-column', 'flex-grow-1', 'overflow-auto', 'pb-4');

    if (titleEl) {
      titleEl.innerText = 'Time Registration';
      titleEl.title = 'Time Registration';
    }

    const popup: HTMLDivElement = document.createElement('div');
    popup.className = 'completion-popup';
    popup.innerHTML = `
      <div class="popup-inner light-bg rounded shadow p-4 text-center">
        <h5 class="mb-2">Complete time entry?</h5>
        <p class="text-muted small mb-3">Review the details below before submitting.</p>
        <div class="popup-summary text-start border rounded-3 p-3 mb-3 lighter-bg"></div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-dark popup-cancel rounded-pill">Keep editing</button>
          <button type="button" class="btn btn-primary popup-confirm rounded-pill">Submit</button>
        </div>
      </div>
    `;
    const popupSummary = popup.querySelector('.popup-summary') as HTMLDivElement;
    const popupConfirmBtn = popup.querySelector('.popup-confirm') as HTMLButtonElement;
    const popupCancelBtn = popup.querySelector('.popup-cancel') as HTMLButtonElement;
    const openCompletionPopup = () => {
      if (popup) {
        popup.classList.add('show');
      }
    };
    const closeCompletionPopup = () => {
      popup.classList.remove('show');
    };

    //global variable to hold data until confirmed
    let pendingCompletionData: {
      startTime: string;
      stopTime: string;
      totalTime: string;
      description: string;
      date: string;
      caseId: string;
    } | null = null;

    const dropDownRow: HTMLDivElement = document.createElement('div');
    dropDownRow.innerHTML = `
    <div class="container p-4 rounded">
      <select class="form-select shadow-sm lighter-bg" id="caseSelect">
        <option selected>Choose a case...</option>

      </select>
    </div>`;

    const description: HTMLDivElement = document.createElement('div');
    description.className = 'container col-12 p-4';
    description.innerHTML = `

    <textarea class="form-control shadow border-0 lighter-bg shadow-sm rounded-3" id="description"
    rows="6" placeholder="Add a short description..."
    ></textarea>
    `;

    const buttonRow: HTMLDivElement = document.createElement('div');
    buttonRow.className =
      'container d-flex justify-content-between align-items-center gap-3 px-4 pb-4 pt-3 position-sticky bottom-0';
    buttonRow.id = 'buttonRow';

    const startTimeBtn = document.createElement('button');
    startTimeBtn.className = 'btn btn-success col-12 shadow rounded-pill';
    startTimeBtn.innerText = 'Start Time';
    startTimeBtn.id = 'startTimeBtn';

    const stopTimeBtn = document.createElement('button');
    stopTimeBtn.className = 'btn btn-danger shadow col-12 rounded-pill';
    stopTimeBtn.innerText = 'Stop Time';
    stopTimeBtn.id = 'stopTimeBtn';

    const completeBtn: HTMLButtonElement = document.createElement('button');
    completeBtn.className = 'btn btn-primary shadow col-12 rounded-pill';
    completeBtn.innerText = 'Complete';

    const startStopTimeRow: HTMLDivElement = document.createElement('div');
    startStopTimeRow.className = 'container p-2 rounded d-flex justify-content-between gap-1';
    startStopTimeRow.innerHTML = `
    <div class="container col-5 rounded text-center shadow-sm light-bg py-2">
      <label for="startTime" class="form-label">Start Time</label> <br>
      <div class="container col-12 rounded text-center bg-transparent py-1">
      <input
        type="time"
        step="1"
        class="form-control mx-auto px-0 shadow-sm lighter-bg clockText text-center"
        id="startTime"
        value="00:00:00">
      </div>
    </div>
    <div class="container col-5 rounded text-center shadow-sm light-bg py-2">
      <label for="stopTime" class="form-label">Stop Time</label> <br>
      <div class="container col-12 rounded text-center bg-transparent py-1">
      <input
        type="time"
        step="1"
        class="form-control mx-auto px-2 shadow-sm lighter-bg clockText text-center "
        id="stopTime"
        value="00:00:00">
      </div>
    </div>`;

    const totalTimeDisplay: HTMLDivElement = document.createElement('div');
    totalTimeDisplay.className = 'container p-2 rounded d-flex justify-content-center';
    totalTimeDisplay.innerHTML = `
    <div class="container col-11 rounded text-center shadow-sm light-bg py-2">
     <label for="totalTime" class="form-label">Total Time</label> <br>
     <div class="container col-12 rounded text-center bg-transparent py-1">
      <input
        readonly
        type="text"
        inputmode="numeric"
        class="form-control totalTime-field mx-auto px-2 shadow-sm lighter-bg clockText text-center"
        id="totalTime"
        value="00:00:00"
        >
     </div>
    </div>`;
    const calender: HTMLElement = renderCalendar();

    // Build card

    overlay.appendChild(popup);
    body.appendChild(dropDownRow);
    overlay.appendChild(card);
    card.appendChild(header);
    card.appendChild(body);
    body.appendChild(calender);
    body.appendChild(totalTimeDisplay);
    body.appendChild(startStopTimeRow);

    const bottomSection: HTMLDivElement = document.createElement('div');
    bottomSection.className = 'mt-auto d-flex flex-column  gap-3';
    bottomSection.appendChild(description);
    bottomSection.appendChild(buttonRow);

    body.appendChild(bottomSection);
    buttonRow.appendChild(startTimeBtn);

    const startTimeInputEl = startStopTimeRow.querySelector(
      '#startTime',
    ) as HTMLInputElement | null;
    const stopTimeInputEl = startStopTimeRow.querySelector('#stopTime') as HTMLInputElement | null;
    const totalTimeInputEl = totalTimeDisplay.querySelector(
      '#totalTime',
    ) as HTMLInputElement | null;

    loadCases();

    let originalStartTime: string;
    // Event listeners

    [startTimeInputEl, stopTimeInputEl].forEach((input) => {
      input?.addEventListener('input', () => {
        updateTotalTimeField(startTimeInputEl, stopTimeInputEl, totalTimeInputEl);
      });
      input?.addEventListener('change', () => {
        updateTotalTimeField(startTimeInputEl, stopTimeInputEl, totalTimeInputEl);
      });
    });

    // Async check for unresolved time entry. after function is completed the originalStartTime is set
    checkForUnresolvedTime(buttonRow, startTimeBtn, stopTimeBtn)
      .then((t) => {
        if (t) {
          originalStartTime = t;
        }
      })
      .catch((err) => console.error(err));

    startTimeBtn.addEventListener('click', (): void => {
      //get Start time
      const startTimeNow: string = getTimeNow();
      //get the user who pressed start time
      const currentUserId = getUserId();
      if (!currentUserId) {
        console.error('User ID is not available.');
        return;
      }
      const currentUserName = getDisplayName();
      if (!currentUserName) {
        console.error('User display name is not available.');
        return;
      }

      const caseId = getCaseIdFromSelect();

      //This time needs to be stored the same place as the Id so that each account has a latest time that can be queried
      originalStartTime = startTimeNow;

      startTimeBtn.remove();
      buttonRow.appendChild(stopTimeBtn);
      displayTime('startTime', toHM(startTimeNow));
      //const result = await getTimeData();
      sendStartTimeData(startTimeNow, currentUserId, currentUserName, caseId);
    });

    stopTimeBtn.addEventListener('click', (): void => {
      //Gets the time of stopping
      const stopTimeNow: string = getTimeNow();
      buttonRow.appendChild(completeBtn);
      displayTime('stopTime', toHM(stopTimeNow));
      updateTotalTimeField(startTimeInputEl, stopTimeInputEl, totalTimeInputEl);
      stopTimeBtn.remove();
    });

    completeBtn.addEventListener('click', (): void => {
      const startTimeInput = normalizeTimeToHMS(
        (document.getElementById('startTime') as HTMLInputElement).value,
      );
      const stopTimeInput = normalizeTimeToHMS(
        (document.getElementById('stopTime') as HTMLInputElement).value,
      );
      const descriptionInput: string = (document.getElementById('description') as HTMLInputElement)
        .value;
      const calenderField: string = (document.getElementById('dateInput') as HTMLInputElement)
        .value;
      const caseId: string = getCaseIdFromSelect();
      const formattedDate = getDateNow(calenderField);
      const totalTime = calculateTotalTime(startTimeInput, stopTimeInput);

      pendingCompletionData = {
        startTime: startTimeInput,
        stopTime: stopTimeInput,
        totalTime: totalTime,
        description: descriptionInput,
        date: formattedDate,
        caseId,
      };

      popupSummary.innerHTML = `
        <div class="mb-3">
          <div><strong>Case:</strong> ${caseId || 'Other'}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Start:</strong> ${startTimeInput}</div>
          <div><strong>Stop:</strong> ${stopTimeInput}</div>
          <div><strong>Total:</strong> ${totalTime}</div>
        </div>
        <div>
          <strong>Description:</strong>
          <p class="mb-0 hide-long-text">${descriptionInput ? descriptionInput : 'No description added.'}</p>
        </div>
      `;

      openCompletionPopup();
    });

    popupCancelBtn.addEventListener('click', () => {
      pendingCompletionData = null;
      closeCompletionPopup();
    });

    popupConfirmBtn.addEventListener('click', () => {
      if (!pendingCompletionData) {
        closeCompletionPopup();
        return;
      }

      updateTimeData(
        pendingCompletionData.startTime,
        pendingCompletionData.stopTime,
        pendingCompletionData.totalTime,
        pendingCompletionData.description,
        pendingCompletionData.date,
        pendingCompletionData.caseId,
        originalStartTime,
      );

      pendingCompletionData = null;
      closeCompletionPopup();
      document.body.removeChild(overlay);
    });
    return overlay;
  }

  return div;
}
