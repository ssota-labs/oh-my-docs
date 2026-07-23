export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type AgentKind = 'codex' | 'cursor' | 'claude' | 'all';

export type SetupScope = 'project' | 'user';

export type FileOperationKind = 'create' | 'update' | 'merge' | 'skip';

export interface ProjectState {
  readonly root: string;
  readonly empty: boolean;
  readonly hasPackageJson: boolean;
  readonly packageManager: PackageManager | null;
  readonly isWorkspace: boolean;
  readonly workspaceGlobs: readonly string[];
  readonly hasAgentsMd: boolean;
  readonly hasClaudeMd: boolean;
  readonly agentsHasMarker: boolean;
  readonly claudeHasMarker: boolean;
  readonly docsPath: string | null;
  readonly uiPath: string | null;
  readonly missing: readonly string[];
}

export interface InitOptions {
  readonly cwd: string;
  readonly dryRun?: boolean;
  readonly yes?: boolean;
  readonly force?: boolean;
  readonly json?: boolean;
  readonly uiPath?: string;
  readonly packageManager?: PackageManager;
}

export interface SetupOptions {
  readonly cwd: string;
  readonly dryRun?: boolean;
  readonly yes?: boolean;
  readonly force?: boolean;
  readonly json?: boolean;
  readonly agent?: AgentKind;
  readonly scope?: SetupScope;
  /** Absolute path to the shared `setup` skill tree (must contain SKILL.md). */
  readonly skillRoot?: string;
  /** Override home directory for `--scope user` (tests). */
  readonly home?: string;
}

export interface FileOperation {
  readonly path: string;
  readonly kind: FileOperationKind;
  readonly reason: string;
  readonly content?: string;
  readonly conflict?: boolean;
}

export interface PlanResult {
  readonly project: ProjectState;
  readonly operations: readonly FileOperation[];
  readonly conflicts: readonly FileOperation[];
}

export interface ApplyResult {
  readonly applied: readonly FileOperation[];
  readonly skipped: readonly FileOperation[];
  readonly rolledBack: boolean;
  readonly dryRun: boolean;
}

export interface DoctorReport {
  readonly project: ProjectState;
  readonly ok: boolean;
  readonly notes: readonly string[];
}
