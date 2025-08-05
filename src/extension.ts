import * as vscode from "vscode";
import * as path from "path";
import os from "os";
import fg from "fast-glob";
import { minimatch } from "minimatch";
import pLimit from "p-limit";
import { init, localize } from "vscode-nls-i18n";

import type { dataType, configType } from "./types.js";
import { getConfig } from "./config.js";

export function activate(context: vscode.ExtensionContext) {
  init(context.extensionPath); // init i18n

  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  const programData = new Map<string, dataType>();
  const cpuCount = os.cpus().length;
  const folderConcurrency = Math.min(5, cpuCount);
  const fileConcurrency = Math.min(20, cpuCount * 2);

  scanWorkspace();

  context.subscriptions.push(
    // Add event listener to rescan workspace when changed
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("filename-lint")) {
        scanWorkspace();
      }
    }),
    // Add command to manually check all workspace folders
    vscode.commands.registerCommand(
      "filename-lint.check-manually",
      async () => {
        await scanWorkspace();
        vscode.window.showInformationMessage(
          localize("filename-lint.check-completely")
        );
      }
    ),
    setupFileWatcher()
  );

  function setupFileWatcher() {
    function handler(uri: vscode.Uri) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        return;
      }
      const data = programData.get(workspaceFolder.uri.toString());
      if (!data) {
        return;
      }

      validateAndMark(uri, data.config, data.collection);
    }

    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidCreate((uri) => handler(uri));
    watcher.onDidDelete((uri) => {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        return;
      }
      const data = programData.get(workspaceFolder.uri.toString());
      if (!data) {
        return;
      }

      data.collection.delete(uri);
    });
    return watcher;
  }

  async function scanWorkspace() {
    programData.forEach(({ collection }) => {
      collection.dispose();
    });
    programData.clear();

    const folderLimit = pLimit(folderConcurrency);

    await Promise.all(
      workspaceFolders.map((folder) =>
        folderLimit(async () => {
          const uri = folder.uri;
          const config = getConfig(uri);
          const collection = vscode.languages.createDiagnosticCollection(
            `filename-lint-diagnostic-${uri.toString()}`
          );

          programData.set(uri.toString(), { config, collection });

          if (config.enabled) {
            const files = await fg(config.includePatterns, {
              cwd: uri.fsPath,
              ignore: config.excludePatterns,
              dot: true,
              onlyFiles: false,
              absolute: true,
              suppressErrors: true,
            });

            const fileLimit = pLimit(fileConcurrency);
            await Promise.all(
              files.map((p) =>
                fileLimit(() =>
                  validateAndMark(vscode.Uri.file(p), config, collection)
                )
              )
            );
          }
        })
      )
    );
  }

  function validateFileName(filePath: string, namePattern: RegExp) {
    const { name } = path.parse(filePath);
    if (name.length) {
      return namePattern.test(name);
    }
    return true;
  }

  // mark file or directory with diagnostic if it's invalid
  async function validateAndMark(
    uri: vscode.Uri,
    config: configType,
    collection: vscode.DiagnosticCollection
  ) {
    if (config.enabled === false) {
      collection.delete(uri);
      return;
    }
    let relativePath = vscode.workspace.asRelativePath(uri.fsPath);

    if (workspaceFolders.length > 1) {
      // Remove workspace folder name from relative path
      relativePath = relativePath.replace(/^[^/\\]+[/\\]/, "");
    }

    const isFileIncluded = config.includePatterns.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    );

    if (!isFileIncluded) {
      collection.delete(uri);
      return;
    }

    const isFileExcluded = config.excludePatterns.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    );

    if (isFileExcluded) {
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

// This method is called when your extension is deactivated
export function deactivate() {}
