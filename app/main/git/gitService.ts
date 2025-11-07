import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { CommitNode } from "../types";
import { MAX_COMMITS_TO_LOAD } from "../../shared/constants";
import { findGitExecutable } from "../utils/gitHelper";

export class GitService {
  private git: SimpleGit;

  constructor(private repoPath: string) {
    // Use the found Git executable path
    const gitPath = findGitExecutable();
    this.git = simpleGit(repoPath, {
      binary: gitPath,
      unsafe: {
        allowUnsafeCustomBinary: true, // Required for paths with spaces like "Program Files"
      },
    });
  }

  /**
   * Check if the given path is a valid git repository
   */
  static isGitRepo(repoPath: string): boolean {
    try {
      const gitDir = path.join(repoPath, ".git");
      return fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get the full commit log with all branches
   */
  async getFullLog(): Promise<CommitNode[]> {
    try {
      const format = {
        commit: "%H",
        parents: "%P",
        author: "%an",
        email: "%ae",
        date: "%ad",
        message: "%s",
        refs: "%D",
      };

      const delimiter = "|||";
      const formatString = Object.values(format).join(delimiter);

      const result = await this.git.raw([
        "log",
        "--all",
        "--date=iso-strict",
        `--pretty=format:${formatString}`,
        `-n`,
        MAX_COMMITS_TO_LOAD.toString(),
      ]);

      const commits: CommitNode[] = [];
      const lines = result.trim().split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split(delimiter);
        if (parts.length < 6) continue;

        const commit: CommitNode = {
          id: parts[0],
          parents: parts[1] ? parts[1].split(" ") : [],
          author: parts[2],
          email: parts[3],
          date: parts[4],
          message: parts[5],
          refs: parts[6] ? this.parseRefs(parts[6]) : [],
        };

        commits.push(commit);
      }

      return commits;
    } catch (error) {
      console.error("Error getting full log:", error);
      throw new Error(`Failed to get git log: ${error}`);
    }
  }

  /**
   * Get a single commit by hash
   */
  async getCommit(hash: string): Promise<CommitNode> {
    try {
      const format = {
        commit: "%H",
        parents: "%P",
        author: "%an",
        email: "%ae",
        date: "%ad",
        message: "%s",
        refs: "%D",
      };

      const delimiter = "|||";
      const formatString = Object.values(format).join(delimiter);

      const result = await this.git.raw([
        "show",
        "-s",
        "--date=iso-strict",
        `--pretty=format:${formatString}`,
        hash,
      ]);

      const parts = result.trim().split(delimiter);
      if (parts.length < 6) {
        throw new Error("Invalid commit format");
      }

      return {
        id: parts[0],
        parents: parts[1] ? parts[1].split(" ") : [],
        author: parts[2],
        email: parts[3],
        date: parts[4],
        message: parts[5],
        refs: parts[6] ? this.parseRefs(parts[6]) : [],
      };
    } catch (error) {
      console.error(`Error getting commit ${hash}:`, error);
      throw new Error(`Failed to get commit: ${error}`);
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch (error) {
      console.error("Error getting current branch:", error);
      return "HEAD";
    }
  }

  /**
   * Get all branch names
   */
  async getBranches(): Promise<string[]> {
    try {
      const result = await this.git.branch(["-a"]);
      return result.all;
    } catch (error) {
      console.error("Error getting branches:", error);
      return [];
    }
  }

  /**
   * Parse refs string into array of ref names
   */
  parseRefs(refs: string): string[] {
    if (!refs || refs.trim() === "") return [];

    return refs
      .split(",")
      .map((ref) => ref.trim())
      .filter((ref) => ref !== "");
  }

  /**
   * Get the repository root path
   */
  async getRepoRoot(): Promise<string> {
    try {
      const result = await this.git.revparse(["--show-toplevel"]);
      return result.trim();
    } catch (error) {
      return this.repoPath;
    }
  }

  /**
   * Get the last N commits from HEAD
   */
  async getRecentCommits(count: number = 10): Promise<CommitNode[]> {
    try {
      const format = {
        commit: "%H",
        parents: "%P",
        author: "%an",
        email: "%ae",
        date: "%ad",
        message: "%s",
        refs: "%D",
      };

      const delimiter = "|||";
      const formatString = Object.values(format).join(delimiter);

      const result = await this.git.raw([
        "log",
        "--date=iso-strict",
        `--pretty=format:${formatString}`,
        `-n`,
        count.toString(),
      ]);

      const commits: CommitNode[] = [];
      const lines = result.trim().split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split(delimiter);
        if (parts.length < 6) continue;

        commits.push({
          id: parts[0],
          parents: parts[1] ? parts[1].split(" ") : [],
          author: parts[2],
          email: parts[3],
          date: parts[4],
          message: parts[5],
          refs: parts[6] ? this.parseRefs(parts[6]) : [],
        });
      }

      return commits;
    } catch (error) {
      console.error("Error getting recent commits:", error);
      return [];
    }
  }
}
