<h1 align="center">✨ <a href="https://filename-lint.abgox.com">filename-lint</a> ✨</h1>

<p align="center">
    <a href="https://github.com/abgox/filename-lint/blob/main/LICENSE">
        <img src="https://img.shields.io/github/license/abgox/filename-lint" alt="license" />
    </a>
    <a href="https://github.com/abgox/filename-lint">
        <img src="https://img.shields.io/github/package-json/v/abgox/filename-lint" alt="version" />
    </a>
    <a href="https://github.com/abgox/filename-lint">
        <img src="https://img.shields.io/github/created-at/abgox/filename-lint" alt="created" />
    </a>
</p>

---

<p align="center">
  <strong>Star ⭐️ or <a href="https://me.abgox.com/donate">Donate 💰</a> if you like it!</strong>
</p>

[简体中文](./README.zh-CN.md) | [GitHub](https://github.com/abgox/filename-lint) | [Gitee](https://gitee.com/abgox/filename-lint)

<img src="./icon.png" alt="logo" width="128px"/>

An extension for [Visual Studio Code](https://code.visualstudio.com/) that enforces consistent naming conventions for your files and folders.

> Also supports [VS Code for the Web](https://vscode.dev).

## Getting Started

1. [Install filename-lint](https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint).

2. Add the following configuration to [settings.json](https://code.visualstudio.com/docs/configure/settings) file.
   ```json
   "filename-lint.enabled": true
   ```

## Extension Settings

- `"filename-lint.enabled"`: Enable the extension.
- `"filename-lint.namingPattern"`: Naming convention to enforce
  - `lowercase`
  - `kebab-case`
  - `snake_case`
  - `camelCase`
  - `PascalCase`
  - ...
- `"filename-lint.includePatterns"`: Glob patterns for files/directories to include.
- `"filename-lint.excludePatterns"`: Glob patterns for files/directories to exclude.

> [!TIP]
>
> - The following directories are excluded by default:
>   - `.git`, `.jj`, `.svn`, `.hg`, `.idea`, `.vscode`, `.nyc_output`
>   - `node_modules`, `out`, `dist`, `build`, `coverage`
> - You can override this by adding their patterns to `filename-lint.includePatterns`.

## Extension Commands

`filename-lint.check-manually`: Manually trigger a workspace check.

## What's New

See the [changelog](./CHANGELOG.md) for details.

## Why Create It

- **Windows-Specific Git Behavior**:
  - After `git init` or `git clone` on Windows, git automatically sets `core.ignorecase = true` in its configuration, making filenames case-insensitive.
  - It will cause git to be unable to track changes in the case of file names (e.g. `File.txt` => `file.txt`), which may result in different file names between the remote and local repository.
  - Note: **Global settings won't override it.**
    - Running `git config --global core.ignorecase false` has no effect.
    - Need manually configure `git config core.ignorecase false` after each `git init` or `git clone`.

- **Proactive Solution**:
  - It might be a good idea to enforce lowercase names for files and folders to avoid this issue.
  - It's also default behavior of `filename-lint` when enabled.
  - When enabled, a warning is given if a file or folder name appears in uppercase letters.
  - **Customization**: It can be customized by [Extension Settings](#extension-settings).

## License

[MIT](./LICENSE) © [abgox](https://me.abgox.com)
