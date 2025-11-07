import { createGitgraph, GitgraphOptions, Commit } from '@gitgraph/js';
import { CommitNode } from '../types';

export interface GraphConfig {
  orientation?: 'vertical-reverse' | 'horizontal' | 'horizontal-reverse';
  mode?: 'compact' | 'extended';
}

export class GitGraphRenderer {
  private gitgraph: any = null;
  private container: HTMLElement;
  private branches: Map<string, any> = new Map();
  private commitMap: Map<string, any> = new Map();

  constructor(container: HTMLElement, config: GraphConfig = {}) {
    this.container = container;
    this.initialize(config);
  }

  private initialize(config: GraphConfig): void {
    // Clear container
    this.container.innerHTML = '';

    const options: GitgraphOptions = {
      orientation: config.orientation || 'vertical-reverse',
      mode: config.mode || 'compact',
      template: {
        colors: ['#5865F2', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4'],
        branch: {
          lineWidth: 4,
          spacing: 50,
          label: {
            display: true,
            bgColor: '#2d2d2d',
            color: '#e0e0e0',
            borderRadius: 10,
          },
        },
        commit: {
          spacing: 60,
          dot: {
            size: 10,
          },
          message: {
            display: true,
            displayAuthor: true,
            displayHash: false,
            color: '#e0e0e0',
            font: 'normal 12px "Segoe UI", sans-serif',
          },
        },
        arrow: {
          size: 8,
          color: '#4e4e4e',
        },
      },
    };

    this.gitgraph = createGitgraph(this.container, options);
  }

  /**
   * Render commits on the graph
   */
  renderCommits(commits: CommitNode[]): void {
    if (!this.gitgraph || commits.length === 0) return;

    // Clear existing data
    this.branches.clear();
    this.commitMap.clear();
    this.container.innerHTML = '';
    this.initialize({});

    // Sort commits by date (oldest first for building graph)
    const sortedCommits = [...commits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Build branch structure
    const branchCommits = new Map<string, CommitNode[]>();
    const mainBranch = this.gitgraph.branch('main');
    this.branches.set('main', mainBranch);

    // Simplified rendering: just show commits in chronological order
    sortedCommits.forEach((commit) => {
      try {
        const branchName = this.extractBranchName(commit);
        let branch = this.branches.get(branchName);

        if (!branch) {
          branch = this.gitgraph.branch(branchName);
          this.branches.set(branchName, branch);
        }

        const commitData = {
          subject: commit.message,
          author: `${commit.author} <${commit.email}>`,
          hash: commit.id.substring(0, 7),
          style: {
            dot: {
              color: this.getCommitColor(commit),
            },
          },
        };

        const graphCommit = branch.commit(commitData);
        this.commitMap.set(commit.id, graphCommit);
      } catch (error) {
        console.error('Error rendering commit:', error);
      }
    });
  }

  /**
   * Add a new commit to the graph with animation
   */
  addCommit(commit: CommitNode): void {
    if (!this.gitgraph) return;

    try {
      const branchName = this.extractBranchName(commit);
      let branch = this.branches.get(branchName);

      if (!branch) {
        branch = this.gitgraph.branch(branchName);
        this.branches.set(branchName, branch);
      }

      const commitData = {
        subject: commit.message,
        author: `${commit.author} <${commit.email}>`,
        hash: commit.id.substring(0, 7),
        style: {
          dot: {
            color: this.getCommitColor(commit),
          },
        },
      };

      const graphCommit = branch.commit(commitData);
      this.commitMap.set(commit.id, graphCommit);
    } catch (error) {
      console.error('Error adding commit:', error);
    }
  }

  /**
   * Extract branch name from commit refs
   */
  private extractBranchName(commit: CommitNode): string {
    if (!commit.refs || commit.refs.length === 0) {
      return 'main';
    }

    // Find first branch reference
    for (const ref of commit.refs) {
      // HEAD -> branch
      const headMatch = ref.match(/HEAD -> (.+)/);
      if (headMatch) return headMatch[1];

      // origin/branch
      const originMatch = ref.match(/origin\/(.+)/);
      if (originMatch) return originMatch[1];

      // Just branch name
      if (!ref.includes('/') && !ref.includes('tag:')) {
        return ref;
      }
    }

    return 'main';
  }

  /**
   * Get color for commit based on type
   */
  private getCommitColor(commit: CommitNode): string {
    if (commit.parents.length > 1) {
      return '#EF4444'; // Red for merge commits
    }

    if (commit.refs && commit.refs.some((ref) => ref.includes('tag:'))) {
      return '#EAB308'; // Yellow for tags
    }

    return '#5865F2'; // Blue for regular commits
  }

  /**
   * Clear the graph
   */
  clear(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.branches.clear();
    this.commitMap.clear();
    if (this.gitgraph) {
      this.gitgraph = null;
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.clear();
  }
}

