export interface CommitNode {
  id: string;
  parents: string[];
  author: string;
  email: string;
  date: string;
  message: string;
  refs?: string[];
}

export interface InitialGraphPayload {
  repoPath: string;
  commits: CommitNode[];
}

export type GitEventType = 'commit' | 'merge' | 'checkout' | 'push';

export interface GitEventPayload {
  type: GitEventType;
  commit?: CommitNode;
  ref?: string;
  commitId?: string;
  remote?: string;
  branch?: string;
}

export interface ToastPayload {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface ToastItem extends ToastPayload {
  id: string;
  timestamp: number;
}

