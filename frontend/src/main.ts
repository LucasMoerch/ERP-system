import './styles/custom.scss';
import { renderTimeTracker } from './components/timeTracker/timeTracker';
import '@fortawesome/fontawesome-free/css/all.min.css';

import { resolveRoute } from './routers/router';
import { renderHeaderAndNavbar } from './components/navbar';
import { getPageTitle } from './components/navbar';
import { initAuth, isAuthenticated } from './auth/auth';

function render() {
  const app = document.getElementById('app')! as HTMLElement;
  app.innerHTML = ''; // clear old content
  app.appendChild(resolveRoute(location.pathname)); // insert new content

  const excludedPages = ['/login']; //pages where you dont want timeButton.

  if (
    !document.getElementById('time-tracker-button') &&
    !excludedPages.includes(location.pathname)
  ) {
    const tracker = renderTimeTracker();
    tracker.id = 'time-tracker-button'; //prevent duplicates
    document.body.appendChild(tracker);
  }
  // Renders the navbar on all pages
  if (!excludedPages.includes(location.pathname)) {
    document.body.style.overflow = ''; // reset overflow after hidden on login page

    document.body.style.paddingTop = '56px'; // match navbar height

    let navbar = document.getElementById('navbar-container');
    if (!navbar) {
      navbar = document.createElement('div');
      navbar.id = 'navbar-container';
      navbar.appendChild(renderHeaderAndNavbar());
      document.body.prepend(navbar);
    }
  } else {
    const navbar = document.getElementById('navbar-container');
    if (navbar) {
      navbar.remove();
    }
  }

  // Update navbar title
  const titleElement = document.getElementById('navbar-title');
  if (titleElement) {
    titleElement.textContent = getPageTitle(location.pathname);
  }
}

// Handle navigation
export function navigate(path: string) {
  history.pushState({}, '', path);
  render();
  window.scrollTo(0, 0); // always start new page at top
}

// Initial load (including hard refresh)
window.addEventListener('load', () => {
  // hydrate "me" from /me and sessionStorage first
  initAuth().finally(() => {
    if (!isAuthenticated() && location.pathname !== '/login') {
      history.replaceState({}, '', '/login');
    }
    render();
  });
});

// Handle back/forward buttons
window.addEventListener('popstate', render);
