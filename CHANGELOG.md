[简体中文](./CHANGELOG.zh-CN.md)

# Changelog

## 0.3.0

- Add web extension support (VS Code for the Web).
- Replace tsc with esbuild for bundling, output to `dist/desktop/` and `dist/web/`.
- Replace `fast-glob` with `vscode.workspace.fs` for file scanning, fully compatible with web environment.
- Replace `vscode-nls-i18n` with custom translation loading from existing NLS files, no extra dependencies needed.
- Add `MANDATORY_EXCLUDES` for common directories (`.git`, `.jj`, `.svn`, `.hg`, `.idea`, `.vscode`, `node_modules`, `out`, `dist`, `build`, `.nyc_output`, `coverage`), users can override via `includePatterns`.
- Optimize directory traversal with smart pattern parsing to skip irrelevant directories.
- Improve file watcher to re-validate parent directory on file deletion and check child files on directory creation.
- Other fixes and optimizations.

## 0.2.1

- Add progress notifications during workspace checks.
- Add detailed log output.
- Optimize file change monitoring processing.
- Other fixes and optimizations.

## 0.2.0

- Modified the default value of `filename-lint.excludePatterns`.
  - `["**/.git/**", "**/.idea/**", "**/node_modules/**"]` => `[]`
  - These directories will be directly excluded without the need for additional specification.
  - If you have to include them, you can specify them in `filename-lint.includePatterns`.
- Other fixes and optimizations.

## 0.1.2

- Update config description.

## 0.1.1

- Optimize the file watcher and performance.
- Other fixes and optimizations.

## 0.1.0

- Support [workspace](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
- Add configuration: `filename-lint.includePatterns`
- Configuration changes:
  - `filename-lint.presetPattern` => `filename-lint.namingPattern`
  - `filename-lint.customRegex` => `filename-lint.namingPattern`
  - `filename-lint.ignorePatterns` => `filename-lint.excludePatterns`
