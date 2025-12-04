import { renderHomePage } from '../pages/home';
import { renderLoginPage } from '../pages/loginPage/login';
import { renderCasesPage } from '../pages/cases';
import { renderClientsPage } from '../pages/clients';
import { renderMyProfilePage } from '../pages/myProfile';
import { renderStaffPage } from '../pages/staff';
import { isAuthenticated } from '../auth/auth';

export function resolveRoute(path: string): HTMLElement {
  // If not authenticated, always go to login
  if (!isAuthenticated() && path !== '/login' && path !== '/home') {
    document.location.href = '/login';
  }

  switch (path) {
    case '/login':
      return renderLoginPage();

    case '/cases':
      return renderCasesPage();

    case '/clients':
      return renderClientsPage();

    case '/myProfile':
      return renderMyProfilePage();

    case '/staff':
        // Admin only access
        if (!isAdmin()) {
                // Redirect user away
                navigate('/dashboard');
                const denied = document.createElement('div');
                denied.innerHTML = `<h2 class="p-4">Access denied — Admins only</h2>`;
                return denied;
              }
      return renderStaffPage();

    default:
      return renderHomePage();
  }
}
