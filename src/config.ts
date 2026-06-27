import * as vscode from "vscode";
import { type configType } from "./types.js";

export const MANDATORY_EXCLUDES = [
  "**/.git/**",
  "**/.jj/**",
  "**/.svn/**",
  "**/.hg/**",
  "**/.idea/**",
  "**/.vscode/**",
  "**/node_modules/**",
  "**/out/**",
  "**/dist/**",
  "**/build/**",
  "**/.nyc_output/**",
  "**/coverage/**",
];

export function getConfig(uri: vscode.Uri): configType {
  const c = vscode.workspace.getConfiguration("filename-lint", uri);

  const userIncludes = c.get("includePatterns") as string[];
  const userExcludes = c.get("excludePatterns") as string[];

  const finalExcludes = MANDATORY_EXCLUDES
    .filter((path) => !userIncludes.includes(path))
    .concat(userExcludes);

  const config: configType = {
    enabled: c.get("enabled") as boolean,
    namingPattern: c.get("namingPattern") as string,
    excludePatterns: [...new Set(finalExcludes)],
    includePatterns: userIncludes,
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
