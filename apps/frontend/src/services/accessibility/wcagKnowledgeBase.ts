/**
 * WCAG Knowledge Base
 *
 * Comprehensive accessibility guidelines based on:
 * - WCAG 2.1 (W3C Recommendation)
 * - WCAG 2.2 (W3C Recommendation, October 2023)
 * - ADA Title II Requirements (April 2024)
 * - Section 508 Standards
 * - ARIA Authoring Practices Guide (APG)
 *
 * This knowledge base enables UI Forge to act as a seasoned accessibility expert,
 * identifying potential violations and ensuring generated components are accessible.
 *
 * @see https://www.w3.org/WAI/standards-guidelines/wcag/
 * @see https://www.w3.org/WAI/ARIA/apg/
 * @see https://www.ada.gov/resources/2024-03-08-web-rule/
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type WCAGVersion = '2.0' | '2.1' | '2.2';
export type WCAGPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

export interface WCAGCriterion {
  id: string;                    // e.g., "1.1.1"
  name: string;                  // e.g., "Non-text Content"
  level: WCAGLevel;
  principle: WCAGPrinciple;
  guideline: string;             // e.g., "1.1 Text Alternatives"
  version: WCAGVersion;          // When it was introduced
  description: string;
  requirement: string;           // What must be done
  techniques: string[];          // How to achieve compliance
  failures: string[];            // Common ways to fail
  testProcedure: string;         // How to test
  applicableComponents: string[]; // Which UI components this applies to
}

export interface ComponentAccessibilityRule {
  component: string;             // e.g., "Button", "TextField"
  wcagCriteria: string[];        // Related WCAG criteria IDs
  requirements: AccessibilityRequirement[];
  ariaPattern: string;           // Link to ARIA APG pattern
  keyboardInteraction: KeyboardRequirement[];
  screenReaderBehavior: string;
  commonViolations: Violation[];
  codeExample: {
    correct: string;
    incorrect: string;
  };
}

export interface AccessibilityRequirement {
  id: string;
  description: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  automated: boolean;            // Can be tested automatically
  testMethod: string;
}

export interface KeyboardRequirement {
  key: string;                   // e.g., "Enter", "Space", "Tab"
  action: string;                // What should happen
  required: boolean;
}

export interface Violation {
  id: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  howToFix: string;
  wcagCriteria: string[];
}

export interface ColorContrastResult {
  ratio: number;
  passes: {
    normalTextAA: boolean;       // 4.5:1
    normalTextAAA: boolean;      // 7:1
    largeTextAA: boolean;        // 3:1
    largeTextAAA: boolean;       // 4.5:1
    uiComponentsAA: boolean;     // 3:1
  };
}

// ============================================================================
// WCAG 2.2 COMPLETE SUCCESS CRITERIA
// ============================================================================

export const WCAG_CRITERIA: Record<string, WCAGCriterion> = {
  // -------------------------------------------------------------------------
  // PRINCIPLE 1: PERCEIVABLE
  // -------------------------------------------------------------------------

  // Guideline 1.1 Text Alternatives
  '1.1.1': {
    id: '1.1.1',
    name: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.1 Text Alternatives',
    version: '2.0',
    description: 'All non-text content has a text alternative that serves the equivalent purpose.',
    requirement: 'Provide text alternatives for any non-text content so that it can be changed into other forms people need, such as large print, braille, speech, symbols or simpler language.',
    techniques: [
      'Use alt attribute for images',
      'Use aria-label for icon buttons',
      'Use aria-labelledby for complex images',
      'Use figure and figcaption for images with captions',
      'Use empty alt="" for decorative images',
    ],
    failures: [
      'Missing alt attribute on img elements',
      'Using non-descriptive alt text like "image" or "photo"',
      'Icon buttons without accessible names',
      'Background images conveying meaning without text alternative',
    ],
    testProcedure: 'Check that all images have appropriate alt text. Verify icon buttons have aria-label. Test with screen reader.',
    applicableComponents: ['Avatar', 'Button', 'IconButton', 'Badge', 'Alert'],
  },

  // Guideline 1.3 Adaptable
  '1.3.1': {
    id: '1.3.1',
    name: 'Info and Relationships',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.3 Adaptable',
    version: '2.0',
    description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.',
    requirement: 'Use semantic HTML elements to convey structure and relationships. Use ARIA where HTML is insufficient.',
    techniques: [
      'Use semantic HTML elements (button, input, nav, main, etc.)',
      'Use proper heading hierarchy (h1-h6)',
      'Associate labels with form controls',
      'Use fieldset and legend for related form controls',
      'Use tables for tabular data with proper headers',
    ],
    failures: [
      'Using div/span instead of semantic elements',
      'Missing form labels',
      'Incorrect heading hierarchy',
      'Using visual styling instead of semantic structure',
    ],
    testProcedure: 'Review HTML structure. Verify semantic elements are used correctly. Test with screen reader to ensure relationships are announced.',
    applicableComponents: ['TextField', 'TextArea', 'Checkbox', 'Tabs', 'NavItem', 'Accordion'],
  },

  '1.3.2': {
    id: '1.3.2',
    name: 'Meaningful Sequence',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.3 Adaptable',
    version: '2.0',
    description: 'When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined.',
    requirement: 'Ensure DOM order matches visual order. Screen readers should read content in a logical sequence.',
    techniques: [
      'Ensure source code order matches visual order',
      'Use CSS for visual positioning without changing DOM order',
      'Use flexbox/grid order property carefully',
    ],
    failures: [
      'Using CSS to reorder content that changes meaning',
      'Tab order not matching visual order',
    ],
    testProcedure: 'Tab through the page. Verify focus order matches visual layout. Test with screen reader.',
    applicableComponents: ['Tabs', 'NavItem', 'Breadcrumb', 'Accordion'],
  },

  '1.3.3': {
    id: '1.3.3',
    name: 'Sensory Characteristics',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.3 Adaptable',
    version: '2.0',
    description: 'Instructions do not rely solely on sensory characteristics such as shape, color, size, visual location, orientation, or sound.',
    requirement: 'Provide multiple ways to identify interactive elements. Do not rely solely on color.',
    techniques: [
      'Use text labels in addition to icons',
      'Use patterns or textures with color',
      'Provide text instructions alongside visual cues',
    ],
    failures: [
      'Indicating required fields only with color',
      'Using "click the red button" as instruction',
      'Error states indicated only by color change',
    ],
    testProcedure: 'Review all instructions. Ensure they do not rely solely on sensory characteristics.',
    applicableComponents: ['Button', 'TextField', 'Checkbox', 'Alert'],
  },

  '1.3.4': {
    id: '1.3.4',
    name: 'Orientation',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.3 Adaptable',
    version: '2.1',
    description: 'Content does not restrict its view and operation to a single display orientation unless essential.',
    requirement: 'Allow content to be viewed in both portrait and landscape orientations.',
    techniques: [
      'Use responsive design that works in both orientations',
      'Avoid using orientation-specific CSS without alternative',
    ],
    failures: [
      'Locking screen to one orientation',
      'Content unusable in one orientation',
    ],
    testProcedure: 'Test content in both portrait and landscape modes on mobile devices.',
    applicableComponents: ['All'],
  },

  '1.3.5': {
    id: '1.3.5',
    name: 'Identify Input Purpose',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.3 Adaptable',
    version: '2.1',
    description: 'The purpose of each input field collecting user information can be programmatically determined.',
    requirement: 'Use autocomplete attribute on form fields to identify input purpose.',
    techniques: [
      'Use autocomplete attribute with appropriate values',
      'Use input type attribute correctly (email, tel, etc.)',
      'Apply autocomplete="name", "email", "tel", etc.',
    ],
    failures: [
      'Missing autocomplete attribute on user info fields',
      'Using incorrect autocomplete values',
    ],
    testProcedure: 'Check that input fields have appropriate autocomplete attributes.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput'],
  },

  // Guideline 1.4 Distinguishable
  '1.4.1': {
    id: '1.4.1',
    name: 'Use of Color',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.0',
    description: 'Color is not used as the only visual means of conveying information.',
    requirement: 'Provide additional visual indicators besides color (icons, text, patterns).',
    techniques: [
      'Use text labels with color indicators',
      'Add icons or patterns to color-coded elements',
      'Underline links in addition to color',
      'Use borders or other visual distinctions',
    ],
    failures: [
      'Required fields indicated only by color',
      'Error messages distinguished only by color',
      'Links distinguished only by color',
      'Chart data distinguished only by color',
    ],
    testProcedure: 'View content in grayscale. Verify all information is still conveyed.',
    applicableComponents: ['Alert', 'Badge', 'Button', 'TextField', 'Chip'],
  },

  '1.4.2': {
    id: '1.4.2',
    name: 'Audio Control',
    level: 'A',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.0',
    description: 'If audio plays automatically for more than 3 seconds, provide controls to pause or stop it.',
    requirement: 'Provide mechanism to pause, stop, or control volume of auto-playing audio.',
    techniques: [
      'Do not auto-play audio',
      'Provide visible pause/stop controls',
      'Provide volume control independent of system volume',
    ],
    failures: [
      'Auto-playing audio with no controls',
      'Background music that cannot be stopped',
    ],
    testProcedure: 'Check for auto-playing audio. Verify controls are available.',
    applicableComponents: [],
  },

  '1.4.3': {
    id: '1.4.3',
    name: 'Contrast (Minimum)',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.0',
    description: 'Text has a contrast ratio of at least 4.5:1 (3:1 for large text).',
    requirement: 'Ensure text has sufficient contrast against background. Large text (18pt+ or 14pt+ bold) requires 3:1 minimum.',
    techniques: [
      'Use contrast ratio of at least 4.5:1 for normal text',
      'Use contrast ratio of at least 3:1 for large text',
      'Test with color contrast analyzer tools',
      'Consider users with low vision and color blindness',
    ],
    failures: [
      'Light gray text on white background',
      'Text over complex images without overlay',
      'Placeholder text with insufficient contrast',
      'Disabled state text with insufficient contrast',
    ],
    testProcedure: 'Use color contrast analyzer. Check all text/background combinations.',
    applicableComponents: ['Button', 'TextField', 'TextArea', 'Alert', 'Badge', 'Chip', 'NavItem', 'Tabs'],
  },

  '1.4.4': {
    id: '1.4.4',
    name: 'Resize Text',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.0',
    description: 'Text can be resized up to 200% without loss of content or functionality.',
    requirement: 'Use relative units (rem, em, %) for font sizes. Ensure layout accommodates larger text.',
    techniques: [
      'Use relative units for font sizes',
      'Test with browser zoom at 200%',
      'Use flexible layouts that accommodate text resize',
      'Avoid fixed-height containers for text',
    ],
    failures: [
      'Using px for font sizes',
      'Text overflow hidden when resized',
      'Layout breaks at 200% zoom',
      'Fixed-height containers truncating text',
    ],
    testProcedure: 'Zoom to 200% in browser. Verify all content is readable and functional.',
    applicableComponents: ['All'],
  },

  '1.4.5': {
    id: '1.4.5',
    name: 'Images of Text',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.0',
    description: 'Text is used instead of images of text (with exceptions for logos).',
    requirement: 'Use actual text instead of images of text for better accessibility and scalability.',
    techniques: [
      'Use CSS styling instead of text images',
      'Use web fonts for decorative text',
      'Only use text images for logos or essential customization',
    ],
    failures: [
      'Using images for headings',
      'Navigation items as images',
      'Call-to-action buttons as images',
    ],
    testProcedure: 'Identify any images of text. Verify they are essential or logos.',
    applicableComponents: ['Button', 'NavItem', 'Tabs'],
  },

  '1.4.10': {
    id: '1.4.10',
    name: 'Reflow',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.1',
    description: 'Content can be presented without loss of information at 320 CSS pixels wide without horizontal scrolling.',
    requirement: 'Ensure content reflows to fit narrow viewports without horizontal scrolling (except for content that requires 2D layout).',
    techniques: [
      'Use responsive design principles',
      'Use CSS media queries for layout changes',
      'Stack content vertically on narrow screens',
      'Avoid fixed-width containers',
    ],
    failures: [
      'Horizontal scrolling required at 320px width',
      'Content cut off on narrow screens',
      'Fixed-width layouts',
    ],
    testProcedure: 'View content at 320px width (or 400% zoom). Verify no horizontal scrolling.',
    applicableComponents: ['All'],
  },

  '1.4.11': {
    id: '1.4.11',
    name: 'Non-text Contrast',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.1',
    description: 'UI components and graphical objects have a contrast ratio of at least 3:1.',
    requirement: 'Ensure form controls, focus indicators, and icons have 3:1 contrast ratio against adjacent colors.',
    techniques: [
      'Use 3:1 contrast for form control borders',
      'Use 3:1 contrast for focus indicators',
      'Use 3:1 contrast for icons conveying information',
      'Test all interactive component states',
    ],
    failures: [
      'Light gray borders on form inputs',
      'Low contrast focus indicators',
      'Icons with insufficient contrast',
      'Chart elements with low contrast',
    ],
    testProcedure: 'Check contrast of all UI components and graphical objects. Use contrast analyzer.',
    applicableComponents: ['Button', 'TextField', 'TextArea', 'Checkbox', 'IconButton', 'SearchInput', 'Chip'],
  },

  '1.4.12': {
    id: '1.4.12',
    name: 'Text Spacing',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.1',
    description: 'No loss of content when text spacing is adjusted (line height 1.5, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em).',
    requirement: 'Ensure content accommodates user-adjusted text spacing without loss of functionality.',
    techniques: [
      'Use flexible containers that expand with text',
      'Avoid fixed-height text containers',
      'Test with text spacing bookmarklet',
    ],
    failures: [
      'Text overflow hidden',
      'Text overlapping when spacing increased',
      'Buttons becoming unusable with spacing changes',
    ],
    testProcedure: 'Apply text spacing adjustments. Verify all content remains visible and functional.',
    applicableComponents: ['Button', 'TextField', 'TextArea', 'NavItem', 'Tabs', 'Alert'],
  },

  '1.4.13': {
    id: '1.4.13',
    name: 'Content on Hover or Focus',
    level: 'AA',
    principle: 'Perceivable',
    guideline: '1.4 Distinguishable',
    version: '2.1',
    description: 'Additional content on hover/focus is dismissible, hoverable, and persistent.',
    requirement: 'Tooltips and popovers must be dismissible (Escape), hoverable (can move mouse to them), and persistent (stay until dismissed).',
    techniques: [
      'Allow Escape key to dismiss hover content',
      'Keep hover content visible when moused over',
      'Do not auto-dismiss hover content on timeout',
      'Ensure hover content does not obscure trigger',
    ],
    failures: [
      'Tooltips that disappear when moving mouse',
      'No way to dismiss hover content',
      'Hover content that auto-dismisses',
      'Hover content that obscures other content',
    ],
    testProcedure: 'Test all hover/focus content. Verify dismissible, hoverable, and persistent.',
    applicableComponents: ['Button', 'IconButton', 'NavItem'],
  },

  // -------------------------------------------------------------------------
  // PRINCIPLE 2: OPERABLE
  // -------------------------------------------------------------------------

  // Guideline 2.1 Keyboard Accessible
  '2.1.1': {
    id: '2.1.1',
    name: 'Keyboard',
    level: 'A',
    principle: 'Operable',
    guideline: '2.1 Keyboard Accessible',
    version: '2.0',
    description: 'All functionality is operable through a keyboard interface.',
    requirement: 'Ensure all interactive elements can be accessed and operated using keyboard alone.',
    techniques: [
      'Use native interactive elements (button, a, input)',
      'Add tabindex="0" for custom interactive elements',
      'Implement keyboard event handlers (keydown, keyup)',
      'Follow ARIA keyboard patterns',
    ],
    failures: [
      'Click-only event handlers',
      'Custom controls without keyboard support',
      'Drag-and-drop without keyboard alternative',
      'Mousedown/mouseup without keyboard equivalent',
    ],
    testProcedure: 'Unplug mouse. Navigate entire interface using only keyboard. Verify all functions accessible.',
    applicableComponents: ['All'],
  },

  '2.1.2': {
    id: '2.1.2',
    name: 'No Keyboard Trap',
    level: 'A',
    principle: 'Operable',
    guideline: '2.1 Keyboard Accessible',
    version: '2.0',
    description: 'Keyboard focus can be moved away from any component using only the keyboard.',
    requirement: 'Ensure keyboard users can always navigate away from interactive components.',
    techniques: [
      'Test Tab and Shift+Tab navigation',
      'Provide clear focus trap exit for modals',
      'Document any non-standard keyboard patterns',
    ],
    failures: [
      'Modal dialogs without escape mechanism',
      'Rich text editors that trap focus',
      'Infinite tab loops',
    ],
    testProcedure: 'Tab through all components. Verify focus can always move away.',
    applicableComponents: ['All'],
  },

  '2.1.4': {
    id: '2.1.4',
    name: 'Character Key Shortcuts',
    level: 'A',
    principle: 'Operable',
    guideline: '2.1 Keyboard Accessible',
    version: '2.1',
    description: 'Single character key shortcuts can be turned off, remapped, or are only active when relevant component has focus.',
    requirement: 'Avoid single character shortcuts or provide mechanism to disable/remap them.',
    techniques: [
      'Require modifier key for shortcuts (Ctrl, Alt)',
      'Only activate shortcuts when component is focused',
      'Provide settings to disable/remap shortcuts',
    ],
    failures: [
      'Single letter shortcuts active page-wide',
      'No way to disable single key shortcuts',
    ],
    testProcedure: 'Identify single character shortcuts. Verify they can be disabled or remapped.',
    applicableComponents: ['SearchInput', 'TextField', 'TextArea'],
  },

  // Guideline 2.4 Navigable
  '2.4.1': {
    id: '2.4.1',
    name: 'Bypass Blocks',
    level: 'A',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.0',
    description: 'A mechanism is available to bypass blocks of content repeated on multiple pages.',
    requirement: 'Provide skip links or proper heading structure to bypass repeated content.',
    techniques: [
      'Add "Skip to main content" link',
      'Use proper heading hierarchy',
      'Use landmark regions (main, nav, aside)',
      'Provide table of contents for long pages',
    ],
    failures: [
      'No skip link',
      'Skip link not visible on focus',
      'Missing landmark regions',
    ],
    testProcedure: 'Tab from beginning of page. Verify skip link appears and works.',
    applicableComponents: ['NavItem', 'Breadcrumb'],
  },

  '2.4.3': {
    id: '2.4.3',
    name: 'Focus Order',
    level: 'A',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.0',
    description: 'Interactive elements receive focus in an order that preserves meaning and operability.',
    requirement: 'Ensure focus order follows logical reading sequence and maintains context.',
    techniques: [
      'Match DOM order to visual order',
      'Use tabindex="0" for custom controls',
      'Avoid positive tabindex values',
      'Manage focus when content changes dynamically',
    ],
    failures: [
      'Focus jumps unexpectedly',
      'Tabindex greater than 0',
      'Focus order doesn\'t match visual layout',
    ],
    testProcedure: 'Tab through interface. Verify focus order is logical and predictable.',
    applicableComponents: ['All'],
  },

  '2.4.4': {
    id: '2.4.4',
    name: 'Link Purpose (In Context)',
    level: 'A',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.0',
    description: 'The purpose of each link can be determined from the link text alone or from context.',
    requirement: 'Use descriptive link text. Avoid "click here" or "read more" without context.',
    techniques: [
      'Use descriptive link text',
      'Use aria-label for ambiguous links',
      'Use aria-describedby for additional context',
      'Ensure link purpose is clear from surrounding text',
    ],
    failures: [
      'Generic link text like "click here"',
      'Multiple "read more" links on same page',
      'Icon-only links without accessible names',
    ],
    testProcedure: 'Review all links. Verify purpose is clear from text or context.',
    applicableComponents: ['Button', 'NavItem', 'Breadcrumb'],
  },

  '2.4.6': {
    id: '2.4.6',
    name: 'Headings and Labels',
    level: 'AA',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.0',
    description: 'Headings and labels describe topic or purpose.',
    requirement: 'Use descriptive headings and labels that clearly indicate content or field purpose.',
    techniques: [
      'Use descriptive headings that summarize content',
      'Use clear, concise form labels',
      'Avoid generic labels like "Field 1"',
    ],
    failures: [
      'Generic headings like "Section 1"',
      'Labels that don\'t describe field purpose',
      'Placeholder text used as only label',
    ],
    testProcedure: 'Review all headings and labels. Verify they are descriptive.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Checkbox', 'Accordion'],
  },

  '2.4.7': {
    id: '2.4.7',
    name: 'Focus Visible',
    level: 'AA',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.0',
    description: 'Any keyboard operable interface has a mode of operation where the keyboard focus indicator is visible.',
    requirement: 'Provide clearly visible focus indicator for all interactive elements.',
    techniques: [
      'Use visible focus styles (outline, border, background)',
      'Ensure focus indicator has sufficient contrast',
      'Do not use outline:none without alternative',
      'Make focus indicator visible in all color modes',
    ],
    failures: [
      'Using outline:none without alternative',
      'Focus indicator with insufficient contrast',
      'Focus indicator too small to see',
      'Focus indicator hidden by other content',
    ],
    testProcedure: 'Tab through interface. Verify focus indicator is clearly visible.',
    applicableComponents: ['Button', 'TextField', 'TextArea', 'Checkbox', 'IconButton', 'NavItem', 'Tabs', 'SearchInput', 'Chip'],
  },

  // New in WCAG 2.2
  '2.4.11': {
    id: '2.4.11',
    name: 'Focus Not Obscured (Minimum)',
    level: 'AA',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.2',
    description: 'When a component receives keyboard focus, it is not entirely hidden by author-created content.',
    requirement: 'Ensure at least part of the focused element is visible when using sticky headers, footers, or overlays.',
    techniques: [
      'Use scroll-margin/scroll-padding with sticky elements',
      'Ensure modals do not cover focused elements behind them',
      'Test with various viewport sizes',
    ],
    failures: [
      'Focused element hidden by sticky header',
      'Focused element obscured by chat widget',
      'Cookie banner covering focused content',
    ],
    testProcedure: 'Tab through interface. Verify focused elements are at least partially visible.',
    applicableComponents: ['All'],
  },

  '2.4.13': {
    id: '2.4.13',
    name: 'Focus Appearance',
    level: 'AAA',
    principle: 'Operable',
    guideline: '2.4 Navigable',
    version: '2.2',
    description: 'Focus indicator has sufficient size and contrast.',
    requirement: 'Focus indicator area must be at least as large as 2px thick perimeter with 3:1 contrast.',
    techniques: [
      'Use minimum 2px outline/border for focus',
      'Ensure 3:1 contrast between focused and unfocused states',
      'Use solid focus indicators rather than dotted',
    ],
    failures: [
      'Focus indicator thinner than 2px',
      'Focus indicator with less than 3:1 contrast',
      'Focus indicator that blends with background',
    ],
    testProcedure: 'Measure focus indicator thickness and contrast.',
    applicableComponents: ['All'],
  },

  // Guideline 2.5 Input Modalities
  '2.5.1': {
    id: '2.5.1',
    name: 'Pointer Gestures',
    level: 'A',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.1',
    description: 'Functionality requiring multipoint or path-based gestures has single-pointer alternatives.',
    requirement: 'Provide single-click alternatives for pinch, swipe, or multi-touch gestures.',
    techniques: [
      'Provide buttons for zoom instead of pinch-only',
      'Add arrow buttons for carousel navigation',
      'Include step-by-step controls for path gestures',
    ],
    failures: [
      'Pinch-to-zoom with no button alternative',
      'Swipe-only navigation',
      'Multi-finger gestures without alternatives',
    ],
    testProcedure: 'Identify gesture-based interactions. Verify single-pointer alternatives exist.',
    applicableComponents: ['All'],
  },

  '2.5.2': {
    id: '2.5.2',
    name: 'Pointer Cancellation',
    level: 'A',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.1',
    description: 'Functionality triggered by single pointer can be cancelled, or down-event is not used.',
    requirement: 'Actions should complete on up-event (release) not down-event (press), allowing cancellation.',
    techniques: [
      'Use click/mouseup instead of mousedown',
      'Allow dragging away from target to cancel',
      'Provide undo mechanism for completed actions',
    ],
    failures: [
      'Action triggers on mousedown/touchstart',
      'No way to cancel accidental clicks',
    ],
    testProcedure: 'Test pointer interactions. Verify actions can be cancelled before completion.',
    applicableComponents: ['Button', 'IconButton', 'Checkbox', 'Chip'],
  },

  '2.5.3': {
    id: '2.5.3',
    name: 'Label in Name',
    level: 'A',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.1',
    description: 'For components with visible text labels, the accessible name contains the visible text.',
    requirement: 'Accessible name must include the visible label text for voice control compatibility.',
    techniques: [
      'Ensure aria-label includes visible text',
      'Use visible text as the accessible name',
      'If aria-label differs, include visible text at start',
    ],
    failures: [
      'aria-label completely different from visible text',
      'Visible text not included in accessible name',
    ],
    testProcedure: 'Compare visible labels with accessible names. Verify visible text is included.',
    applicableComponents: ['Button', 'TextField', 'TextArea', 'Checkbox', 'NavItem', 'Tabs'],
  },

  '2.5.4': {
    id: '2.5.4',
    name: 'Motion Actuation',
    level: 'A',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.1',
    description: 'Functionality triggered by device motion has UI alternatives and can be disabled.',
    requirement: 'Provide alternatives to shake, tilt, or motion-based interactions.',
    techniques: [
      'Provide button alternatives for motion actions',
      'Allow users to disable motion responses',
    ],
    failures: [
      'Shake-to-undo with no button alternative',
      'Tilt-to-scroll with no scroll controls',
    ],
    testProcedure: 'Identify motion-based features. Verify UI alternatives exist.',
    applicableComponents: [],
  },

  // New in WCAG 2.2
  '2.5.7': {
    id: '2.5.7',
    name: 'Dragging Movements',
    level: 'AA',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.2',
    description: 'Functionality that uses dragging has single-pointer alternative.',
    requirement: 'Provide click/tap alternatives for drag-and-drop functionality.',
    techniques: [
      'Add move up/down buttons for reorderable lists',
      'Include click-to-select then click-to-place option',
      'Provide context menu options for drag actions',
    ],
    failures: [
      'Drag-only reordering with no buttons',
      'Slider requiring drag with no input field',
      'File upload requiring drag-drop only',
    ],
    testProcedure: 'Identify drag-based interactions. Verify single-pointer alternatives exist.',
    applicableComponents: ['All'],
  },

  '2.5.8': {
    id: '2.5.8',
    name: 'Target Size (Minimum)',
    level: 'AA',
    principle: 'Operable',
    guideline: '2.5 Input Modalities',
    version: '2.2',
    description: 'Touch targets are at least 24x24 CSS pixels.',
    requirement: 'Ensure interactive elements meet minimum 24x24 pixel target size.',
    techniques: [
      'Use minimum 24x24 pixel dimensions for touch targets',
      'Add padding to increase touch target size',
      'Ensure adequate spacing between adjacent targets',
    ],
    failures: [
      'Icon buttons smaller than 24x24 pixels',
      'Tightly packed interactive elements',
      'Small checkbox/radio targets',
    ],
    testProcedure: 'Measure interactive element dimensions. Verify minimum 24x24 pixels.',
    applicableComponents: ['Button', 'IconButton', 'Checkbox', 'NavItem', 'Chip'],
  },

  // -------------------------------------------------------------------------
  // PRINCIPLE 3: UNDERSTANDABLE
  // -------------------------------------------------------------------------

  // Guideline 3.1 Readable
  '3.1.1': {
    id: '3.1.1',
    name: 'Language of Page',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.1 Readable',
    version: '2.0',
    description: 'The default human language of each page can be programmatically determined.',
    requirement: 'Use lang attribute on html element to specify page language.',
    techniques: [
      'Add lang attribute to html element',
      'Use valid language codes (en, es, fr, etc.)',
    ],
    failures: [
      'Missing lang attribute',
      'Invalid language code',
    ],
    testProcedure: 'Check html element for lang attribute with valid language code.',
    applicableComponents: [],
  },

  '3.1.2': {
    id: '3.1.2',
    name: 'Language of Parts',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.1 Readable',
    version: '2.0',
    description: 'The language of each passage or phrase can be programmatically determined.',
    requirement: 'Use lang attribute on elements containing text in a different language.',
    techniques: [
      'Add lang attribute to elements with different language text',
      'Identify proper nouns and technical terms that don\'t need lang',
    ],
    failures: [
      'Foreign language text without lang attribute',
    ],
    testProcedure: 'Identify text in different languages. Verify lang attribute is present.',
    applicableComponents: ['All'],
  },

  // Guideline 3.2 Predictable
  '3.2.1': {
    id: '3.2.1',
    name: 'On Focus',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.2 Predictable',
    version: '2.0',
    description: 'Receiving focus does not initiate a change of context.',
    requirement: 'Focus alone should not trigger unexpected navigation or form submission.',
    techniques: [
      'Use onclick/keypress for actions, not onfocus',
      'Warn users before focus-triggered changes',
    ],
    failures: [
      'Auto-submitting form on focus',
      'Opening new window on focus',
      'Auto-navigation on focus',
    ],
    testProcedure: 'Tab through all focusable elements. Verify no unexpected changes occur.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Checkbox'],
  },

  '3.2.2': {
    id: '3.2.2',
    name: 'On Input',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.2 Predictable',
    version: '2.0',
    description: 'Changing a setting does not cause a change of context unless user is warned.',
    requirement: 'Form controls should not auto-submit or cause navigation without warning.',
    techniques: [
      'Use submit button rather than auto-submit',
      'Warn users before input-triggered changes',
      'Provide explicit submit action',
    ],
    failures: [
      'Select dropdown that navigates on change',
      'Checkbox that submits form on change',
      'Radio button that causes navigation',
    ],
    testProcedure: 'Test all form controls. Verify no unexpected context changes.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Checkbox'],
  },

  '3.2.3': {
    id: '3.2.3',
    name: 'Consistent Navigation',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.2 Predictable',
    version: '2.0',
    description: 'Navigation mechanisms repeated on multiple pages occur in the same relative order.',
    requirement: 'Keep navigation in consistent location and order across pages.',
    techniques: [
      'Use consistent navigation layout across pages',
      'Maintain consistent menu order',
      'Keep search in same location',
    ],
    failures: [
      'Navigation order changes between pages',
      'Navigation moves to different location',
    ],
    testProcedure: 'Compare navigation across multiple pages. Verify consistency.',
    applicableComponents: ['NavItem', 'Breadcrumb', 'Tabs'],
  },

  '3.2.4': {
    id: '3.2.4',
    name: 'Consistent Identification',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.2 Predictable',
    version: '2.0',
    description: 'Components with same functionality are identified consistently.',
    requirement: 'Use consistent labeling for similar functionality across the site.',
    techniques: [
      'Use same labels for same functions',
      'Use consistent icon meanings',
      'Apply same patterns for similar interactions',
    ],
    failures: [
      'Search labeled "Search" on one page, "Find" on another',
      'Download icon meaning different things on different pages',
    ],
    testProcedure: 'Compare similar functionality across pages. Verify consistent labeling.',
    applicableComponents: ['Button', 'IconButton', 'SearchInput'],
  },

  // New in WCAG 2.2
  '3.2.6': {
    id: '3.2.6',
    name: 'Consistent Help',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.2 Predictable',
    version: '2.2',
    description: 'Help mechanisms appear in consistent locations across pages.',
    requirement: 'If help is provided, keep it in the same relative location on every page.',
    techniques: [
      'Place help link in consistent header/footer location',
      'Keep chat widget in same position',
      'Maintain consistent contact information location',
    ],
    failures: [
      'Help link in header on some pages, footer on others',
      'Chat widget position varies by page',
    ],
    testProcedure: 'Check help mechanisms across multiple pages. Verify consistent placement.',
    applicableComponents: ['Button', 'NavItem'],
  },

  // Guideline 3.3 Input Assistance
  '3.3.1': {
    id: '3.3.1',
    name: 'Error Identification',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.0',
    description: 'If an error is detected, the item in error is identified and described in text.',
    requirement: 'Provide clear error messages that identify the problem field and describe the error.',
    techniques: [
      'Display error messages near the field',
      'Use aria-invalid and aria-describedby',
      'Provide specific error descriptions',
      'Use role="alert" for error announcements',
    ],
    failures: [
      'Generic "form has errors" message',
      'Error indicated only by color',
      'No identification of which field has error',
    ],
    testProcedure: 'Submit form with errors. Verify errors are identified and described.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Checkbox', 'Alert'],
  },

  '3.3.2': {
    id: '3.3.2',
    name: 'Labels or Instructions',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.0',
    description: 'Labels or instructions are provided when content requires user input.',
    requirement: 'All form fields must have visible labels. Provide instructions for expected format.',
    techniques: [
      'Use visible labels for all form fields',
      'Provide format hints (e.g., MM/DD/YYYY)',
      'Indicate required fields with text, not just asterisk',
      'Group related fields with fieldset/legend',
    ],
    failures: [
      'Placeholder text as only label',
      'No indication of required fields',
      'No format instructions for complex fields',
    ],
    testProcedure: 'Review all form fields. Verify visible labels and instructions.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Checkbox'],
  },

  '3.3.3': {
    id: '3.3.3',
    name: 'Error Suggestion',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.0',
    description: 'If an error is detected and suggestions are known, they are provided to the user.',
    requirement: 'Error messages should suggest how to fix the problem.',
    techniques: [
      'Provide specific correction suggestions',
      'Show expected format with example',
      'Offer alternatives for typos',
    ],
    failures: [
      'Error says "invalid" with no suggestion',
      'No guidance on how to fix the error',
    ],
    testProcedure: 'Trigger validation errors. Verify suggestions are provided.',
    applicableComponents: ['TextField', 'TextArea', 'SearchInput', 'Alert'],
  },

  '3.3.4': {
    id: '3.3.4',
    name: 'Error Prevention (Legal, Financial, Data)',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.0',
    description: 'For pages that cause legal/financial commitments or modify user data, submissions are reversible, verified, or confirmed.',
    requirement: 'Provide confirmation, review, or undo for important transactions.',
    techniques: [
      'Add confirmation step before final submission',
      'Provide review page showing entered data',
      'Allow users to undo/reverse submissions',
      'Require explicit confirmation for destructive actions',
    ],
    failures: [
      'No confirmation for purchase',
      'No way to review data before submit',
      'Irreversible actions without warning',
    ],
    testProcedure: 'Test submission of important data. Verify confirmation/review step.',
    applicableComponents: ['Button', 'Alert'],
  },

  // New in WCAG 2.2
  '3.3.7': {
    id: '3.3.7',
    name: 'Redundant Entry',
    level: 'A',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.2',
    description: 'Information already entered is auto-populated or available for selection.',
    requirement: 'Do not require users to re-enter information in the same process.',
    techniques: [
      'Auto-populate fields with previously entered data',
      'Provide dropdown to select from previous entries',
      'Use "same as billing" checkbox for addresses',
    ],
    failures: [
      'Asking for email twice without auto-fill',
      'Requiring address entry twice in checkout',
    ],
    testProcedure: 'Complete multi-step form. Verify data is not requested twice.',
    applicableComponents: ['TextField', 'TextArea'],
  },

  '3.3.8': {
    id: '3.3.8',
    name: 'Accessible Authentication (Minimum)',
    level: 'AA',
    principle: 'Understandable',
    guideline: '3.3 Input Assistance',
    version: '2.2',
    description: 'Authentication does not require cognitive function test unless alternatives exist.',
    requirement: 'Provide alternatives to memory-based or puzzle authentication.',
    techniques: [
      'Allow paste in password fields',
      'Support password managers',
      'Provide email magic link alternative',
      'Use biometric or device-based auth',
    ],
    failures: [
      'CAPTCHA with no audio/alternative option',
      'Blocking paste in password fields',
      'Requiring memorization of codes',
    ],
    testProcedure: 'Test authentication flow. Verify no cognitive function test required.',
    applicableComponents: ['TextField', 'Button'],
  },

  // -------------------------------------------------------------------------
  // PRINCIPLE 4: ROBUST
  // -------------------------------------------------------------------------

  '4.1.2': {
    id: '4.1.2',
    name: 'Name, Role, Value',
    level: 'A',
    principle: 'Robust',
    guideline: '4.1 Compatible',
    version: '2.0',
    description: 'For all UI components, name and role can be programmatically determined; states and values can be programmatically set.',
    requirement: 'Use semantic HTML or ARIA to ensure assistive technologies can identify component purpose and state.',
    techniques: [
      'Use semantic HTML elements (button, input, select)',
      'Provide accessible names via label, aria-label, or aria-labelledby',
      'Use appropriate ARIA roles for custom components',
      'Update aria-expanded, aria-selected, aria-checked states',
    ],
    failures: [
      'Custom button without role="button"',
      'Missing accessible name',
      'State not communicated (expanded, selected)',
      'Using div/span for interactive elements without ARIA',
    ],
    testProcedure: 'Test with screen reader. Verify all controls announce name, role, and state.',
    applicableComponents: ['All'],
  },

  '4.1.3': {
    id: '4.1.3',
    name: 'Status Messages',
    level: 'AA',
    principle: 'Robust',
    guideline: '4.1 Compatible',
    version: '2.1',
    description: 'Status messages can be programmatically determined without receiving focus.',
    requirement: 'Use ARIA live regions to announce status changes to screen readers.',
    techniques: [
      'Use role="status" or aria-live="polite" for status messages',
      'Use role="alert" or aria-live="assertive" for errors',
      'Ensure status messages are announced without focus',
    ],
    failures: [
      'Success message not announced to screen readers',
      'Loading state not communicated',
      'Form submission result not announced',
    ],
    testProcedure: 'Test status message scenarios with screen reader. Verify announcements.',
    applicableComponents: ['Alert', 'Badge', 'TextField', 'TextArea'],
  },
};

// ============================================================================
// EXPORT ALL CRITERIA
// ============================================================================

export const getAllCriteria = (): WCAGCriterion[] => Object.values(WCAG_CRITERIA);

export const getCriteriaByLevel = (level: WCAGLevel): WCAGCriterion[] =>
  getAllCriteria().filter(c => c.level === level);

export const getCriteriaByPrinciple = (principle: WCAGPrinciple): WCAGCriterion[] =>
  getAllCriteria().filter(c => c.principle === principle);

export const getCriteriaByComponent = (component: string): WCAGCriterion[] =>
  getAllCriteria().filter(c =>
    c.applicableComponents.includes(component) ||
    c.applicableComponents.includes('All')
  );

export const getCriteriaByVersion = (version: WCAGVersion): WCAGCriterion[] =>
  getAllCriteria().filter(c => c.version === version);

// Get criteria that are new in WCAG 2.2
export const getWCAG22NewCriteria = (): WCAGCriterion[] =>
  getCriteriaByVersion('2.2');

// Get all criteria required for Level AA compliance
export const getLevelAACriteria = (): WCAGCriterion[] =>
  getAllCriteria().filter(c => c.level === 'A' || c.level === 'AA');
