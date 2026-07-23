import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { parse } from 'yaml';

export type DocumentKind = 'prd' | 'story' | 'spec' | 'adr' | 'plan';

export interface PlanningDocument {
  readonly file: string;
  readonly slug: string;
  readonly kind: DocumentKind;
  readonly id: string;
  readonly status?: string;
  readonly stage?: string;
  readonly changeType?: string;
  readonly prd?: string;
  readonly specs: readonly string[];
  readonly stories: readonly string[];
  readonly codeAreas: readonly string[];
}

type Frontmatter = Record<string, unknown>;

const PREFIX: Readonly<Record<DocumentKind, string>> = {
  prd: 'PRD-',
  story: 'US-',
  spec: 'SPEC-',
  adr: 'ADR-',
  plan: 'PLAN-',
};

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : path.endsWith('.mdx') ? [path] : [];
  });
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function strings(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

export function parseFrontmatter(source: string, file: string): Frontmatter {
  if (!source.startsWith('---\n')) {
    throw new Error(`${file}: frontmatter must start on the first line`);
  }
  const end = source.indexOf('\n---', 4);
  if (end === -1) throw new Error(`${file}: frontmatter is not closed`);
  const parsed: unknown = parse(source.slice(4, end));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${file}: frontmatter must be a mapping`);
  }
  return parsed as Frontmatter;
}

function classify(file: string, contentDirectory: string, data: Frontmatter): DocumentKind | null {
  const path = relative(contentDirectory, file).replaceAll('\\', '/');
  if (basename(file) === 'index.mdx') return null;
  if (path.startsWith('planning/prds/')) return 'prd';
  if (path.startsWith('planning/stories/')) return 'story';
  if (path.startsWith('development/plans/')) return 'plan';
  if (path.startsWith('development/adr/')) return 'adr';
  return string(data.id)?.toUpperCase().startsWith('SPEC-') ? 'spec' : null;
}

export function collectPlanningDocuments(contentDirectory: string): {
  readonly documents: readonly PlanningDocument[];
  readonly problems: readonly string[];
} {
  const documents: PlanningDocument[] = [];
  const problems: string[] = [];

  for (const file of walk(contentDirectory)) {
    const path = relative(contentDirectory, file).replaceAll('\\', '/');
    let data: Frontmatter;
    try {
      data = parseFrontmatter(readFileSync(file, 'utf8'), path);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const kind = classify(file, contentDirectory, data);
    if (!kind) continue;
    const id = string(data.id);
    if (!id) {
      problems.push(`${path}: ${kind} document is missing id`);
      continue;
    }
    if (!id.toUpperCase().startsWith(PREFIX[kind])) {
      problems.push(`${path}: ${kind} id must start with ${PREFIX[kind]} (found ${id})`);
    }
    documents.push({
      file: path,
      slug: basename(file, '.mdx'),
      kind,
      id,
      ...(string(data.status) ? { status: string(data.status) } : {}),
      ...(string(data.stage) ? { stage: string(data.stage) } : {}),
      ...(string(data.changeType) ? { changeType: string(data.changeType) } : {}),
      ...(string(data.prd) ? { prd: string(data.prd) } : {}),
      specs: strings(data.specs),
      stories: strings(data.stories),
      codeAreas: strings(data.codeAreas),
    });
  }
  return { documents, problems };
}

function checkNavigation(
  contentDirectory: string,
  document: PlanningDocument,
  problems: string[],
): void {
  const metaPath = join(contentDirectory, dirname(document.file), 'meta.json');
  try {
    const meta: unknown = JSON.parse(readFileSync(metaPath, 'utf8'));
    const pages =
      typeof meta === 'object' && meta !== null && !Array.isArray(meta)
        ? (meta as { readonly pages?: unknown }).pages
        : undefined;
    if (!Array.isArray(pages) || !pages.includes(document.slug)) {
      problems.push(`${document.file}: ${document.slug} is not registered in sibling meta.json`);
    }
  } catch {
    problems.push(`${document.file}: sibling meta.json is missing or invalid`);
  }
}

export function validatePlanning(contentDirectory: string): readonly string[] {
  const collected = collectPlanningDocuments(contentDirectory);
  const problems = [...collected.problems];
  const byId = new Map<string, PlanningDocument>();

  for (const document of collected.documents) {
    const prior = byId.get(document.id);
    if (prior) problems.push(`${document.file}: duplicate id ${document.id} (also in ${prior.file})`);
    else byId.set(document.id, document);
    checkNavigation(contentDirectory, document, problems);
  }

  const requireReference = (
    owner: PlanningDocument,
    id: string,
    kind: DocumentKind,
  ): PlanningDocument | undefined => {
    const target = byId.get(id);
    if (!target) {
      problems.push(`${owner.file}: ${kind} reference does not exist — ${id}`);
      return undefined;
    }
    if (target.kind !== kind) {
      problems.push(`${owner.file}: ${id} is ${target.kind}, expected ${kind}`);
      return undefined;
    }
    return target;
  };

  for (const document of collected.documents) {
    if (document.kind === 'prd') {
      if (!['draft', 'active', 'done'].includes(document.status ?? '')) {
        problems.push(`${document.file}: PRD status must be draft, active, or done`);
      }
      for (const story of document.stories) requireReference(document, story, 'story');
      continue;
    }
    if (document.kind === 'spec' || document.kind === 'adr') {
      if (!['draft', 'accepted', 'superseded'].includes(document.stage ?? '')) {
        problems.push(`${document.file}: ${document.kind} stage must be draft, accepted, or superseded`);
      }
      continue;
    }
    if (document.kind !== 'plan') continue;

    if (!['draft', 'ready', 'active', 'done', 'superseded'].includes(document.stage ?? '')) {
      problems.push(`${document.file}: plan stage is invalid`);
    }
    if (!['product', 'bugfix', 'maintenance'].includes(document.changeType ?? '')) {
      problems.push(`${document.file}: plan changeType must be product, bugfix, or maintenance`);
    }
    if (document.codeAreas.length === 0) {
      problems.push(`${document.file}: plan must declare at least one codeAreas entry`);
    }
    const needsProductContext = document.changeType === 'product' || document.changeType === 'bugfix';
    if (needsProductContext && !document.prd) {
      problems.push(`${document.file}: ${document.changeType} plan requires prd`);
    }
    if (needsProductContext && document.specs.length === 0) {
      problems.push(`${document.file}: ${document.changeType} plan requires at least one spec`);
    }
    if (document.changeType === 'product' && document.stories.length === 0) {
      problems.push(`${document.file}: product plan requires at least one story`);
    }

    const prd = document.prd ? requireReference(document, document.prd, 'prd') : undefined;
    const specs = document.specs
      .map((id) => requireReference(document, id, 'spec'))
      .filter((item): item is PlanningDocument => item !== undefined);
    for (const story of document.stories) requireReference(document, story, 'story');

    if (['ready', 'active', 'done'].includes(document.stage ?? '')) {
      if (prd?.status === 'draft') {
        problems.push(`${document.file}: ${document.stage} plan references draft PRD ${prd.id}`);
      }
      for (const spec of specs) {
        if (spec.stage !== 'accepted') {
          problems.push(`${document.file}: ${document.stage} plan requires accepted spec ${spec.id}`);
        }
      }
    }
  }
  return problems;
}
