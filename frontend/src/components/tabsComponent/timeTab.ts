import { http } from '../../api/http';

type EntityType = 'clients' | 'cases' | 'users';

export interface TimeTabConfig {
  entityType: EntityType;
  entityId: string;
  container: HTMLElement;
}

interface TimeEntry {
  _id: string;
  caseId?: string;
  userId?: string;
  userName: string;
  date: string;
  startTime: string;
  stopTime: string;
  totalTime: string;
  description: string;
}

export async function loadTimeEntries(config: TimeTabConfig) {
  const { entityType, entityId, container } = config;

  try {
    const entries = (await http.get(`/times/${entityType}/${entityId}`)) as TimeEntry[];

    // Filter out incomple entries
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!entry.startTime || !entry.stopTime || entry.totalTime === '00:00') {
        entries.splice(i, 1);
      }
    }

    const timeContent = container.querySelector('#times-content') as HTMLElement | null;
    if (!timeContent) return;

    timeContent.innerHTML = renderTimeList(entries);
  } catch (e) {
    console.error('Error loading time entries', e);
  }
}

function renderTimeList(entries: TimeEntry[]) {
  if (!entries || entries.length === 0) {
    return `
      <div class="card bg-card-bg border-0 shadow-sm mt-3">
        <div class="card-body text-center text-muted py-4">
          No time registrations yet.
        </div>
      </div>
    `;
  }

  return `
    <div class="card bg-card-bg border-0 shadow-sm mt-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span class="fw-semibold">Time registrations</span>
        <span class="badge bg-secondary">${entries.length}</span>
      </div>
      <ul class="list-group list-group-flush time-list">
        ${entries
          .map(
            (t) => `
          <li class="list-group-item bg-transparent time-list-item">
            <div class="d-flex justify-content-between flex-wrap gap-2">
              <div class="time-main">
                <div class="fw-semibold">
                  <i class="fa-regular fa-clock me-1"></i>
                  ${t.date} · ${t.startTime}–${t.stopTime}
                </div>
                <div class="small text-muted">
                  ${t.userName}${t.caseId ? ` · Case: ${t.caseId}` : ''}
                </div>
              </div>
              <div class="text-end">
                <span class="badge bg-primary rounded-pill">
                  ${t.totalTime}
                </span>
              </div>
            </div>
            ${
              t.description
                ? `<div class="mt-2 small text-body-secondary">
                     ${t.description}
                   </div>`
                : ''
            }
          </li>
        `,
          )
          .join('')}
      </ul>
    </div>
  `;
}
