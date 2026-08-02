[English](./CHANGELOG.md)

# 更新日志

## 0.3.0

- 新增 Web 扩展支持（VS Code for the Web）
- 使用 esbuild 替代 tsc 打包，输出到 `dist/desktop/` 和 `dist/web/`
- 使用 `vscode.workspace.fs` 替代 `fast-glob` 进行文件扫描，完全兼容 web 环境
- 使用自定义翻译加载替代 `vscode-nls-i18n`，直接读取现有 NLS 文件，无需额外依赖
- 新增 `MANDATORY_EXCLUDES` 常量，包含常见目录（`.git`、`.jj`、`.svn`、`.hg`、`.idea`、`.vscode`、`node_modules`、`out`、`dist`、`build`、`.nyc_output`、`coverage`），用户可通过 `includePatterns` 覆盖
- 优化目录遍历，智能解析 include 模式跳过无关目录
- 优化文件监听器：文件删除时重新检查父目录，目录创建时检查子文件
- 其他的修复和优化

## 0.2.1

- 添加工作区检查时的进度通知
- 添加详细的日志输出
- 优化文件变更监听处理
- 其他的修复和优化

## 0.2.0

- 修改了 `filename-lint.excludePatterns` 的默认值
  - `["**/.git/**", "**/.idea/**", "**/node_modules/**"]` => `[]`
  - 这几个目录会直接被排除，无需指定
  - 如果你需要包含它们，可以在 `filename-lint.includePatterns` 中指定它们
- 其他的修复和优化

## 0.1.2

- 更新配置描述

## 0.1.1

- 优化了文件监听逻辑和性能
- 其他的修复和优化

## 0.1.0

- 支持 [工作区](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
- 新增配置项: `filename-lint.includePatterns`
- 配置项变化:
  - `filename-lint.presetPattern` => `filename-lint.namingPattern`
  - `filename-lint.customRegex` => `filename-lint.namingPattern`
  - `filename-lint.ignorePatterns` => `filename-lint.excludePatterns`
