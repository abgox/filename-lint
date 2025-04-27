import * as vscode from "vscode";
import * as path from "path";
import fg from "fast-glob";
import { minimatch } from "minimatch";
import { init, localize } from "vscode-nls-i18n";

export function activate(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection(
    "filename-lint-diagnostic"
  );
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  type configType = {
    enabled: boolean;
    namePattern: RegExp;
    presetPattern: string;
    customRegex: string;
    ignorePatterns: string[];
  };

  const getConfig = (): configType => {
    const c = vscode.workspace.getConfiguration("filename-lint");
    const config: configType = {
      enabled: c.get("enabled") as boolean,
      presetPattern: c.get("presetPattern") as string,
      customRegex: c.get("customRegex") as string,
      ignorePatterns: c.get("ignorePatterns") as string[],
      namePattern: /^[^A-Z]+$/, // default pattern is lowercase
    };

    switch (config.presetPattern) {
      case "lowercase":
        config.namePattern = /^[^A-Z]+$/;
        break;
      case "kebab-case":
        config.namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        break;
      case "snake_case":
        config.namePattern = /^[a-z0-9]+(_[a-z0-9]+)*$/;
        break;
      case "camelCase":
        config.namePattern = /^[a-z0-9]+[a-z0-9]*([A-Z][a-z0-9]*)*$/;
        break;
      case "PascalCase":
        config.namePattern = /^[A-Z]+[a-z0-9]*([A-Z0-9][a-z0-9]*)*$/;
        break;
      case "custom":
        config.namePattern = new RegExp(config.customRegex);
        break;
    }
    return config;
  };

  async function scanWorkspace(config: configType, enabled: boolean) {
    collection.clear();

    if (workspaceFolder && enabled) {
      const files = await fg("**", {
        cwd: workspaceFolder,
        ignore: config.ignorePatterns,
        dot: true,
        onlyFiles: false,
        absolute: true,
        suppressErrors: true,
      });

      for (const p of files) {
        validateAndMark(vscode.Uri.file(p), config);
      }
    }
  }

  const validatePath = (filePath: string, namePattern: RegExp) => {
    const basename = path.basename(filePath).replace(/\.[^/.]+$/, '');
    if(basename.length){
      return namePattern.test(basename);
    }
    return true;
  };

  // mark file or directory with diagnostic if it's invalid
  async function validateAndMark(uri: vscode.Uri, config: configType) {
    if (!validatePath(uri.fsPath, config.namePattern)) {
      const nlsKey = (await isDirectory(uri))
        ? "filename-lint.invalid-dir-name"
        : "filename-lint.invalid-file-name";

      const message = localize(
        nlsKey,
        config.presetPattern === "custom"
          ? config.customRegex
          : config.presetPattern // {0}
      );

      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 10),
        message,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = "filename-lint";
      collection.set(uri, [diagnostic]);
    } else {
      collection.delete(uri);
    }
  }

  async function isDirectory(uri: vscode.Uri) {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return stat.type === vscode.FileType.Directory;
    } catch {
      return false;
    }
  }

  function setupFileWatcher(config: configType) {
    const handler = async (uri: vscode.Uri) => {
      const ignored = await isFileIgnored(uri.fsPath, config.ignorePatterns);
      ignored ? collection.delete(uri) : validateAndMark(uri, config);
    };

    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidCreate((uri) => handler(uri));
    watcher.onDidChange((uri) => handler(uri));
    watcher.onDidDelete((uri) => collection.delete(uri));
    return watcher;
  }

  async function isFileIgnored(filePath: string, ignorePatterns: string[]) {
    return ignorePatterns.some((pattern) => minimatch(filePath, pattern));
  }

  init(context.extensionPath);
  console.log(localize("filename-lint.extension-activated"));

  context.subscriptions.push(collection);

  let watcher: vscode.FileSystemWatcher | undefined;
  const config = getConfig();

  const disposable = vscode.commands.registerCommand(
    "filename-lint.check-manually",
    async () => {
      await scanWorkspace(config, true);
      vscode.window.showInformationMessage(
        localize("filename-lint.check-completely")
      );
    }
  );
  context.subscriptions.push(disposable);

  if (config.enabled) {
    scanWorkspace(config, config.enabled);

    watcher = setupFileWatcher(config);
    context.subscriptions.push(watcher);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("filename-lint")) {
        if (watcher) {
          watcher.dispose();
          context.subscriptions.splice(
            context.subscriptions.indexOf(watcher),
            1
          );
        }
        const newConfig = getConfig();
        if (newConfig.enabled) {
          watcher = setupFileWatcher(newConfig);
          context.subscriptions.push(watcher);
        }

        scanWorkspace(newConfig, newConfig.enabled);
      }
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
