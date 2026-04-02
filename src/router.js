export class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    this.onNavigate = null;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  register(pageId, renderFn) {
    this.routes[pageId] = renderFn;
  }

  navigate(pageId) {
    window.location.hash = pageId;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.currentPage = hash;
    if (this.onNavigate) this.onNavigate(hash);
  }

  getCurrentPage() {
    return window.location.hash.slice(1) || 'dashboard';
  }

  start() {
    this.handleRoute();
  }
}

export const router = new Router();
