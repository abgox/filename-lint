import * as vscode from "vscode";

export type configType = {
  enabled: boolean;
  namingPattern: string;
  excludePatterns: string[];
  includePatterns: string[];
  currentPattern: RegExp;
};

export type dataType = {
  config: configType;
  collection: vscode.DiagnosticCollection;
};
