import { http } from '../../api/http';
import './timeTab.scss';

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

// helper constants and functions for time calculations
const OVERTIME_START_MINUTES = 15 * 60; // 15:00

function timeToMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  const [h = 0, m = 0] = parts;
  return h * 60 + m; // ignore seconds
}

function minutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function isInCurrentMonth(entry: TimeEntry): boolean {
  const [dayStr, monthStr, yearStr] = entry.date.split('-');
  const day = Number(dayStr);
  const month = Number(monthStr); // 1–12
  const year = Number(yearStr);

  if (!day || !month || !year) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JS months are 0-based

  return year === currentYear && month === currentMonth;
}

function getMonthKey(entry: TimeEntry): string | null {
  const [dayStr, monthStr, yearStr] = entry.date.split('-');
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  if (!day || !month || !year) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
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

    timeContent.innerHTML = renderTimeList(entries, entityType);
  } catch (e) {
    console.error('Error loading time entries', e);
  }
}

function renderTimeList(entries: TimeEntry[], entityType: EntityType) {
  if (!entries || entries.length === 0) {
    return `
      <div class="card bg-card-bg border-0 shadow-sm mt-3">
        <div class="card-body text-center text-muted py-4">
          No time registrations yet.
        </div>
      </div>
    `;
  }

  // sort newest first (by date + startTime)
  const sorted = [...entries].sort((a, b) => {
    const [ad, am, ay] = a.date.split('-').map(Number); // DD-MM-YYYY
    const [bd, bm, by] = b.date.split('-').map(Number);

    const [ah, aMin, aSec] = a.startTime.split(':').map(Number);
    const [bh, bMin, bSec] = b.startTime.split(':').map(Number);

    const aTime = new Date(ay, am - 1, ad, ah, aMin, aSec).getTime();
    const bTime = new Date(by, bm - 1, bd, bh, bMin, bSec).getTime();

    return bTime - aTime; // descending: newest first
  });

  // Cases: total hours over all registrations, no month/overtime logic
  if (entityType === 'cases') {
    let totalMinutes = 0;

    sorted.forEach((t) => {
      const start = timeToMinutes(t.startTime);
      const stop = timeToMinutes(t.stopTime);
      if (isNaN(start) || isNaN(stop) || stop <= start) return;
      totalMinutes += stop - start;
    });

    const totalStr = minutesToHHMM(totalMinutes);

    return `
      <div class="card bg-card-bg border-0 shadow-sm mt-3">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="fw-semibold">Time registrations</span>
            <span class="badge bg-secondary text-primary ms-2">${sorted.length}</span>
          </div>
          <div>
            <span class="badge bg-primary">Total hours: ${totalStr}</span>
          </div>
        </div>
        <ul class="list-group list-group-flush time-list">
          ${sorted
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

  // staff: existing month + overtime logic
  const byMonth = new Map<string, TimeEntry[]>();

  sorted.forEach((t) => {
    const key = getMonthKey(t);
    if (!key) return;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(t);
  });

  if (byMonth.size === 0) {
    return `
      <div class="card bg-card-bg border-0 shadow-sm mt-3">
        <div class="card-body text-center text-muted py-4">
          No time registrations yet.
        </div>
      </div>
    `;
  }

  const monthKeys = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));

  const monthSections = monthKeys
    .map((key) => {
      const monthEntries = byMonth.get(key)!;

      let regularMinutesTotal = 0;
      let overtimeMinutesTotal = 0;

      monthEntries.forEach((t) => {
        const start = timeToMinutes(t.startTime);
        const stop = timeToMinutes(t.stopTime);
        if (isNaN(start) || isNaN(stop) || stop <= start) return;

        const total = stop - start;
        const overtime = Math.max(0, stop - Math.max(start, OVERTIME_START_MINUTES));
        const regular = Math.max(0, total - overtime);

        regularMinutesTotal += regular;
        overtimeMinutesTotal += overtime;
      });

      const regularTotalStr = minutesToHHMM(regularMinutesTotal);
      const overtimeTotalStr = minutesToHHMM(overtimeMinutesTotal);
      const monthLabel = formatMonthLabel(key);

      return `
        <div class="card bg-card-bg border-0 shadow-sm mt-3">
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="flex-grow-1 me-2">
              <span class="fw-semibold d-block text-truncate">
                Time registrations · ${monthLabel}
              </span>
              <span class="badge bg-secondary text-primary mt-1">
                ${monthEntries.length}
              </span>
            </div>
            <div class="d-flex flex-wrap justify-content-end gap-2 flex-shrink-1">
              <span class="badge bg-success text-wrap">
                Normal: ${regularTotalStr}
              </span>
              <span class="badge bg-warning text-dark text-wrap">
                Overtime<span class="d-none d-sm-inline"> (after 15:00)</span>: ${overtimeTotalStr}
              </span>
            </div>
          </div>
          <ul class="list-group list-group-flush time-list">
            ${monthEntries
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
    })
    .join('');

  return monthSections;
}
