[English](./changelog.md) | [简体中文](./changelog.zh-CN.md)

# Changelog

## v0.2.0

- Modified the default value of `filename-lint.excludePatterns`.
  - `["**/.git/**", "**/.idea/**", "**/node_modules/**"]` => `[]`
  - These directories will be directly excluded without the need for additional specification.
  - If you have to include them, you can specify them in `filename-lint.includePatterns`.
- Other fixes and optimizations.

## v0.1.2

- Update config description.

## v0.1.1

- Optimize the file watcher and performance.
- Other fixes and optimizations.

## v0.1.0

- Support [workspace](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
- Add configuration: `filename-lint.includePatterns`
- Configuration changes:

  - `filename-lint.presetPattern` => `filename-lint.namingPattern`
  - `filename-lint.customRegex` => `filename-lint.namingPattern`
  - `filename-lint.ignorePatterns` => `filename-lint.excludePatterns`
