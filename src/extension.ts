import * as vscode from "vscode";
import { minimatch } from "minimatch";
import pLimit from "p-limit";

import type { dataType, configType } from "./types.js";
import { getConfig } from "./config.js";

const MSG_CHECK_WORKSPACE = "filename-lint.check-workspace";
const MSG_CHECK_COMPLETELY = "filename-lint.check-completely";
const MSG_INVALID_FILE = "filename-lint.invalid-file-name";
const MSG_INVALID_DIR = "filename-lint.invalid-dir-name";

const output = vscode.window.createOutputChannel("filename-lint", {
  log: true,
});

let isChecking = false;
let checkTimer: ReturnType<typeof setTimeout> | undefined;
let translations: Record<string, string> = {};

async function loadTranslations(extensionUri: vscode.Uri) {
  try {
    const bundlePath = vscode.Uri.joinPath(extensionUri, "package.nls.json");
    const bundleContent = await vscode.workspace.fs.readFile(bundlePath);
    const bundle = JSON.parse(new TextDecoder().decode(bundleContent));

    let localeBundle: Record<string, string> = {};
    const locale = vscode.env.language;
    if (locale !== "en") {
      for (const name of [locale, locale.split("-")[0]]) {
        const localePath = vscode.Uri.joinPath(extensionUri, `package.nls.${name}.json`);
        try {
          const localeContent = await vscode.workspace.fs.readFile(localePath);
          localeBundle = JSON.parse(new TextDecoder().decode(localeContent));
          break;
        } catch {
          // try next candidate
        }
      }
    }

    translations = { ...bundle, ...localeBundle };
  } catch (err) {
    output.warn(`Failed to load translations: ${String(err)}`);
  }
}

function t(key: string, ...args: Array<string | number>): string {
  const msg = translations[key] ?? key;
  return args.length > 0
    ? msg.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)]))
    : msg;
}

export function activate(context: vscode.ExtensionContext) {
  loadTranslations(context.extensionUri);
  output.info("Extension activated");

  const programData = new Map<string, dataType>();
  const folderConcurrency = 5;
  const fileConcurrency = 20;

  function getCurrentWorkspaceFolders() {
    return vscode.workspace.workspaceFolders || [];
  }

  const safeCheck = () => {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: t(MSG_CHECK_WORKSPACE),
        },
        async () => await checkWorkspace(),
      );
    }, 400);
  };

  safeCheck();

  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("filename-lint")) {
      output.info("Configuration changed — rechecking workspace...");
      safeCheck();
    }
  });

  const manualCheck = vscode.commands.registerCommand(
    "filename-lint.check-manually",
    async () => {
      output.info("Manual check triggered");
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: t(MSG_CHECK_WORKSPACE),
        },
        async () => {
          await checkWorkspace();
        },
      );
      vscode.window.showInformationMessage(t(MSG_CHECK_COMPLETELY));
    },
  );

  const watcher = setupFileWatcher();

  context.subscriptions.push(configWatcher, manualCheck, watcher);

  async function checkWorkspace() {
    if (isChecking) {
      output.info("Check already in progress, skipping duplicate call.");
      return;
    }

    isChecking = true;
    output.info("Checking workspace...");

    try {
      programData.forEach(({ collection }) => collection.dispose());
      programData.clear();

      const folderLimit = pLimit(folderConcurrency);

      await Promise.all(
        getCurrentWorkspaceFolders().map((folder) =>
          folderLimit(async () => {
            const config = getConfig(folder.uri);
            const collection = vscode.languages.createDiagnosticCollection(
              `filename-lint-diagnostic-${folder.uri.toString()}`,
            );

            programData.set(folder.uri.toString(), { config, collection });

            if (!config.enabled) {
              output.warn(`Lint disabled for folder: ${folder.name}`);
              return;
            }

            const files = await findWorkspaceFiles(
              folder,
              config.includePatterns,
              config.excludePatterns,
            );

            output.info(`Checking ${files.length} items in ${folder.name}`);

            const fileLimit = pLimit(fileConcurrency);
            await Promise.all(
              files.map((fileUri) =>
                fileLimit(() => validateAndMark(fileUri, config, collection)),
              ),
            );
          }),
        ),
      );

      output.info("Workspace check completed");
    } catch (error) {
      output.error(`Check failed: ${String(error)}`);
      vscode.window.showErrorMessage(
        `Workspace check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      isChecking = false;
    }
  }

  async function findWorkspaceFiles(
    folder: vscode.WorkspaceFolder,
    includePatterns: string[],
    excludePatterns: string[],
  ): Promise<vscode.Uri[]> {
    const results: vscode.Uri[] = [];

    async function walkDir(
      dirUri: vscode.Uri,
      relativeBase: string,
      depth: number,
    ) {
      if (depth > 8) {
        return;
      }
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(dirUri);
      } catch {
        return;
      }

      for (const [name, fileType] of entries) {
        const relPath = relativeBase ? `${relativeBase}/${name}` : name;
        const isDir = (fileType & vscode.FileType.Directory) !== 0;

        if (isDir) {
          const dirExcluded = excludePatterns.some((p) =>
            minimatch(relPath, p, { dot: true }),
          );
          if (dirExcluded) {
            continue;
          }
          await walkDir(vscode.Uri.joinPath(dirUri, name), relPath, depth + 1);
        } else {
          const included = includePatterns.some((p) =>
            minimatch(relPath, p, { dot: true }),
          );
          if (!included) {
            continue;
          }
          const fileExcluded = excludePatterns.some((p) =>
            minimatch(relPath, p, { dot: true }),
          );
          if (fileExcluded) {
            continue;
          }
          results.push(vscode.Uri.joinPath(dirUri, name));
        }
      }
    }

    const specificDirs = new Set<string>();
    let needsFullScan = false;

    for (const p of includePatterns) {
      const starStarMatch = p.match(/^\*\*\/([^/*]+)\//);
      if (starStarMatch) {
        specificDirs.add(starStarMatch[1]);
        continue;
      }
      if (p.startsWith("**")) {
        needsFullScan = true;
        continue;
      }
      const firstSegment = p.split("/")[0];
      if (firstSegment && firstSegment !== "*" && !firstSegment.includes("*")) {
        specificDirs.add(firstSegment);
      }
    }

    if (needsFullScan || specificDirs.size === 0) {
      await walkDir(folder.uri, "", 0);
    } else {
      let rootEntries: [string, vscode.FileType][];
      try {
        rootEntries = await vscode.workspace.fs.readDirectory(folder.uri);
      } catch {
        return results;
      }

      for (const [name, fileType] of rootEntries) {
        const isDir = (fileType & vscode.FileType.Directory) !== 0;

        if (isDir && specificDirs.has(name)) {
          const dirExcluded = excludePatterns.some((p) =>
            minimatch(name, p, { dot: true }),
          );
          if (!dirExcluded) {
            await walkDir(vscode.Uri.joinPath(folder.uri, name), name, 1);
          }
        } else if (!isDir) {
          const included = includePatterns.some((p) =>
            minimatch(name, p, { dot: true }),
          );
          if (included) {
            const fileExcluded = excludePatterns.some((p) =>
              minimatch(name, p, { dot: true }),
            );
            if (!fileExcluded) {
              results.push(vscode.Uri.joinPath(folder.uri, name));
            }
          }
        }
      }
    }

    return results;
  }

  function setupFileWatcher() {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*");

    const uriTasks = new Map<string, Promise<void>>();
    const typeLabels = {
      create: "created",
      change: "changed",
      delete: "deleted",
    } as const;

    const handleEvent = async (
      uri: vscode.Uri,
      type: "create" | "change" | "delete",
    ) => {
      const key = uri.toString();

      if (uriTasks.has(key)) {
        await uriTasks.get(key);
      }

      const task = (async () => {
        output.info(`File ${typeLabels[type]}: ${uri.path}`);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
          return;
        }

        const data = programData.get(workspaceFolder.uri.toString());
        if (!data) {
          return;
        }

        if (type === "delete") {
          data.collection.delete(uri);
          const parentUri = vscode.Uri.joinPath(uri, "..");
          await validateAndMark(parentUri, data.config, data.collection);
          return;
        }

        await validateAndMark(uri, data.config, data.collection);

        const isDir = await isDirectory(uri);
        if (isDir) {
          try {
            const childEntries = await vscode.workspace.fs.readDirectory(uri);
            for (const [childName, childType] of childEntries) {
              const childUri = vscode.Uri.joinPath(uri, childName);
              if ((childType & vscode.FileType.File) !== 0) {
                await validateAndMark(childUri, data.config, data.collection);
              }
            }
          } catch {
            // ignore
          }
        }
      })();

      uriTasks.set(key, task);
      await task.finally(() => uriTasks.delete(key));
    };

    watcher.onDidCreate((uri) => handleEvent(uri, "create"));
    watcher.onDidChange((uri) => handleEvent(uri, "change"));
    watcher.onDidDelete((uri) => handleEvent(uri, "delete"));

    return watcher;
  }

  async function validateAndMark(
    uri: vscode.Uri,
    config: configType,
    collection: vscode.DiagnosticCollection,
  ) {
    if (!config.enabled) {
      collection.delete(uri);
      return;
    }

    let relativePath = vscode.workspace.asRelativePath(uri);
    if (getCurrentWorkspaceFolders().length > 1) {
      relativePath = relativePath.replace(/^[^/\\]+[/\\]/, "");
    }

    const included = config.includePatterns.some((p) =>
      minimatch(relativePath, p, { dot: true }),
    );
    if (!included) {
      collection.delete(uri);
      return;
    }

    const excluded = config.excludePatterns.some((p) =>
      minimatch(relativePath, p, { dot: true }),
    );
    if (excluded) {
      collection.delete(uri);
      return;
    }

    const fileName = getFileName(uri);
    if (!fileName || config.currentPattern.test(fileName)) {
      collection.delete(uri);
      return;
    }

    const isDir = await isDirectory(uri);
    const template = isDir ? MSG_INVALID_DIR : MSG_INVALID_FILE;

    const message = t(template, config.namingPattern);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 0),
      message,
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.source = "filename-lint";

    collection.set(uri, [diagnostic]);
    output.warn(`Invalid name detected: ${relativePath}`);
  }

  function getFileName(uri: vscode.Uri): string | null {
    const segments = uri.path.split("/");
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) {
      return null;
    }
    const dotIndex = lastSegment.lastIndexOf(".");
    if (dotIndex <= 0) {
      return lastSegment;
    }
    return lastSegment.substring(0, dotIndex);
  }

  async function isDirectory(uri: vscode.Uri) {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return stat.type === vscode.FileType.Directory;
    } catch {
      return false;
    }
  }
}

export function deactivate() {
  output.info("Extension deactivated");
}
