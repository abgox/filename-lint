import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import fg from "fast-glob";
import { minimatch } from "minimatch";
import { init, localize } from "vscode-nls-i18n";

import type { dataType, configType } from "./types";
import { getConfig } from "./config";

export function activate(context: vscode.ExtensionContext) {
  init(context.extensionPath); // init i18n

  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  const programData = new Map<string, dataType>();

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
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)!;
      const { config, collection } = programData.get(
        workspaceFolder.uri.toString()!
      )!;

      createdFiles.clear();
      createdFiles.set(uri, uri);

      validateAndMark(uri, config, collection);
    }

    const createdFiles = new Map();

    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidCreate((uri) => handler(uri));
    // Only the file in the .vscode directory will trigger change event, so we don't need to listen to it
    // watcher.onDidChange((uri) => handler(uri, "change"));
    watcher.onDidDelete((uri) => {
      const filePath = uri.fsPath;
      fs.stat(filePath, (err) => {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)!;
        const { config, collection } = programData.get(
          workspaceFolder.uri.toString()!
        )!;

        collection.delete(uri);

        if (err) {
          // If file is not exist, it's delete operation
          return;
        }

        // It's create and delete operation, so we need to validate and mark it again
        createdFiles.forEach((uri) => {
          validateAndMark(uri, config, collection);
        });
      });
    });
    return watcher;
  }

  async function scanWorkspace() {
    programData.forEach(({ collection }) => {
      collection.dispose();
    });
    programData.clear();
    workspaceFolders.forEach(async (folder) => {
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
        for (const p of files) {
          validateAndMark(vscode.Uri.file(p), config, collection);
        }
      }
    });
  }

  function validateFileName(filePath: string, namePattern: RegExp) {
    const basename = path.basename(filePath).replace(/\.[^/.]+$/, "");
    if (basename.length) {
      return namePattern.test(basename);
    }
    return true;
  }

  // mark file or directory with diagnostic if it's invalid
  async function validateAndMark(
    uri: vscode.Uri,
    config: configType,
    collection: vscode.DiagnosticCollection
  ) {
    let relativePath = vscode.workspace.asRelativePath(uri.fsPath);

    if (workspaceFolders.length > 1) {
      // Remove workspace folder name from relative path
      relativePath = relativePath.replace(/^[^/\\]+[/\\]/, "");
    }

    const isFileExcluded = config.excludePatterns.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    );
    const isFileIncluded = config.includePatterns.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    );

    if (
      isFileExcluded ||
      !isFileIncluded ||
      validateFileName(uri.fsPath, config.currentPattern)
    ) {
      collection.delete(uri);
      return;
    }

    const nlsKey = (await isDirectory(uri))
      ? "filename-lint.invalid-dir-name"
      : "filename-lint.invalid-file-name";

    const message = localize(nlsKey, config.namingPattern);

    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 10),
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
