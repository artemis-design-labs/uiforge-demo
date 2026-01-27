/**
 * Accessibility Module
 *
 * Comprehensive accessibility knowledge base and validation service
 * based on WCAG 2.2, ADA, and ARIA Authoring Practices.
 *
 * @example
 * ```typescript
 * import {
 *   validateComponent,
 *   checkColorContrast,
 *   getComponentRules,
 *   WCAG_CRITERIA,
 * } from '@/services/accessibility';
 *
 * // Validate a component
 * const report = validateComponent('Button', buttonCode, 'AA');
 *
 * // Check color contrast
 * const contrast = checkColorContrast('#FFFFFF', '#3B82F6');
 * console.log(contrast.passes.normalTextAA); // true/false
 *
 * // Get component accessibility rules
 * const rules = getComponentRules('TextField');
 * ```
 */

// WCAG Knowledge Base
export {
  WCAG_CRITERIA,
  getAllCriteria,
  getCriteriaByLevel,
  getCriteriaByPrinciple,
  getCriteriaByComponent,
  getCriteriaByVersion,
  getWCAG22NewCriteria,
  getLevelAACriteria,
  type WCAGCriterion,
  type WCAGLevel,
  type WCAGVersion,
  type WCAGPrinciple,
  type ComponentAccessibilityRule,
  type AccessibilityRequirement,
  type KeyboardRequirement,
  type Violation,
  type ColorContrastResult,
} from './wcagKnowledgeBase';

// Component Accessibility Rules
export {
  COMPONENT_ACCESSIBILITY_RULES,
  getComponentRules,
  getComponentsForCriterion,
  getAllViolations,
  getViolationsBySeverity,
  getKeyboardRequirements,
  getCodeExamples,
  getAllComponentRules,
  getComponentNames,
} from './componentAccessibilityRules';

// Accessibility Validator
export {
  validateComponent,
  validateComponents,
  generateSummaryReport,
  analyzeComponentCode,
  checkColorContrast,
  getContrastRatio,
  parseColor,
  getRelativeLuminance,
  type AccessibilityIssue,
  type AccessibilityReport,
  type KeyboardCheckItem,
  type ComponentCodeAnalysis,
} from './accessibilityValidator';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { validateComponent, checkColorContrast, AccessibilityReport } from './accessibilityValidator';
import { getComponentRules, ComponentAccessibilityRule } from './componentAccessibilityRules';
import { WCAG_CRITERIA, WCAGCriterion } from './wcagKnowledgeBase';

/**
 * Quick accessibility check for a component
 * Returns true if component passes Level AA requirements
 */
export function quickA11yCheck(componentName: string, code: string): boolean {
  const report = validateComponent(componentName, code, 'AA');
  return report.passed;
}

/**
 * Get accessibility score for a component (0-100)
 */
export function getA11yScore(componentName: string, code: string): number {
  const report = validateComponent(componentName, code, 'AA');
  return report.score;
}

/**
 * Get critical issues for a component
 */
export function getCriticalIssues(componentName: string, code: string): string[] {
  const report = validateComponent(componentName, code, 'AA');
  return report.issues
    .filter(i => i.severity === 'critical')
    .map(i => `${i.title}: ${i.howToFix}`);
}

/**
 * Check if colors meet AA contrast requirements
 */
export function meetsAAContrast(foreground: string, background: string, isLargeText = false): boolean {
  const result = checkColorContrast(foreground, background);
  return isLargeText ? result.passes.largeTextAA : result.passes.normalTextAA;
}

/**
 * Get all WCAG criteria that apply to a component
 */
export function getApplicableWCAG(componentName: string): WCAGCriterion[] {
  const rules = getComponentRules(componentName);
  if (!rules) return [];

  return rules.wcagCriteria
    .map(id => WCAG_CRITERIA[id])
    .filter(Boolean);
}

/**
 * Get correct code example for a component
 */
export function getCorrectExample(componentName: string): string | undefined {
  const rules = getComponentRules(componentName);
  return rules?.codeExample.correct;
}

/**
 * Get incorrect code example for a component (what to avoid)
 */
export function getIncorrectExample(componentName: string): string | undefined {
  const rules = getComponentRules(componentName);
  return rules?.codeExample.incorrect;
}

/**
 * Get keyboard requirements for a component
 */
export function getKeyboardInfo(componentName: string): {
  keys: string[];
  required: string[];
  optional: string[];
} {
  const rules = getComponentRules(componentName);
  if (!rules) return { keys: [], required: [], optional: [] };

  const keyboard = rules.keyboardInteraction;
  return {
    keys: keyboard.map(k => k.key),
    required: keyboard.filter(k => k.required).map(k => `${k.key}: ${k.action}`),
    optional: keyboard.filter(k => !k.required).map(k => `${k.key}: ${k.action}`),
  };
}

/**
 * Format accessibility report as markdown
 */
export function formatReportAsMarkdown(report: AccessibilityReport): string {
  const lines: string[] = [
    `# Accessibility Report: ${report.component}`,
    '',
    `**WCAG Level:** ${report.wcagLevel}`,
    `**Score:** ${report.score}/100`,
    `**Status:** ${report.passed ? '✅ PASSED' : '❌ FAILED'}`,
    '',
  ];

  if (report.issues.length > 0) {
    lines.push('## Issues (Must Fix)');
    lines.push('');
    report.issues.forEach(issue => {
      lines.push(`### ${issue.severity.toUpperCase()}: ${issue.title}`);
      lines.push('');
      lines.push(issue.description);
      lines.push('');
      lines.push(`**How to Fix:** ${issue.howToFix}`);
      lines.push('');
      lines.push(`**WCAG Criteria:** ${issue.wcagCriteria.join(', ')}`);
      lines.push('');
    });
  }

  if (report.warnings.length > 0) {
    lines.push('## Warnings (Should Fix)');
    lines.push('');
    report.warnings.forEach(warning => {
      lines.push(`- **${warning.title}:** ${warning.howToFix}`);
    });
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  if (report.keyboardChecklist.length > 0) {
    lines.push('## Keyboard Accessibility');
    lines.push('');
    lines.push('| Key | Action | Required | Implemented |');
    lines.push('|-----|--------|----------|-------------|');
    report.keyboardChecklist.forEach(item => {
      const impl = item.implemented ? '✅' : '❌';
      const req = item.required ? 'Yes' : 'No';
      lines.push(`| ${item.key} | ${item.action} | ${req} | ${impl} |`);
    });
    lines.push('');
  }

  lines.push('## Screen Reader Notes');
  lines.push('');
  lines.push(report.screenReaderNotes);

  return lines.join('\n');
}
