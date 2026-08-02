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
  <strong>喜欢这个项目？请给它 Star ⭐️ 或 <a href="https://me.abgox.com/donate">赞赏 💰</a></strong>
</p>

[English](./README.md) | [GitHub](https://github.com/abgox/filename-lint) | [Gitee](https://gitee.com/abgox/filename-lint)

<img src="./icon.png" alt="logo" width="128px"/>

一个 [Visual Studio Code](https://code.visualstudio.com/) 扩展插件，用于统一文件及文件夹的命名规范

> 同时支持 [VS Code 网页端](https://vscode.dev)

## 开始使用

1. [安装 filename-lint](https://marketplace.visualstudio.com/items?itemName=abgox.filename-lint)

2. 添加以下配置到 [settings.json](https://code.visualstudio.com/docs/configure/settings) 配置文件中
   ```json
   "filename-lint.enabled": true
   ```

## 扩展设置

- `"filename-lint.enabled"`: 启用扩展
- `"filename-lint.namingPattern"`: 要强制执行的命名规范
  - `lowercase`
  - `kebab-case`
  - `snake_case`
  - `camelCase`
  - `PascalCase`
  - ...
- `"filename-lint.includePatterns"`: 要包含的文件或目录的 glob 模式
- `"filename-lint.excludePatterns"`: 要排除的文件或目录的 glob 模式

> [!TIP]
>
> - 以下目录默认被排除：
>   - `.git`、`.jj`、`.svn`、`.hg`、`.idea`、`.vscode`、`.nyc_output`
>   - `node_modules`、`out`、`dist`、`build`、`coverage`
> - 可以通过在 `filename-lint.includePatterns` 中添加对应模式来覆盖

## 扩展命令

`filename-lint.check-manually`: 手动触发工作区检查

## 新的变化

请查看 [更新日志](./CHANGELOG.zh-CN.md)

## 为什么创建它

- **Windows 中特殊的 git 行为**:
  - 使用 `git init` 或 `git clone` 后，会自动生成 git 配置 `core.ignorecase = true`，使文件名大小写不敏感
  - 这将导致 git 无法跟踪文件名大小写变化 (`File.txt` => `file.txt`)，这可能会导致远程仓库和本地仓库的文件名不同

  - 让人遗憾的是，**全局设置也不会覆盖它**
    - 通过 `git config --global core.ignorecase false` 在全局添加是无效的
    - 每次 `git init` 或 `git clone` 后，需要手动配置 `git config core.ignorecase false`

- **解决方案**:
  - 在文件或文件夹名称中禁用大写字母，以避免此问题
  - 这也是 `filename-lint` 启用后的默认效果 (`lowercase`)

    ```json
    "filename-lint.enabled": true
    ```

  - 当启用后，如果文件或文件夹名称出现大写字母，就会给出警告

  - **自定义**: 可以通过 [扩展设置](#扩展设置) 去自定义

## License

[MIT](./LICENSE) © [abgox](https://me.abgox.com)
