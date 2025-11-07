export const SOCKET_PORT = 53211;
export const HTTP_SERVER_PORT = 53210;
export const HTTP_SERVER_HOST = '127.0.0.1';

export const SOCKET_EVENTS = {
  INITIAL_GRAPH: 'initial_graph',
  GIT_EVENT: 'git_event',
  TOAST: 'toast',
  ERROR: 'error',
} as const;

export const GIT_EVENT_TYPES = {
  COMMIT: 'commit',
  MERGE: 'merge',
  CHECKOUT: 'checkout',
  PUSH: 'push',
} as const;

export const FILE_WATCHER_DEBOUNCE_MS = 200;
export const MAX_COMMITS_TO_LOAD = 5000;

