[English](./changelog.md) | [简体中文](./changelog.zh-CN.md)

# 更新日志

## v0.1.1

- 优化了文件监听逻辑和性能
- 其他的修复和优化

## v0.1.0

- 支持 [工作区](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
- 新增配置项: `filename-lint.includePatterns`
- 配置项变化:

  - `filename-lint.presetPattern` => `filename-lint.namingPattern`
  - `filename-lint.customRegex` => `filename-lint.namingPattern`
  - `filename-lint.ignorePatterns` => `filename-lint.excludePatterns`
