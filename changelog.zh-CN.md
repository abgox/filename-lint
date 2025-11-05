[English](./changelog.md) | [简体中文](./changelog.zh-CN.md)

# 更新日志

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
