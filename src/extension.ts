import * as vscode from "vscode";
import * as path from "path";
import os from "os";
import fg from "fast-glob";
import { minimatch } from "minimatch";
import pLimit from "p-limit";
import { init, localize } from "vscode-nls-i18n";

import type { dataType, configType } from "./types.js";
import { getConfig } from "./config.js";

const output = vscode.window.createOutputChannel("filename-lint", {
  log: true,
});

let isChecking = false;
let checkTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  init(context.extensionPath);

  output.info("[filename-lint] Extension activated");

  const programData = new Map<string, dataType>();
  const cpuCount = os.cpus().length;
  const folderConcurrency = Math.min(5, cpuCount);
  const fileConcurrency = Math.min(20, cpuCount * 2);

  function getCurrentWorkspaceFolders() {
    return vscode.workspace.workspaceFolders || [];
  }

  const safeCheck = () => {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: localize("filename-lint.check-workspace"),
        },
        async () => await checkWorkspace()
      );
    }, 400);
  };

  // 初始化检查
  safeCheck();

  // 当配置变化时重新检查
  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("filename-lint")) {
      output.info(
        "[filename-lint] Configuration changed — rechecking workspace..."
      );
      safeCheck();
    }
  });

  // 注册手动检查命令
  const manualCheck = vscode.commands.registerCommand(
    "filename-lint.check-manually",
    async () => {
      output.info("[filename-lint] Manual check triggered");
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: localize("filename-lint.check-workspace"),
        },
        async () => {
          await checkWorkspace();
        }
      );
      vscode.window.showInformationMessage(
        localize("filename-lint.check-completely")
      );
    }
  );

  // 文件变动监听
  const watcher = setupFileWatcher();

  context.subscriptions.push(configWatcher, manualCheck, watcher);

  async function checkWorkspace() {
    if (isChecking) {
      output.info(
        "[filename-lint] Check already in progress, skipping duplicate call."
      );
      return;
    }

    isChecking = true;
    output.info("[filename-lint] Checking workspace...");

    try {
      // 清理旧诊断
      programData.forEach(({ collection }) => collection.dispose());
      programData.clear();

      const folderLimit = pLimit(folderConcurrency);

      await Promise.all(
        getCurrentWorkspaceFolders().map((folder) =>
          folderLimit(async () => {
            const uri = folder.uri;
            const config = getConfig(uri);
            const collection = vscode.languages.createDiagnosticCollection(
              `filename-lint-diagnostic-${uri.toString()}`
            );

            programData.set(uri.toString(), { config, collection });

            if (!config.enabled) {
              output.warn(
                `[filename-lint] Lint disabled for folder: ${uri.fsPath}`
              );
              return;
            }

            const files = await fg(config.includePatterns, {
              cwd: uri.fsPath,
              ignore: config.excludePatterns,
              dot: true,
              onlyFiles: false,
              absolute: true,
              suppressErrors: true,
            });

            output.info(
              `[filename-lint] Checking ${files.length} items in ${uri.fsPath}`
            );

            const fileLimit = pLimit(fileConcurrency);
            await Promise.all(
              files.map((p) =>
                fileLimit(() =>
                  validateAndMark(vscode.Uri.file(p), config, collection)
                )
              )
            );
          })
        )
      );

      output.info("[filename-lint] Workspace check completed ✅");
    } catch (error) {
      output.error(`[filename-lint] Check failed: ${String(error)}`);
      vscode.window.showErrorMessage(
        `[filename-lint] Workspace check failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      isChecking = false;
    }
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
      type: "create" | "change" | "delete"
    ) => {
      const key = uri.toString();

      if (uriTasks.has(key)) {
        await uriTasks.get(key);
      }

      const task = (async () => {
        output.info(`[filename-lint] File ${typeLabels[type]}: ${uri.fsPath}`);
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
          return;
        }

        await validateAndMark(uri, data.config, data.collection);
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
    collection: vscode.DiagnosticCollection
  ) {
    if (!config.enabled) {
      collection.delete(uri);
      return;
    }

    let relativePath = vscode.workspace.asRelativePath(uri.fsPath);
    if (getCurrentWorkspaceFolders().length > 1) {
      relativePath = relativePath.replace(/^[^/\\]+[/\\]/, "");
    }

    const included = config.includePatterns.some((p) =>
      minimatch(relativePath, p, { dot: true })
    );
    if (!included) {
      collection.delete(uri);
      return;
    }

    const excluded = config.excludePatterns.some((p) =>
      minimatch(relativePath, p, { dot: true })
    );
    if (excluded) {
      collection.delete(uri);
      return;
    }

    if (validateFileName(uri.fsPath, config.currentPattern)) {
      collection.delete(uri);
      return;
    }

    const nlsKey = (await isDirectory(uri))
      ? "filename-lint.invalid-dir-name"
      : "filename-lint.invalid-file-name";

    const message = localize(nlsKey, config.namingPattern);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 0),
      message,
      vscode.DiagnosticSeverity.Warning
    );
    diagnostic.source = "filename-lint";

    collection.set(uri, [diagnostic]);
    output.warn(`[filename-lint] Invalid name detected: ${relativePath}`);
  }

  function validateFileName(filePath: string, namePattern: RegExp) {
    const { name } = path.parse(filePath);
    return name ? namePattern.test(name) : true;
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
  output.info("[filename-lint] Extension deactivated");
}
