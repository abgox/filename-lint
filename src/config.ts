import * as vscode from "vscode";
import { type configType } from "./types";

export function getConfig(uri: vscode.Uri): configType {
  // Config priority: xxx.code-workspace > folder > global > default
  const c = vscode.workspace.getConfiguration("filename-lint", uri);
  const config: configType = {
    enabled: c.get("enabled") as boolean,
    namingPattern: c.get("namingPattern") as string,
    excludePatterns: c.get("excludePatterns") as string[],
    includePatterns: c.get("includePatterns") as string[],
    currentPattern: /^[^A-Z]+$/, // default pattern is lowercase
  };

  const patternMap = {
    lowercase: /^[^A-Z]+$/,
    "kebab-case": /^[a-z0-9]+(-[a-z0-9]+)*$/,
    snake_case: /^[a-z0-9]+(_[a-z0-9]+)*$/,
    camelCase: /^[a-z0-9]+[a-z0-9]*([A-Z][a-z0-9]*)*$/,
    PascalCase: /^[A-Z]+[a-z0-9]*([A-Z0-9][a-z0-9]*)*$/,
  } as const;

  type PatternKey = keyof typeof patternMap;

  if (config.namingPattern in patternMap) {
    const key = config.namingPattern as PatternKey;
    config.currentPattern = patternMap[key];
  } else {
    config.currentPattern = new RegExp(config.namingPattern);
  }
  return config;
}
