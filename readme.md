<h1 align="center">✨ <a href="https://filename-lint.abgox.com">filename-lint</a> ✨</h1>

<p align="center">
    <a href="https://github.com/abgox/filename-lint/blob/main/license">
        <img src="https://img.shields.io/github/license/abgox/filename-lint" alt="license" />
    </a>
    <a href="https://github.com/abgox/filename-lint">
        <img src="https://img.shields.io/github/v/release/abgox/filename-lint?label=version" alt="version" />
    </a>
    <a href="https://img.shields.io/github/languages/code-size/abgox/filename-lint">
        <img src="https://img.shields.io/github/languages/code-size/abgox/filename-lint" alt="code size" />
    </a>
    <a href="https://img.shields.io/github/repo-size/abgox/filename-lint">
        <img src="https://img.shields.io/github/repo-size/abgox/filename-lint" alt="repo size" />
    </a>
    <a href="https://github.com/abgox/filename-lint">
        <img src="https://img.shields.io/github/created-at/abgox/filename-lint" alt="created" />
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint">
        <img src="https://img.shields.io/visual-studio-marketplace/d/abgox.filename-lint" alt="download" />
    </a>
</p>

---

<p align="center">
  <strong>Star ⭐️ or <a href="https://abgox.com/donate">Donate 💰</a> if you like it!</strong>
</p>

[English](./readme.md) | [简体中文](./readme.zh-CN.md) | [Github](https://github.com/abgox/filename-lint) | [Gitee](https://gitee.com/abgox/filename-lint)

<img src="./icon.png" alt="logo" width="128px"/>

An extension for [Visual Studio Code](https://code.visualstudio.com/) that enforces consistent naming conventions for your files and folders.

## Getting Started

1. [Install filename-lint](https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint).

2. Add the following configuration to [settings.json](https://code.visualstudio.com/docs/configure/settings) file.
   ```json
   "filename-lint.enabled": true
   ```

## Extension Settings

- `"filename-lint.enabled"`
- `"filename-lint.namingPattern"`
- `"filename-lint.includePatterns"`
- `"filename-lint.excludePatterns"`

## Extension Commands

- `filename-lint.check-manually`

## Release Notes

- See the [changelog](./changelog.md) for details.

## Why Create It?

- **Windows-Specific Git Behavior**:

  - After `git init` or `git clone` on Windows, git automatically sets `core.ignorecase = true` in its configuration, making filenames case-insensitive.

  - It will cause git to be unable to track changes in the case of file names (e.g. `File.txt` => `file.txt`), which may result in different file names between the remote and local repository.

  - Note: **Global settings won’t override it.**
    - Running `git config --global core.ignorecase false` has no effect.
    - Need manually configure `git config core.ignorecase false` after each `git init` or `git clone` .

- **Proactive Solution**:

  - It might be a good idea to enforce lowercase names for files and folders to avoid this issue.

  - It's also default behavior of `filename-lint` when enabled.

    ```json
    "filename-lint.enabled": true
    ```

  - When enabled, a warning is given if a file or folder name appears in uppercase letters.

  - **Customization**: It can be customized by [Extension Settings](#extension-settings).
