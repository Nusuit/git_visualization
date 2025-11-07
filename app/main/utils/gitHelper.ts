import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

/**
 * Find Git executable on Windows
 */
export function findGitExecutable(): string {
  // Common Git installation paths on Windows
  const possiblePaths = [
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe",
    "C:\\Program Files (x86)\\Git\\bin\\git.exe",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Programs",
      "Git",
      "cmd",
      "git.exe"
    ),
  ];

  // Try to find git in PATH first
  try {
    const gitPath = execSync("where git", { encoding: "utf8" })
      .trim()
      .split("\n")[0];
    if (gitPath && fs.existsSync(gitPath)) {
      console.log("[GitHelper] Found Git in PATH:", gitPath);
      return gitPath;
    }
  } catch (error) {
    console.log(
      "[GitHelper] Git not found in PATH, trying common locations..."
    );
  }

  // Try common installation paths
  for (const gitPath of possiblePaths) {
    if (fs.existsSync(gitPath)) {
      console.log("[GitHelper] Found Git at:", gitPath);
      return gitPath;
    }
  }

  throw new Error(
    "Git is not installed or could not be found.\n\n" +
      "Please install Git from: https://git-scm.com/downloads\n" +
      'Make sure to select "Git from the command line and also from 3rd-party software" during installation.'
  );
}

/**
 * Check if Git is available
 */
export function isGitAvailable(): boolean {
  try {
    findGitExecutable();
    return true;
  } catch (error) {
    return false;
  }
}
