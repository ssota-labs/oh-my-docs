export type {
  AgentKind,
  ApplyResult,
  DoctorReport,
  FileOperation,
  FileOperationKind,
  InitOptions,
  PackageManager,
  PlanResult,
  ProjectState,
  SetupOptions,
  SetupScope,
} from './types.ts';

export { detectProject, listFilesRecursive, relativePosix } from './detect.ts';
export {
  DEFAULT_AGENTS_MARKER_BODY,
  DEFAULT_CLAUDE_MARKER_BODY,
  MARKER_END,
  MARKER_START,
  hasMarkerBlock,
  mergeMarkerBlock,
  wrapMarkerBlock,
} from './markers.ts';
export { applyFileOperations, readTextIfExists } from './fs-ops.ts';
export { planInit, resolveInitTarget } from './plan-init.ts';
export { planSetup } from './plan-setup.ts';
export {
  PROJECT_SKILL_ROOTS,
  agentsFor,
  skillInstallRoot,
  userSkillRoot,
  type ConcreteAgent,
} from './skill-paths.ts';
export { doctorProject } from './doctor.ts';
export {
  collectPlanningDocuments,
  parseFrontmatter,
  validatePlanning,
  type DocumentKind,
  type PlanningDocument,
} from './planning.ts';
export {
  extractPlanPath,
  gateScriptExistsOnBase,
  isDocumentationOnlyPath,
  validateDocsFirst,
  type DocsFirstInput,
} from './docs-first.ts';
export {
  planCreateDocument,
  slugifyTitle,
  type CreateDocumentOptions,
  type CreateDocumentResult,
  type NewDocumentKind,
} from './create-document.ts';
