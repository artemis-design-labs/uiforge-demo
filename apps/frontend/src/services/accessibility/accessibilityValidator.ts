/**
 * Accessibility Validation Service
 *
 * Validates React components against WCAG 2.2 guidelines and
 * component-specific accessibility requirements.
 *
 * This service acts as an AI accessibility expert, identifying
 * potential violations and providing actionable fixes.
 */

import {
  WCAG_CRITERIA,
  WCAGCriterion,
  WCAGLevel,
  getCriteriaByComponent,
  getLevelAACriteria,
  ColorContrastResult,
} from './wcagKnowledgeBase';

import {
  COMPONENT_ACCESSIBILITY_RULES,
  getComponentRules,
  ComponentAccessibilityRule,
  Violation,
} from './componentAccessibilityRules';

// ============================================================================
// TYPES
// ============================================================================

export interface AccessibilityIssue {
  id: string;
  component: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagCriteria: string[];
  title: string;
  description: string;
  howToFix: string;
  codeSnippet?: string;
  suggestedFix?: string;
  automated: boolean;
  element?: string;
}

export interface AccessibilityReport {
  component: string;
  timestamp: Date;
  wcagLevel: WCAGLevel;
  passed: boolean;
  score: number; // 0-100
  issues: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  recommendations: string[];
  applicableCriteria: WCAGCriterion[];
  keyboardChecklist: KeyboardCheckItem[];
  screenReaderNotes: string;
}

export interface KeyboardCheckItem {
  key: string;
  action: string;
  required: boolean;
  implemented?: boolean;
}

export interface ComponentCodeAnalysis {
  hasAccessibleName: boolean;
  hasProperRole: boolean;
  hasKeyboardSupport: boolean;
  hasFocusIndicator: boolean;
  hasAriaStates: boolean;
  colorContrastIssues: string[];
  missingAriaAttributes: string[];
  suggestions: string[];
}

// ============================================================================
// COLOR CONTRAST UTILITIES
// ============================================================================

/**
 * Parse color string to RGB values
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Handle short hex colors
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return {
      r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
    };
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * Calculate relative luminance of a color
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG contrast requirements
 */
export function checkColorContrast(foreground: string, background: string): ColorContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      normalTextAA: ratio >= 4.5,
      normalTextAAA: ratio >= 7,
      largeTextAA: ratio >= 3,
      largeTextAAA: ratio >= 4.5,
      uiComponentsAA: ratio >= 3,
    },
  };
}

// ============================================================================
// CODE ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyze component code for accessibility patterns
 */
export function analyzeComponentCode(
  code: string,
  componentName: string
): ComponentCodeAnalysis {
  const analysis: ComponentCodeAnalysis = {
    hasAccessibleName: false,
    hasProperRole: false,
    hasKeyboardSupport: false,
    hasFocusIndicator: false,
    hasAriaStates: false,
    colorContrastIssues: [],
    missingAriaAttributes: [],
    suggestions: [],
  };

  // Check for accessible name patterns
  const accessibleNamePatterns = [
    /aria-label\s*=\s*["{]/,
    /aria-labelledby\s*=\s*["{]/,
    /<label[^>]*for\s*=\s*["{]/,
    /<label[^>]*htmlFor\s*=\s*["{]/,
    /alt\s*=\s*["{]/,
  ];
  analysis.hasAccessibleName = accessibleNamePatterns.some(pattern => pattern.test(code));

  // Check for proper role patterns
  const rolePatterns = [
    /role\s*=\s*["'](button|checkbox|tab|tablist|tabpanel|alert|dialog|menu|menuitem|listbox|option|progressbar|textbox|search)/,
    /<button/,
    /<input/,
    /<select/,
    /<textarea/,
    /<nav/,
  ];
  analysis.hasProperRole = rolePatterns.some(pattern => pattern.test(code));

  // Check for keyboard support patterns
  const keyboardPatterns = [
    /onKeyDown\s*=\s*[{]/,
    /onKeyUp\s*=\s*[{]/,
    /onKeyPress\s*=\s*[{]/,
    /tabIndex\s*=\s*[{0"']/,
  ];
  analysis.hasKeyboardSupport = keyboardPatterns.some(pattern => pattern.test(code));

  // Check for focus indicator patterns
  const focusPatterns = [
    /focus:/,
    /:focus/,
    /focus-visible/,
    /focus-within/,
    /ring-/,
    /outline-/,
  ];
  analysis.hasFocusIndicator = focusPatterns.some(pattern => pattern.test(code));

  // Check for ARIA states
  const ariaStatePatterns = [
    /aria-expanded\s*=\s*[{]/,
    /aria-selected\s*=\s*[{]/,
    /aria-checked\s*=\s*[{]/,
    /aria-pressed\s*=\s*[{]/,
    /aria-disabled\s*=\s*[{]/,
    /aria-hidden\s*=\s*[{]/,
    /aria-invalid\s*=\s*[{]/,
    /aria-current\s*=\s*[{]/,
  ];
  analysis.hasAriaStates = ariaStatePatterns.some(pattern => pattern.test(code));

  // Get component-specific requirements
  const rules = getComponentRules(componentName);
  if (rules) {
    // Check for missing aria attributes based on component type
    if (componentName === 'Button' && !analysis.hasAccessibleName) {
      analysis.missingAriaAttributes.push('aria-label (for icon buttons)');
    }

    if (componentName === 'TextField' && !/aria-describedby/.test(code)) {
      analysis.missingAriaAttributes.push('aria-describedby (for helper/error text)');
    }

    if (componentName === 'Tabs' && !/aria-controls/.test(code)) {
      analysis.missingAriaAttributes.push('aria-controls (to link tab to panel)');
    }

    if (componentName === 'Accordion' && !/aria-expanded/.test(code)) {
      analysis.missingAriaAttributes.push('aria-expanded (for open/close state)');
    }

    if (componentName === 'Checkbox' && !/aria-checked/.test(code) && !/type\s*=\s*["']checkbox/.test(code)) {
      analysis.missingAriaAttributes.push('aria-checked (for custom checkboxes)');
    }

    if (componentName === 'ProgressLinear' && !/aria-valuenow/.test(code)) {
      analysis.missingAriaAttributes.push('aria-valuenow, aria-valuemin, aria-valuemax');
    }

    // Generate suggestions
    if (!analysis.hasAccessibleName) {
      analysis.suggestions.push(`Add accessible name using aria-label, aria-labelledby, or visible label`);
    }
    if (!analysis.hasKeyboardSupport && ['Button', 'Tabs', 'Accordion', 'Dropdown'].includes(componentName)) {
      analysis.suggestions.push(`Add keyboard event handlers (onKeyDown) for keyboard navigation`);
    }
    if (!analysis.hasFocusIndicator) {
      analysis.suggestions.push(`Add visible focus indicator using focus: or focus-visible: CSS`);
    }
  }

  return analysis;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a component against WCAG criteria
 */
export function validateComponent(
  componentName: string,
  code: string,
  wcagLevel: WCAGLevel = 'AA'
): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];
  const warnings: AccessibilityIssue[] = [];
  const recommendations: string[] = [];

  // Get component rules
  const rules = getComponentRules(componentName);
  const criteria = getCriteriaByComponent(componentName);
  const codeAnalysis = analyzeComponentCode(code, componentName);

  // Filter criteria by level
  const applicableCriteria = criteria.filter(c => {
    if (wcagLevel === 'A') return c.level === 'A';
    if (wcagLevel === 'AA') return c.level === 'A' || c.level === 'AA';
    return true; // AAA includes all
  });

  // Check for common violations if rules exist
  if (rules) {
    rules.commonViolations.forEach(violation => {
      const isIssue = checkViolation(violation, code, codeAnalysis);
      if (isIssue) {
        const issue: AccessibilityIssue = {
          id: violation.id,
          component: componentName,
          severity: violation.impact,
          wcagCriteria: violation.wcagCriteria,
          title: violation.description,
          description: getViolationDescription(violation, componentName),
          howToFix: violation.howToFix,
          automated: true,
        };

        if (violation.impact === 'critical' || violation.impact === 'serious') {
          issues.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    });

    // Check requirements
    rules.requirements.forEach(req => {
      const passed = checkRequirement(req.id, code, codeAnalysis, componentName);
      if (!passed) {
        const criteriaIds = rules.wcagCriteria.filter(id => {
          const criterion = WCAG_CRITERIA[id];
          return criterion && (
            wcagLevel === 'AAA' ||
            (wcagLevel === 'AA' && criterion.level !== 'AAA') ||
            (wcagLevel === 'A' && criterion.level === 'A')
          );
        });

        if (criteriaIds.length > 0) {
          const issue: AccessibilityIssue = {
            id: req.id,
            component: componentName,
            severity: req.severity,
            wcagCriteria: criteriaIds,
            title: req.description,
            description: `${req.description}. Test method: ${req.testMethod}`,
            howToFix: getFixForRequirement(req.id, componentName),
            automated: req.automated,
          };

          if (req.severity === 'critical' || req.severity === 'serious') {
            issues.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }
    });
  }

  // Add code analysis issues
  if (codeAnalysis.missingAriaAttributes.length > 0) {
    codeAnalysis.missingAriaAttributes.forEach(attr => {
      warnings.push({
        id: `missing-${attr.replace(/[^a-z]/gi, '-')}`,
        component: componentName,
        severity: 'moderate',
        wcagCriteria: ['4.1.2'],
        title: `Missing ARIA attribute: ${attr}`,
        description: `The component may be missing the ARIA attribute: ${attr}`,
        howToFix: `Add ${attr} to improve accessibility`,
        automated: true,
      });
    });
  }

  // Add suggestions as recommendations
  codeAnalysis.suggestions.forEach(suggestion => {
    recommendations.push(suggestion);
  });

  // Build keyboard checklist
  const keyboardChecklist: KeyboardCheckItem[] = rules?.keyboardInteraction.map(ki => ({
    ...ki,
    implemented: checkKeyboardImplementation(ki.key, code),
  })) || [];

  // Calculate score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const seriousIssues = issues.filter(i => i.severity === 'serious').length;
  const moderateIssues = warnings.filter(i => i.severity === 'moderate').length;
  const minorIssues = warnings.filter(i => i.severity === 'minor').length;

  const totalDeductions = (criticalIssues * 25) + (seriousIssues * 15) + (moderateIssues * 5) + (minorIssues * 2);
  const score = Math.max(0, 100 - totalDeductions);

  return {
    component: componentName,
    timestamp: new Date(),
    wcagLevel,
    passed: criticalIssues === 0 && seriousIssues === 0,
    score,
    issues,
    warnings,
    recommendations,
    applicableCriteria,
    keyboardChecklist,
    screenReaderNotes: rules?.screenReaderBehavior || 'No specific screen reader notes for this component.',
  };
}

/**
 * Check if a specific violation exists in code
 */
function checkViolation(
  violation: Violation,
  code: string,
  analysis: ComponentCodeAnalysis
): boolean {
  switch (violation.id) {
    case 'button-no-name':
    case 'iconbutton-no-label':
    case 'textfield-no-label':
    case 'textarea-no-label':
    case 'checkbox-no-label':
    case 'search-no-label':
      return !analysis.hasAccessibleName;

    case 'button-div-span':
    case 'accordion-div-header':
      return /onClick\s*=/.test(code) && !/<button/.test(code) && !/role\s*=\s*["']button/.test(code);

    case 'button-no-focus':
      return !analysis.hasFocusIndicator && !/<button/.test(code);

    case 'textfield-placeholder-as-label':
      return /placeholder\s*=/.test(code) && !/<label/.test(code) && !/aria-label/.test(code);

    case 'tabs-missing-roles':
      return !(/role\s*=\s*["']tablist/.test(code) && /role\s*=\s*["']tab/.test(code));

    case 'accordion-no-state':
      return !/aria-expanded/.test(code);

    case 'checkbox-custom-no-aria':
      return !/type\s*=\s*["']checkbox/.test(code) && !/role\s*=\s*["']checkbox/.test(code);

    case 'progress-no-values':
      return !/aria-valuenow/.test(code);

    case 'alert-no-role':
      return !/role\s*=\s*["']alert/.test(code);

    case 'navitem-no-current':
      return !/aria-current/.test(code);

    case 'dropdown-no-state':
      return !/aria-expanded/.test(code);

    default:
      return false;
  }
}

/**
 * Check if a requirement is met
 */
function checkRequirement(
  requirementId: string,
  code: string,
  analysis: ComponentCodeAnalysis,
  componentName: string
): boolean {
  // Map requirement IDs to checks
  if (requirementId.includes('accessible-name') || requirementId.includes('label')) {
    return analysis.hasAccessibleName;
  }
  if (requirementId.includes('role')) {
    return analysis.hasProperRole;
  }
  if (requirementId.includes('focusable') || requirementId.includes('keyboard')) {
    return analysis.hasKeyboardSupport || /<button/.test(code) || /<input/.test(code);
  }
  if (requirementId.includes('focus-visible')) {
    return analysis.hasFocusIndicator;
  }
  if (requirementId.includes('expanded') || requirementId.includes('state')) {
    return analysis.hasAriaStates;
  }

  // Default to passed if we can't determine
  return true;
}

/**
 * Check if keyboard interaction is implemented
 */
function checkKeyboardImplementation(key: string, code: string): boolean {
  const keyLower = key.toLowerCase();

  if (keyLower === 'enter' || keyLower === 'space') {
    return /onClick/.test(code) || /onKeyDown/.test(code);
  }
  if (keyLower === 'tab') {
    return /<button/.test(code) || /<input/.test(code) || /tabIndex/.test(code);
  }
  if (keyLower.includes('arrow')) {
    return /onKeyDown/.test(code);
  }
  if (keyLower === 'escape') {
    return /onKeyDown/.test(code) && /escape|esc/i.test(code);
  }

  return /onKeyDown/.test(code);
}

/**
 * Get detailed description for a violation
 */
function getViolationDescription(violation: Violation, componentName: string): string {
  const criteriaDescriptions = violation.wcagCriteria
    .map(id => WCAG_CRITERIA[id])
    .filter(Boolean)
    .map(c => `${c.id} ${c.name} (Level ${c.level})`)
    .join(', ');

  return `${violation.description}. This violates WCAG criteria: ${criteriaDescriptions}. Impact: ${violation.impact}.`;
}

/**
 * Get fix suggestion for a requirement
 */
function getFixForRequirement(requirementId: string, componentName: string): string {
  const rules = getComponentRules(componentName);
  if (!rules) return 'Review component accessibility requirements.';

  const req = rules.requirements.find(r => r.id === requirementId);
  if (!req) return 'Review component accessibility requirements.';

  // Provide specific fixes based on requirement ID patterns
  if (requirementId.includes('accessible-name')) {
    return 'Add aria-label, aria-labelledby, or a visible <label> element to provide an accessible name.';
  }
  if (requirementId.includes('role')) {
    return `Use semantic HTML element or add appropriate role attribute. See ARIA APG pattern: ${rules.ariaPattern}`;
  }
  if (requirementId.includes('focus')) {
    return 'Add visible focus styles using CSS :focus or :focus-visible pseudo-classes. Ensure 3:1 contrast ratio.';
  }
  if (requirementId.includes('keyboard')) {
    return 'Add keyboard event handlers (onKeyDown) to support Enter, Space, and arrow key navigation as needed.';
  }

  return req.description;
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validate multiple components at once
 */
export function validateComponents(
  components: Array<{ name: string; code: string }>,
  wcagLevel: WCAGLevel = 'AA'
): AccessibilityReport[] {
  return components.map(({ name, code }) => validateComponent(name, code, wcagLevel));
}

/**
 * Generate summary report for multiple components
 */
export function generateSummaryReport(reports: AccessibilityReport[]): {
  totalComponents: number;
  passedComponents: number;
  failedComponents: number;
  averageScore: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  topIssues: Array<{ issue: string; count: number; components: string[] }>;
} {
  const criticalIssues = reports.flatMap(r => r.issues.filter(i => i.severity === 'critical'));
  const seriousIssues = reports.flatMap(r => r.issues.filter(i => i.severity === 'serious'));
  const moderateIssues = reports.flatMap(r => r.warnings.filter(i => i.severity === 'moderate'));
  const minorIssues = reports.flatMap(r => r.warnings.filter(i => i.severity === 'minor'));

  // Count issue occurrences
  const issueCounts = new Map<string, { count: number; components: string[] }>();
  [...criticalIssues, ...seriousIssues].forEach(issue => {
    const existing = issueCounts.get(issue.title) || { count: 0, components: [] };
    existing.count++;
    if (!existing.components.includes(issue.component)) {
      existing.components.push(issue.component);
    }
    issueCounts.set(issue.title, existing);
  });

  const topIssues = Array.from(issueCounts.entries())
    .map(([issue, data]) => ({ issue, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalComponents: reports.length,
    passedComponents: reports.filter(r => r.passed).length,
    failedComponents: reports.filter(r => !r.passed).length,
    averageScore: Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length),
    criticalIssues: criticalIssues.length,
    seriousIssues: seriousIssues.length,
    moderateIssues: moderateIssues.length,
    minorIssues: minorIssues.length,
    topIssues,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  WCAG_CRITERIA,
  COMPONENT_ACCESSIBILITY_RULES,
  getComponentRules,
  getCriteriaByComponent,
  getLevelAACriteria,
};
