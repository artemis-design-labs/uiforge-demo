/**
 * Component Matcher Service
 * Fuzzy matches identified components to codebase and Figma components
 */

import Fuse from 'fuse.js';
import type {
  ScreenshotAnalysis,
  IdentifiedComponent,
  ComponentMatch,
} from '@/types/screenshotAnalyzer';
import type { ExtractedComponent } from '@/types/codebaseAnalyzer';

// ============================================
// Types
// ============================================

interface FigmaComponent {
  name: string;
  nodeId: string;
  properties: Record<string, unknown>;
}

interface MatchWeights {
  nameExact: number;
  namePartial: number;
  typeMatch: number;
  propsOverlap: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  nameExact: 40,
  namePartial: 25,
  typeMatch: 25,
  propsOverlap: 10,
};

// ============================================
// Main Matching Function
// ============================================

/**
 * Match all identified components to codebase and Figma components
 */
export async function matchComponents(
  analysis: ScreenshotAnalysis,
  codebaseComponents: ExtractedComponent[],
  figmaComponents: Record<string, FigmaComponent>
): Promise<ScreenshotAnalysis> {
  const updatedComponents = analysis.components.map((component) => {
    // Find matches from both sources
    const codebaseMatches = matchToCodebase(component, codebaseComponents);
    const figmaMatches = matchToFigma(component, figmaComponents);

    // Combine and sort by score
    const allMatches = [...codebaseMatches, ...figmaMatches].sort(
      (a, b) => b.matchScore - a.matchScore
    );

    // Get best match
    const bestMatch = allMatches.length > 0 ? allMatches[0] : null;

    return {
      ...component,
      matches: allMatches.slice(0, 5), // Keep top 5 matches
      bestMatch,
    };
  });

  // Update stats
  const matchedToCodebase = updatedComponents.filter(
    (c) => c.bestMatch?.source === 'codebase'
  ).length;
  const matchedToFigma = updatedComponents.filter(
    (c) => c.bestMatch?.source === 'figma'
  ).length;
  const unmatchedCount = updatedComponents.filter(
    (c) => c.bestMatch === null
  ).length;

  return {
    ...analysis,
    components: updatedComponents,
    stats: {
      ...analysis.stats,
      matchedToCodebase,
      matchedToFigma,
      unmatchedCount,
    },
  };
}

// ============================================
// Codebase Matching
// ============================================

/**
 * Match an identified component to codebase components
 */
export function matchToCodebase(
  identified: IdentifiedComponent,
  codebaseComponents: ExtractedComponent[]
): ComponentMatch[] {
  if (codebaseComponents.length === 0) return [];

  // Create Fuse instance for fuzzy name matching
  const fuse = new Fuse(codebaseComponents, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
  });

  // Find name matches
  const nameMatches = fuse.search(identified.name);

  // Also match by type
  const typeMatches = codebaseComponents.filter((c) =>
    normalizeType(c.type).includes(normalizeType(identified.type))
  );

  // Combine candidates
  const candidateIds = new Set<string>();
  const candidates: ExtractedComponent[] = [];

  nameMatches.forEach((result) => {
    if (!candidateIds.has(result.item.filePath)) {
      candidateIds.add(result.item.filePath);
      candidates.push(result.item);
    }
  });

  typeMatches.forEach((comp) => {
    if (!candidateIds.has(comp.filePath)) {
      candidateIds.add(comp.filePath);
      candidates.push(comp);
    }
  });

  // Score each candidate
  const matches: ComponentMatch[] = candidates
    .map((candidate) => {
      const score = calculateMatchScore(identified, candidate);
      const reasons = getMatchReasons(identified, candidate);

      return {
        source: 'codebase' as const,
        componentId: candidate.filePath,
        componentName: candidate.name,
        matchScore: score,
        matchReasons: reasons,
        codebaseComponent: {
          filePath: candidate.filePath,
          props: candidate.props,
          sourceCode: candidate.sourceCode,
        },
      };
    })
    .filter((m) => m.matchScore >= 30) // Minimum threshold
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches.slice(0, 5);
}

// ============================================
// Figma Matching
// ============================================

/**
 * Match an identified component to Figma components
 */
export function matchToFigma(
  identified: IdentifiedComponent,
  figmaComponents: Record<string, FigmaComponent>
): ComponentMatch[] {
  const components = Object.entries(figmaComponents);
  if (components.length === 0) return [];

  // Create Fuse instance for fuzzy name matching
  const figmaList = components.map(([key, comp]) => ({
    key,
    ...comp,
  }));

  const fuse = new Fuse(figmaList, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
  });

  // Find name matches
  const nameMatches = fuse.search(identified.name);

  const matches: ComponentMatch[] = nameMatches
    .map((result) => {
      const figmaComp = result.item;
      const nameSimilarity = 1 - (result.score || 0);
      const score = Math.round(nameSimilarity * 100);

      return {
        source: 'figma' as const,
        componentId: figmaComp.key,
        componentName: figmaComp.name,
        matchScore: score,
        matchReasons: [`Name similarity: ${Math.round(nameSimilarity * 100)}%`],
        figmaComponent: {
          nodeId: figmaComp.nodeId,
          fileKey: figmaComp.key.split('/')[0] || '',
          properties: figmaComp.properties as Record<string, {
            name: string;
            type: string;
            value: string | boolean;
            options?: string[];
          }>,
        },
      };
    })
    .filter((m) => m.matchScore >= 30);

  return matches.slice(0, 5);
}

// ============================================
// Scoring Functions
// ============================================

/**
 * Calculate match score between identified component and codebase component
 */
function calculateMatchScore(
  identified: IdentifiedComponent,
  candidate: ExtractedComponent,
  weights: MatchWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;

  // Name matching
  const nameSimilarity = calculateNameSimilarity(identified.name, candidate.name);
  if (nameSimilarity === 1) {
    score += weights.nameExact;
  } else if (nameSimilarity >= 0.7) {
    score += weights.namePartial * nameSimilarity;
  } else if (nameSimilarity >= 0.5) {
    score += weights.namePartial * nameSimilarity * 0.5;
  }

  // Type matching
  if (normalizeType(identified.type) === normalizeType(candidate.type)) {
    score += weights.typeMatch;
  } else if (areTypesRelated(identified.type, candidate.type)) {
    score += weights.typeMatch * 0.5;
  }

  // Props overlap
  const propsOverlap = calculatePropsOverlap(identified.inferredProps, candidate.props);
  score += weights.propsOverlap * propsOverlap;

  return Math.min(100, Math.round(score));
}

/**
 * Calculate name similarity using various techniques
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  // Exact match
  if (n1 === n2) return 1;

  // Contains match
  if (n1.includes(n2) || n2.includes(n1)) {
    return 0.8;
  }

  // Levenshtein distance
  const distance = levenshteinDistance(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
}

/**
 * Normalize component name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s]+/g, '')
    .replace(/component$/i, '')
    .replace(/^(the|a|an)/i, '');
}

/**
 * Normalize component type for comparison
 */
function normalizeType(type: string): string {
  const normalized = type.toLowerCase().trim();

  // Map common variations
  const typeMap: Record<string, string> = {
    btn: 'button',
    cta: 'button',
    textfield: 'input',
    textinput: 'input',
    textarea: 'input',
    nav: 'navigation',
    navbar: 'navigation',
    header: 'navigation',
    listitem: 'list',
    griditem: 'grid',
    carditem: 'card',
    modal: 'dialog',
    popup: 'dialog',
    dropdown: 'select',
    selectbox: 'select',
  };

  return typeMap[normalized] || normalized;
}

/**
 * Check if two types are related
 */
function areTypesRelated(type1: string, type2: string): boolean {
  const relatedGroups = [
    ['button', 'link', 'cta'],
    ['input', 'textfield', 'textarea', 'search'],
    ['navigation', 'nav', 'navbar', 'header', 'menu'],
    ['card', 'tile', 'panel'],
    ['list', 'grid', 'table'],
    ['modal', 'dialog', 'popup', 'overlay'],
    ['dropdown', 'select', 'combobox'],
    ['form', 'fieldset'],
  ];

  const n1 = normalizeType(type1);
  const n2 = normalizeType(type2);

  return relatedGroups.some(
    (group) => group.includes(n1) && group.includes(n2)
  );
}

/**
 * Calculate props overlap between identified and candidate
 */
function calculatePropsOverlap(
  inferredProps: Record<string, string | boolean | number>,
  candidateProps: Array<{ name: string; type: string; required: boolean }>
): number {
  if (Object.keys(inferredProps).length === 0 || candidateProps.length === 0) {
    return 0;
  }

  const inferredPropNames = Object.keys(inferredProps).map((p) =>
    p.toLowerCase()
  );
  const candidatePropNames = candidateProps.map((p) => p.name.toLowerCase());

  const matches = inferredPropNames.filter((p) =>
    candidatePropNames.some(
      (cp) => cp === p || cp.includes(p) || p.includes(cp)
    )
  );

  return matches.length / Math.max(inferredPropNames.length, candidatePropNames.length);
}

/**
 * Get human-readable match reasons
 */
function getMatchReasons(
  identified: IdentifiedComponent,
  candidate: ExtractedComponent
): string[] {
  const reasons: string[] = [];

  const nameSimilarity = calculateNameSimilarity(identified.name, candidate.name);
  if (nameSimilarity === 1) {
    reasons.push('Exact name match');
  } else if (nameSimilarity >= 0.7) {
    reasons.push(`Name similarity: ${Math.round(nameSimilarity * 100)}%`);
  }

  if (normalizeType(identified.type) === normalizeType(candidate.type)) {
    reasons.push('Type match');
  } else if (areTypesRelated(identified.type, candidate.type)) {
    reasons.push('Related type');
  }

  const propsOverlap = calculatePropsOverlap(identified.inferredProps, candidate.props);
  if (propsOverlap > 0) {
    reasons.push(`Props overlap: ${Math.round(propsOverlap * 100)}%`);
  }

  return reasons;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Find best matches across all identified components
 */
export function findBestMatches(
  analysis: ScreenshotAnalysis,
  minScore: number = 50
): Array<{ component: IdentifiedComponent; match: ComponentMatch }> {
  return analysis.components
    .filter((c) => c.bestMatch && c.bestMatch.matchScore >= minScore)
    .map((c) => ({
      component: c,
      match: c.bestMatch!,
    }))
    .sort((a, b) => b.match.matchScore - a.match.matchScore);
}

/**
 * Get match statistics
 */
export function getMatchStats(analysis: ScreenshotAnalysis): {
  total: number;
  matched: number;
  unmatched: number;
  bySource: { codebase: number; figma: number; inferred: number };
  avgScore: number;
} {
  const matched = analysis.components.filter((c) => c.bestMatch !== null);
  const scores = matched.map((c) => c.bestMatch!.matchScore);

  const bySource = {
    codebase: matched.filter((c) => c.bestMatch?.source === 'codebase').length,
    figma: matched.filter((c) => c.bestMatch?.source === 'figma').length,
    inferred: matched.filter((c) => c.bestMatch?.source === 'inferred').length,
  };

  return {
    total: analysis.components.length,
    matched: matched.length,
    unmatched: analysis.components.length - matched.length,
    bySource,
    avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
  };
}
