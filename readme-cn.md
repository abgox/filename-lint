<p align="center">
    <h1 align="center">✨ filename-lint ✨</h1>
</p>

<p align="center">
    <a href="https://github.com/abgox/filename-lint/blob/main/license">
        <img src="https://img.shields.io/github/license/abgox/filename-lint" alt="license" />
    </a>
    <a href="https://img.shields.io/github/languages/code-size/abgox/filename-lint.svg">
        <img src="https://img.shields.io/github/languages/code-size/abgox/filename-lint.svg" alt="code size" />
    </a>
    <a href="https://img.shields.io/github/repo-size/abgox/filename-lint.svg">
        <img src="https://img.shields.io/github/repo-size/abgox/filename-lint.svg" alt="code size" />
    </a>
    <a href="https://github.com/abgox/filename-lint">
        <img src="https://img.shields.io/github/created-at/abgox/filename-lint" alt="created" />
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint">
        <img src="https://img.shields.io/visual-studio-marketplace/i/abgox.filename-lint" alt="install" />
    </a>
</p>

---

[English](./readme.md) | [简体中文](./readme-cn.md) | [Github](https://github.com/abgox/filename-lint) | [Gitee](https://gitee.com/abgox/filename-lint)

<img src="./icon.png" alt="logo" width="128px"/>

一个 [Visual Studio Code](https://code.visualstudio.com/) 扩展插件，用于统一文件及文件夹的命名规范

## 开始使用

1. [安装 filename-lint](https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint)

2. 添加以下配置到 `settings.json` 配置文件中
   ```json
   "filename-lint.enabled": true
   ```

## 扩展命令

- `filename-lint.check-manually`

## 扩展设置

- `"filename-lint.enabled"`
- `"filename-lint.presetPattern"`
- `"filename-lint.customRegex"`
- `"filename-lint.ignorePatterns"`

## 版本说明

- 请查看 [changelog](./changelog.md)

## 为什么创建它

- **Windows 特殊的 git 行为**:

  - 使用 `git init` 或 `git clone` 后，会自动生成 git 配置 `core.ignorecase = true`，使文件名大小写不敏感
  - 这将导致 git 无法跟踪文件名大小写变化 (`File.txt` => `file.txt`)，这可能会导致远程仓库和本地仓库的文件名不同。

  - 注意: **全局设置不会覆盖它**
    - 运行 `git config --global core.ignorecase false` 无效
    - 每次 `git init` 或 `git clone` 后，需要手动配置 `git config core.ignorecase false`

- **解决方案**:

  - 在文件或文件夹名称中禁用大写字母，以避免此问题。
  - 这也是 `filename-lint` 启用后的默认效果 (`lowercase`)

    ```json
    "filename-lint.enabled": true
    ```

  - 当启用后，如果文件或文件夹名称出现大写字母，就会给出警告

- **自定义**: 可以通过 [扩展设置](#扩展设置) 去自定义
