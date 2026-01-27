/**
 * Component-Specific Accessibility Rules
 *
 * Defines accessibility requirements for each UI component based on:
 * - WCAG 2.2 Success Criteria
 * - ARIA Authoring Practices Guide (APG)
 * - Common accessibility patterns and best practices
 *
 * Each component has specific requirements for:
 * - ARIA roles, states, and properties
 * - Keyboard interaction patterns
 * - Screen reader behavior
 * - Common violations and how to fix them
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import { ComponentAccessibilityRule, KeyboardRequirement, Violation, AccessibilityRequirement } from './wcagKnowledgeBase';

// ============================================================================
// COMPONENT ACCESSIBILITY RULES
// ============================================================================

export const COMPONENT_ACCESSIBILITY_RULES: Record<string, ComponentAccessibilityRule> = {
  // ---------------------------------------------------------------------------
  // BUTTON
  // ---------------------------------------------------------------------------
  Button: {
    component: 'Button',
    wcagCriteria: ['1.1.1', '1.4.1', '1.4.3', '1.4.11', '2.1.1', '2.4.7', '2.5.3', '2.5.8', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    requirements: [
      {
        id: 'button-accessible-name',
        description: 'Button must have an accessible name via visible text, aria-label, or aria-labelledby',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for visible text content, aria-label, or aria-labelledby attribute',
      },
      {
        id: 'button-role',
        description: 'Use native <button> element or apply role="button" to custom elements',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify element is <button> or has role="button"',
      },
      {
        id: 'button-focusable',
        description: 'Button must be keyboard focusable',
        severity: 'critical',
        automated: true,
        testMethod: 'Tab to element and verify it receives focus',
      },
      {
        id: 'button-focus-visible',
        description: 'Button must have visible focus indicator with 3:1 contrast',
        severity: 'serious',
        automated: false,
        testMethod: 'Tab to button and verify visible focus ring',
      },
      {
        id: 'button-contrast',
        description: 'Button text must have 4.5:1 contrast ratio (3:1 for large text)',
        severity: 'serious',
        automated: true,
        testMethod: 'Use color contrast analyzer on button text',
      },
      {
        id: 'button-target-size',
        description: 'Button touch target must be at least 24x24 CSS pixels',
        severity: 'moderate',
        automated: true,
        testMethod: 'Measure button dimensions',
      },
      {
        id: 'button-disabled-state',
        description: 'Disabled button must use aria-disabled="true" and be visually distinguishable',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check for aria-disabled attribute when button is disabled',
      },
      {
        id: 'button-loading-state',
        description: 'Loading state must be communicated to screen readers via aria-busy or live region',
        severity: 'moderate',
        automated: false,
        testMethod: 'Test with screen reader during loading state',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter', action: 'Activates the button', required: true },
      { key: 'Space', action: 'Activates the button', required: true },
      { key: 'Tab', action: 'Moves focus to the button', required: true },
    ],
    screenReaderBehavior: 'Announces button label and role. Announces disabled state if applicable. Should announce "button" role.',
    commonViolations: [
      {
        id: 'button-no-name',
        description: 'Button has no accessible name',
        impact: 'critical',
        howToFix: 'Add visible text, aria-label, or aria-labelledby to the button',
        wcagCriteria: ['1.1.1', '4.1.2'],
      },
      {
        id: 'button-div-span',
        description: 'Using div or span as button without proper ARIA',
        impact: 'critical',
        howToFix: 'Use native <button> element or add role="button" and keyboard handlers',
        wcagCriteria: ['4.1.2'],
      },
      {
        id: 'button-no-focus',
        description: 'Button cannot be focused with keyboard',
        impact: 'critical',
        howToFix: 'Use native <button> or add tabindex="0" to custom element',
        wcagCriteria: ['2.1.1'],
      },
      {
        id: 'button-low-contrast',
        description: 'Button text has insufficient contrast',
        impact: 'serious',
        howToFix: 'Increase contrast between text and background to 4.5:1 minimum',
        wcagCriteria: ['1.4.3'],
      },
      {
        id: 'button-icon-only-no-label',
        description: 'Icon-only button without accessible name',
        impact: 'critical',
        howToFix: 'Add aria-label describing the button action',
        wcagCriteria: ['1.1.1', '4.1.2'],
      },
    ],
    codeExample: {
      correct: `// Correct: Native button with accessible name
<button
  type="button"
  onClick={handleClick}
  disabled={isDisabled}
  aria-disabled={isDisabled}
  className="btn-primary focus:ring-2 focus:ring-offset-2"
>
  Save Changes
</button>

// Icon button with aria-label
<button
  type="button"
  aria-label="Delete item"
  onClick={handleDelete}
  className="p-2 min-w-[24px] min-h-[24px]"
>
  <TrashIcon aria-hidden="true" />
</button>`,
      incorrect: `// Incorrect: div as button without ARIA
<div onClick={handleClick} className="btn">
  Save
</div>

// Incorrect: No accessible name for icon button
<button onClick={handleDelete}>
  <TrashIcon />
</button>

// Incorrect: Using image without alt
<button>
  <img src="icon.png" />
</button>`,
    },
  },

  // ---------------------------------------------------------------------------
  // ICON BUTTON
  // ---------------------------------------------------------------------------
  IconButton: {
    component: 'IconButton',
    wcagCriteria: ['1.1.1', '1.4.11', '2.1.1', '2.4.7', '2.5.8', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    requirements: [
      {
        id: 'iconbutton-accessible-name',
        description: 'Icon button MUST have aria-label or aria-labelledby since there is no visible text',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for aria-label or aria-labelledby attribute',
      },
      {
        id: 'iconbutton-icon-hidden',
        description: 'Decorative icon should have aria-hidden="true"',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check icon element for aria-hidden attribute',
      },
      {
        id: 'iconbutton-target-size',
        description: 'Icon button must be at least 24x24 pixels',
        severity: 'serious',
        automated: true,
        testMethod: 'Measure icon button dimensions',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter', action: 'Activates the button', required: true },
      { key: 'Space', action: 'Activates the button', required: true },
    ],
    screenReaderBehavior: 'Announces aria-label content and "button" role. Icon should not be announced.',
    commonViolations: [
      {
        id: 'iconbutton-no-label',
        description: 'Icon button has no aria-label',
        impact: 'critical',
        howToFix: 'Add aria-label describing the action (e.g., aria-label="Close dialog")',
        wcagCriteria: ['1.1.1', '4.1.2'],
      },
      {
        id: 'iconbutton-icon-announced',
        description: 'Icon is announced by screen reader',
        impact: 'minor',
        howToFix: 'Add aria-hidden="true" to the icon element',
        wcagCriteria: ['1.1.1'],
      },
      {
        id: 'iconbutton-too-small',
        description: 'Icon button is smaller than 24x24 pixels',
        impact: 'moderate',
        howToFix: 'Increase button size or add padding to meet 24x24 minimum',
        wcagCriteria: ['2.5.8'],
      },
    ],
    codeExample: {
      correct: `<button
  type="button"
  aria-label="Close dialog"
  onClick={onClose}
  className="p-2 min-w-[44px] min-h-[44px] focus:ring-2"
>
  <CloseIcon aria-hidden="true" className="w-5 h-5" />
</button>`,
      incorrect: `<button onClick={onClose} className="p-1">
  <CloseIcon />
</button>`,
    },
  },

  // ---------------------------------------------------------------------------
  // TEXT FIELD / INPUT
  // ---------------------------------------------------------------------------
  TextField: {
    component: 'TextField',
    wcagCriteria: ['1.3.1', '1.3.5', '1.4.3', '2.1.1', '2.4.6', '3.2.1', '3.2.2', '3.3.1', '3.3.2', '3.3.3', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/textbox/',
    requirements: [
      {
        id: 'textfield-label',
        description: 'Text field must have a visible label associated via for/id or aria-labelledby',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for associated label element or aria-labelledby',
      },
      {
        id: 'textfield-not-placeholder-only',
        description: 'Placeholder text must not be the only label',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify visible label exists separate from placeholder',
      },
      {
        id: 'textfield-error-state',
        description: 'Error state must use aria-invalid="true" and aria-describedby for error message',
        severity: 'serious',
        automated: true,
        testMethod: 'Check for aria-invalid and aria-describedby when in error state',
      },
      {
        id: 'textfield-required',
        description: 'Required fields must be indicated with aria-required="true" and visual indicator',
        severity: 'serious',
        automated: true,
        testMethod: 'Check for aria-required and visible required indicator',
      },
      {
        id: 'textfield-autocomplete',
        description: 'Fields collecting user information should have appropriate autocomplete attribute',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check for autocomplete attribute on user info fields',
      },
      {
        id: 'textfield-helper-text',
        description: 'Helper text should be associated with input via aria-describedby',
        severity: 'moderate',
        automated: true,
        testMethod: 'Verify aria-describedby references helper text',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus to the text field', required: true },
      { key: 'Any character', action: 'Inputs the character', required: true },
    ],
    screenReaderBehavior: 'Announces label, input type, required status, and any error messages. Should announce current value.',
    commonViolations: [
      {
        id: 'textfield-no-label',
        description: 'Text field has no associated label',
        impact: 'critical',
        howToFix: 'Add <label> with for attribute or aria-labelledby',
        wcagCriteria: ['1.3.1', '3.3.2', '4.1.2'],
      },
      {
        id: 'textfield-placeholder-as-label',
        description: 'Using placeholder as the only label',
        impact: 'serious',
        howToFix: 'Add visible label above or beside the field',
        wcagCriteria: ['3.3.2', '1.4.3'],
      },
      {
        id: 'textfield-error-not-identified',
        description: 'Error state not communicated to assistive technology',
        impact: 'serious',
        howToFix: 'Add aria-invalid="true" and aria-describedby pointing to error message',
        wcagCriteria: ['3.3.1'],
      },
      {
        id: 'textfield-error-color-only',
        description: 'Error indicated only by color change',
        impact: 'serious',
        howToFix: 'Add error icon, text message, or border change alongside color',
        wcagCriteria: ['1.4.1'],
      },
    ],
    codeExample: {
      correct: `<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email address
    <span className="text-red-500" aria-hidden="true"> *</span>
  </label>
  <input
    type="email"
    id="email"
    name="email"
    autoComplete="email"
    required
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : "email-hint"}
    className="mt-1 block w-full rounded-md border-gray-300"
  />
  <p id="email-hint" className="mt-1 text-sm text-gray-500">
    We'll never share your email.
  </p>
  {hasError && (
    <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
      Please enter a valid email address.
    </p>
  )}
</div>`,
      incorrect: `<input
  type="email"
  placeholder="Enter email"
/>

<div>
  <input type="text" className="error" />
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // TEXT AREA
  // ---------------------------------------------------------------------------
  TextArea: {
    component: 'TextArea',
    wcagCriteria: ['1.3.1', '1.4.3', '2.1.1', '2.4.6', '3.3.1', '3.3.2', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/textbox/',
    requirements: [
      {
        id: 'textarea-label',
        description: 'Textarea must have a visible label',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for associated label element',
      },
      {
        id: 'textarea-char-count',
        description: 'If character limit exists, announce remaining characters to screen readers',
        severity: 'moderate',
        automated: false,
        testMethod: 'Test character count updates with screen reader',
      },
      {
        id: 'textarea-resize',
        description: 'Textarea should allow resizing unless it would break layout',
        severity: 'minor',
        automated: true,
        testMethod: 'Check if resize is allowed via CSS',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus to the textarea', required: true },
      { key: 'Enter', action: 'Creates new line within textarea', required: true },
    ],
    screenReaderBehavior: 'Announces label, multiline nature, required status, and character count if applicable.',
    commonViolations: [
      {
        id: 'textarea-no-label',
        description: 'Textarea has no associated label',
        impact: 'critical',
        howToFix: 'Add <label> with for attribute matching textarea id',
        wcagCriteria: ['1.3.1', '3.3.2'],
      },
      {
        id: 'textarea-char-limit-not-announced',
        description: 'Character limit not announced to screen readers',
        impact: 'moderate',
        howToFix: 'Use aria-describedby for character count or live region for updates',
        wcagCriteria: ['4.1.3'],
      },
    ],
    codeExample: {
      correct: `<div>
  <label htmlFor="description" className="block text-sm font-medium">
    Description
  </label>
  <textarea
    id="description"
    name="description"
    rows={4}
    aria-describedby="desc-count"
    maxLength={500}
    className="mt-1 block w-full rounded-md"
  />
  <p id="desc-count" className="mt-1 text-sm text-gray-500" aria-live="polite">
    {charCount}/500 characters
  </p>
</div>`,
      incorrect: `<textarea placeholder="Enter description"></textarea>`,
    },
  },

  // ---------------------------------------------------------------------------
  // CHECKBOX
  // ---------------------------------------------------------------------------
  Checkbox: {
    component: 'Checkbox',
    wcagCriteria: ['1.3.1', '1.4.1', '1.4.11', '2.1.1', '2.4.7', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    requirements: [
      {
        id: 'checkbox-label',
        description: 'Checkbox must have an associated label',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for label element or aria-labelledby',
      },
      {
        id: 'checkbox-state',
        description: 'Checked state must be communicated via checked attribute or aria-checked',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify checked state is programmatically determinable',
      },
      {
        id: 'checkbox-indeterminate',
        description: 'Indeterminate state must use aria-checked="mixed"',
        severity: 'serious',
        automated: true,
        testMethod: 'Check for aria-checked="mixed" when in indeterminate state',
      },
      {
        id: 'checkbox-group',
        description: 'Related checkboxes should be grouped with fieldset/legend',
        severity: 'moderate',
        automated: false,
        testMethod: 'Verify related checkboxes are properly grouped',
      },
    ],
    keyboardInteraction: [
      { key: 'Space', action: 'Toggles the checkbox state', required: true },
      { key: 'Tab', action: 'Moves focus to the checkbox', required: true },
    ],
    screenReaderBehavior: 'Announces label, checkbox role, and checked/unchecked/mixed state.',
    commonViolations: [
      {
        id: 'checkbox-no-label',
        description: 'Checkbox has no associated label',
        impact: 'critical',
        howToFix: 'Add <label> wrapping checkbox or with for attribute',
        wcagCriteria: ['1.3.1', '4.1.2'],
      },
      {
        id: 'checkbox-custom-no-aria',
        description: 'Custom checkbox without proper ARIA attributes',
        impact: 'critical',
        howToFix: 'Add role="checkbox" and aria-checked to custom checkbox',
        wcagCriteria: ['4.1.2'],
      },
      {
        id: 'checkbox-state-visual-only',
        description: 'Checked state indicated only visually',
        impact: 'critical',
        howToFix: 'Use native checkbox or ensure aria-checked reflects visual state',
        wcagCriteria: ['4.1.2'],
      },
    ],
    codeExample: {
      correct: `// Native checkbox
<div className="flex items-center">
  <input
    type="checkbox"
    id="terms"
    name="terms"
    checked={accepted}
    onChange={handleChange}
    className="h-4 w-4 rounded border-gray-300"
  />
  <label htmlFor="terms" className="ml-2 text-sm">
    I accept the terms and conditions
  </label>
</div>

// Custom checkbox
<div
  role="checkbox"
  aria-checked={checked}
  aria-labelledby="custom-label"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  <span id="custom-label">Custom checkbox label</span>
</div>`,
      incorrect: `<div onClick={toggleCheck} className={checked ? 'checked' : ''}>
  <span className="checkbox-icon" />
  Accept terms
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // TABS
  // ---------------------------------------------------------------------------
  Tabs: {
    component: 'Tabs',
    wcagCriteria: ['1.3.1', '2.1.1', '2.1.2', '2.4.3', '2.4.7', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    requirements: [
      {
        id: 'tabs-role-tablist',
        description: 'Tab container must have role="tablist"',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for role="tablist" on tab container',
      },
      {
        id: 'tabs-role-tab',
        description: 'Each tab must have role="tab"',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for role="tab" on each tab element',
      },
      {
        id: 'tabs-role-tabpanel',
        description: 'Each tab panel must have role="tabpanel"',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for role="tabpanel" on each panel',
      },
      {
        id: 'tabs-aria-selected',
        description: 'Selected tab must have aria-selected="true"',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify active tab has aria-selected="true"',
      },
      {
        id: 'tabs-aria-controls',
        description: 'Each tab must have aria-controls pointing to its panel',
        severity: 'serious',
        automated: true,
        testMethod: 'Check aria-controls matches panel id',
      },
      {
        id: 'tabs-keyboard-nav',
        description: 'Arrow keys should move between tabs within tablist',
        severity: 'serious',
        automated: false,
        testMethod: 'Test arrow key navigation between tabs',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus into tablist, then to active panel', required: true },
      { key: 'ArrowLeft', action: 'Moves focus to previous tab (or last if at first)', required: true },
      { key: 'ArrowRight', action: 'Moves focus to next tab (or first if at last)', required: true },
      { key: 'Home', action: 'Moves focus to first tab', required: false },
      { key: 'End', action: 'Moves focus to last tab', required: false },
      { key: 'Enter/Space', action: 'Activates the focused tab (if not automatic)', required: false },
    ],
    screenReaderBehavior: 'Announces tab label, position (e.g., "tab 2 of 4"), and selected state. Panel content announced when tab is activated.',
    commonViolations: [
      {
        id: 'tabs-missing-roles',
        description: 'Missing tablist, tab, or tabpanel roles',
        impact: 'critical',
        howToFix: 'Add appropriate roles to tab container, tabs, and panels',
        wcagCriteria: ['4.1.2'],
      },
      {
        id: 'tabs-no-keyboard',
        description: 'Cannot navigate tabs with arrow keys',
        impact: 'serious',
        howToFix: 'Implement arrow key navigation within tablist',
        wcagCriteria: ['2.1.1'],
      },
      {
        id: 'tabs-no-connection',
        description: 'Tabs not connected to panels via aria-controls',
        impact: 'serious',
        howToFix: 'Add aria-controls to each tab referencing its panel id',
        wcagCriteria: ['4.1.2'],
      },
    ],
    codeExample: {
      correct: `<div>
  <div role="tablist" aria-label="Account settings">
    <button
      role="tab"
      aria-selected={activeTab === 'profile'}
      aria-controls="profile-panel"
      id="profile-tab"
      tabIndex={activeTab === 'profile' ? 0 : -1}
      onClick={() => setActiveTab('profile')}
    >
      Profile
    </button>
    <button
      role="tab"
      aria-selected={activeTab === 'security'}
      aria-controls="security-panel"
      id="security-tab"
      tabIndex={activeTab === 'security' ? 0 : -1}
      onClick={() => setActiveTab('security')}
    >
      Security
    </button>
  </div>
  <div
    role="tabpanel"
    id="profile-panel"
    aria-labelledby="profile-tab"
    hidden={activeTab !== 'profile'}
  >
    Profile content
  </div>
  <div
    role="tabpanel"
    id="security-panel"
    aria-labelledby="security-tab"
    hidden={activeTab !== 'security'}
  >
    Security content
  </div>
</div>`,
      incorrect: `<div>
  <div className="tabs">
    <div className={active === 0 ? 'active' : ''} onClick={() => setActive(0)}>
      Tab 1
    </div>
    <div className={active === 1 ? 'active' : ''} onClick={() => setActive(1)}>
      Tab 2
    </div>
  </div>
  <div className="panel">{panels[active]}</div>
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // ALERT
  // ---------------------------------------------------------------------------
  Alert: {
    component: 'Alert',
    wcagCriteria: ['1.4.1', '1.4.3', '4.1.3'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    requirements: [
      {
        id: 'alert-role',
        description: 'Alert must have role="alert" for important messages',
        severity: 'serious',
        automated: true,
        testMethod: 'Check for role="alert" on alert container',
      },
      {
        id: 'alert-not-color-only',
        description: 'Alert type (error, warning, success) must not be indicated by color alone',
        severity: 'serious',
        automated: false,
        testMethod: 'Verify icon or text indicates alert type alongside color',
      },
      {
        id: 'alert-dismissible',
        description: 'Dismissible alerts must have accessible close button',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check close button has aria-label',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus to interactive elements within alert', required: false },
      { key: 'Escape', action: 'Dismisses alert if dismissible', required: false },
    ],
    screenReaderBehavior: 'Alert content is announced immediately when it appears (live region). Type (error, warning) should be clear from text.',
    commonViolations: [
      {
        id: 'alert-no-role',
        description: 'Alert missing role="alert"',
        impact: 'serious',
        howToFix: 'Add role="alert" to alert container',
        wcagCriteria: ['4.1.3'],
      },
      {
        id: 'alert-color-only',
        description: 'Alert type indicated only by color',
        impact: 'serious',
        howToFix: 'Add icon and/or text label indicating alert type',
        wcagCriteria: ['1.4.1'],
      },
    ],
    codeExample: {
      correct: `<div role="alert" className="bg-red-100 border-red-500 text-red-700 p-4">
  <div className="flex items-center">
    <ErrorIcon aria-hidden="true" className="mr-2" />
    <strong>Error:</strong>
    <span className="ml-1">Your session has expired. Please log in again.</span>
  </div>
  <button
    aria-label="Dismiss alert"
    onClick={onDismiss}
    className="ml-auto"
  >
    <CloseIcon aria-hidden="true" />
  </button>
</div>`,
      incorrect: `<div className="alert-error">
  Something went wrong.
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // NAV ITEM
  // ---------------------------------------------------------------------------
  NavItem: {
    component: 'NavItem',
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.1', '2.4.3', '2.4.4', '2.4.7', '3.2.3', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/',
    requirements: [
      {
        id: 'navitem-in-nav',
        description: 'Navigation items should be within <nav> element',
        severity: 'moderate',
        automated: true,
        testMethod: 'Verify nav items are descendants of <nav>',
      },
      {
        id: 'navitem-current',
        description: 'Current page must be indicated with aria-current="page"',
        severity: 'serious',
        automated: true,
        testMethod: 'Check active nav item has aria-current="page"',
      },
      {
        id: 'navitem-descriptive',
        description: 'Link text must clearly describe destination',
        severity: 'serious',
        automated: false,
        testMethod: 'Review link text for descriptiveness',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus between navigation items', required: true },
      { key: 'Enter', action: 'Activates the link', required: true },
    ],
    screenReaderBehavior: 'Announces link text, current page status, and navigation landmark.',
    commonViolations: [
      {
        id: 'navitem-no-current',
        description: 'Current page not indicated to screen readers',
        impact: 'serious',
        howToFix: 'Add aria-current="page" to the active navigation item',
        wcagCriteria: ['1.3.1', '4.1.2'],
      },
      {
        id: 'navitem-no-nav-landmark',
        description: 'Navigation not in <nav> element',
        impact: 'moderate',
        howToFix: 'Wrap navigation in <nav> element',
        wcagCriteria: ['1.3.1'],
      },
    ],
    codeExample: {
      correct: `<nav aria-label="Main navigation">
  <ul>
    <li>
      <a href="/" aria-current={isHomePage ? 'page' : undefined}>
        Home
      </a>
    </li>
    <li>
      <a href="/about" aria-current={isAboutPage ? 'page' : undefined}>
        About
      </a>
    </li>
  </ul>
</nav>`,
      incorrect: `<div className="nav">
  <div className="nav-item active" onClick={goHome}>Home</div>
  <div className="nav-item" onClick={goAbout}>About</div>
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // SEARCH INPUT
  // ---------------------------------------------------------------------------
  SearchInput: {
    component: 'SearchInput',
    wcagCriteria: ['1.3.1', '1.3.5', '2.1.1', '3.2.1', '3.3.2', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    requirements: [
      {
        id: 'search-role',
        description: 'Search container should have role="search"',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check for role="search" on container',
      },
      {
        id: 'search-label',
        description: 'Search input must have accessible label',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for aria-label or associated label',
      },
      {
        id: 'search-submit',
        description: 'Search should have explicit submit button or Enter key submission',
        severity: 'moderate',
        automated: false,
        testMethod: 'Verify search can be submitted',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter', action: 'Submits the search', required: true },
      { key: 'Escape', action: 'Clears search field or closes suggestions', required: false },
    ],
    screenReaderBehavior: 'Announces search role, label, and any autocomplete suggestions.',
    commonViolations: [
      {
        id: 'search-no-label',
        description: 'Search input has no accessible label',
        impact: 'critical',
        howToFix: 'Add aria-label="Search" to the input',
        wcagCriteria: ['1.3.1', '3.3.2'],
      },
    ],
    codeExample: {
      correct: `<form role="search">
  <label htmlFor="search" className="sr-only">Search</label>
  <input
    type="search"
    id="search"
    name="search"
    placeholder="Search..."
    autoComplete="off"
    className="pl-10"
  />
  <button type="submit" aria-label="Submit search">
    <SearchIcon aria-hidden="true" />
  </button>
</form>`,
      incorrect: `<input type="text" placeholder="Search..." />`,
    },
  },

  // ---------------------------------------------------------------------------
  // ACCORDION
  // ---------------------------------------------------------------------------
  Accordion: {
    component: 'Accordion',
    wcagCriteria: ['1.3.1', '2.1.1', '2.4.3', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    requirements: [
      {
        id: 'accordion-button',
        description: 'Accordion headers must be buttons or have role="button"',
        severity: 'critical',
        automated: true,
        testMethod: 'Check header elements are buttons',
      },
      {
        id: 'accordion-expanded',
        description: 'Use aria-expanded to indicate open/closed state',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify aria-expanded changes with state',
      },
      {
        id: 'accordion-controls',
        description: 'Button should have aria-controls pointing to panel',
        severity: 'serious',
        automated: true,
        testMethod: 'Check aria-controls references panel id',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter/Space', action: 'Toggles accordion panel', required: true },
      { key: 'Tab', action: 'Moves focus between accordion headers', required: true },
    ],
    screenReaderBehavior: 'Announces header text, expanded/collapsed state, and panel content when expanded.',
    commonViolations: [
      {
        id: 'accordion-no-state',
        description: 'Expanded state not communicated',
        impact: 'critical',
        howToFix: 'Add aria-expanded="true/false" to accordion buttons',
        wcagCriteria: ['4.1.2'],
      },
      {
        id: 'accordion-div-header',
        description: 'Accordion header is not a button',
        impact: 'critical',
        howToFix: 'Use <button> for accordion headers or add role="button"',
        wcagCriteria: ['2.1.1', '4.1.2'],
      },
    ],
    codeExample: {
      correct: `<div className="accordion">
  <h3>
    <button
      aria-expanded={isOpen}
      aria-controls="panel-1"
      onClick={toggle}
      className="w-full text-left"
    >
      Section 1
      <ChevronIcon aria-hidden="true" className={isOpen ? 'rotate-180' : ''} />
    </button>
  </h3>
  <div id="panel-1" hidden={!isOpen}>
    Panel content...
  </div>
</div>`,
      incorrect: `<div className="accordion">
  <div className="header" onClick={toggle}>
    Section 1
  </div>
  <div className={isOpen ? 'open' : 'closed'}>
    Content
  </div>
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // BADGE
  // ---------------------------------------------------------------------------
  Badge: {
    component: 'Badge',
    wcagCriteria: ['1.1.1', '1.4.1', '1.4.3', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/badge/',
    requirements: [
      {
        id: 'badge-accessible-name',
        description: 'Badge content must be accessible to screen readers',
        severity: 'serious',
        automated: true,
        testMethod: 'Verify badge text is not hidden from screen readers',
      },
      {
        id: 'badge-context',
        description: 'Badge meaning should be clear from context or label',
        severity: 'moderate',
        automated: false,
        testMethod: 'Verify badge purpose is clear to screen reader users',
      },
      {
        id: 'badge-not-color-only',
        description: 'Badge type should not rely on color alone',
        severity: 'serious',
        automated: false,
        testMethod: 'Verify badge type is clear without color',
      },
    ],
    keyboardInteraction: [],
    screenReaderBehavior: 'Badge content should be announced in context with its associated element.',
    commonViolations: [
      {
        id: 'badge-no-context',
        description: 'Badge has no accessible context',
        impact: 'serious',
        howToFix: 'Use aria-describedby to associate badge with its context, or include context in aria-label',
        wcagCriteria: ['1.1.1'],
      },
    ],
    codeExample: {
      correct: `// Badge with context
<button aria-describedby="notification-badge">
  Notifications
  <span id="notification-badge" className="badge">
    <span className="sr-only">You have</span>
    5
    <span className="sr-only">unread notifications</span>
  </span>
</button>

// Status badge
<span className="badge badge-success">
  <CheckIcon aria-hidden="true" />
  <span>Verified</span>
</span>`,
      incorrect: `<span className="badge red">3</span>`,
    },
  },

  // ---------------------------------------------------------------------------
  // CHIP
  // ---------------------------------------------------------------------------
  Chip: {
    component: 'Chip',
    wcagCriteria: ['1.1.1', '2.1.1', '2.4.7', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    requirements: [
      {
        id: 'chip-label',
        description: 'Chip must have accessible text label',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for visible text or aria-label',
      },
      {
        id: 'chip-delete-button',
        description: 'Deletable chip must have accessible delete button',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify delete button has aria-label',
      },
      {
        id: 'chip-keyboard',
        description: 'Interactive chips must be keyboard accessible',
        severity: 'critical',
        automated: false,
        testMethod: 'Test keyboard interaction for clickable/deletable chips',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter/Space', action: 'Activates clickable chip or deletes deletable chip', required: true },
      { key: 'Delete/Backspace', action: 'Deletes deletable chip (optional)', required: false },
    ],
    screenReaderBehavior: 'Announces chip label and delete capability if present.',
    commonViolations: [
      {
        id: 'chip-delete-no-label',
        description: 'Delete button has no accessible name',
        impact: 'critical',
        howToFix: 'Add aria-label="Remove [chip label]" to delete button',
        wcagCriteria: ['1.1.1', '4.1.2'],
      },
    ],
    codeExample: {
      correct: `<div className="chip" role="group" aria-label="Selected filter: JavaScript">
  <span>JavaScript</span>
  <button
    aria-label="Remove JavaScript filter"
    onClick={onDelete}
  >
    <CloseIcon aria-hidden="true" />
  </button>
</div>`,
      incorrect: `<div className="chip">
  JavaScript
  <span onClick={onDelete}>×</span>
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // AVATAR
  // ---------------------------------------------------------------------------
  Avatar: {
    component: 'Avatar',
    wcagCriteria: ['1.1.1', '1.4.3'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/img/',
    requirements: [
      {
        id: 'avatar-alt',
        description: 'Avatar images must have appropriate alt text',
        severity: 'serious',
        automated: true,
        testMethod: 'Check img for alt attribute',
      },
      {
        id: 'avatar-decorative',
        description: 'Decorative avatars should have empty alt or be aria-hidden',
        severity: 'moderate',
        automated: false,
        testMethod: 'Determine if avatar is decorative and hidden appropriately',
      },
    ],
    keyboardInteraction: [],
    screenReaderBehavior: 'Announces alt text for informative avatars. Decorative avatars are skipped.',
    commonViolations: [
      {
        id: 'avatar-no-alt',
        description: 'Avatar image missing alt text',
        impact: 'serious',
        howToFix: 'Add alt attribute with person\'s name or role, or alt="" if decorative',
        wcagCriteria: ['1.1.1'],
      },
    ],
    codeExample: {
      correct: `// Informative avatar
<img
  src={user.avatar}
  alt={\`\${user.name}'s profile photo\`}
  className="avatar"
/>

// Decorative avatar with name nearby
<div className="user-card">
  <img src={user.avatar} alt="" className="avatar" />
  <span>{user.name}</span>
</div>

// Initials avatar
<div className="avatar" role="img" aria-label="John Doe">
  JD
</div>`,
      incorrect: `<img src={user.avatar} className="avatar" />

<div className="avatar">JD</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // BREADCRUMB
  // ---------------------------------------------------------------------------
  Breadcrumb: {
    component: 'Breadcrumb',
    wcagCriteria: ['1.3.1', '2.4.4', '2.4.8', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    requirements: [
      {
        id: 'breadcrumb-nav',
        description: 'Breadcrumb should be in <nav> with aria-label="Breadcrumb"',
        severity: 'moderate',
        automated: true,
        testMethod: 'Check for nav element with aria-label',
      },
      {
        id: 'breadcrumb-current',
        description: 'Current page should have aria-current="page"',
        severity: 'serious',
        automated: true,
        testMethod: 'Verify last item has aria-current="page"',
      },
      {
        id: 'breadcrumb-separator',
        description: 'Visual separators should be hidden from screen readers',
        severity: 'minor',
        automated: true,
        testMethod: 'Check separators have aria-hidden="true"',
      },
    ],
    keyboardInteraction: [
      { key: 'Tab', action: 'Moves focus between breadcrumb links', required: true },
    ],
    screenReaderBehavior: 'Announces breadcrumb navigation, each link, and current page indicator.',
    commonViolations: [
      {
        id: 'breadcrumb-no-label',
        description: 'Breadcrumb navigation has no aria-label',
        impact: 'moderate',
        howToFix: 'Add aria-label="Breadcrumb" to nav element',
        wcagCriteria: ['1.3.1'],
      },
      {
        id: 'breadcrumb-separator-announced',
        description: 'Separator characters announced by screen reader',
        impact: 'minor',
        howToFix: 'Add aria-hidden="true" to separator elements',
        wcagCriteria: ['1.3.1'],
      },
    ],
    codeExample: {
      correct: `<nav aria-label="Breadcrumb">
  <ol className="flex items-center">
    <li>
      <a href="/">Home</a>
      <span aria-hidden="true" className="mx-2">/</span>
    </li>
    <li>
      <a href="/products">Products</a>
      <span aria-hidden="true" className="mx-2">/</span>
    </li>
    <li>
      <a href="/products/shoes" aria-current="page">Shoes</a>
    </li>
  </ol>
</nav>`,
      incorrect: `<div className="breadcrumb">
  <a href="/">Home</a> / <a href="/products">Products</a> / Shoes
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // PROGRESS LINEAR
  // ---------------------------------------------------------------------------
  ProgressLinear: {
    component: 'ProgressLinear',
    wcagCriteria: ['1.3.1', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/meter/',
    requirements: [
      {
        id: 'progress-role',
        description: 'Progress bar must have role="progressbar"',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for role="progressbar"',
      },
      {
        id: 'progress-values',
        description: 'Must have aria-valuenow, aria-valuemin, aria-valuemax',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify all aria-value attributes present',
      },
      {
        id: 'progress-label',
        description: 'Progress bar should have accessible label',
        severity: 'serious',
        automated: true,
        testMethod: 'Check for aria-label or aria-labelledby',
      },
    ],
    keyboardInteraction: [],
    screenReaderBehavior: 'Announces progress label and current percentage. Updates should use aria-live for dynamic changes.',
    commonViolations: [
      {
        id: 'progress-no-values',
        description: 'Progress bar missing value attributes',
        impact: 'critical',
        howToFix: 'Add aria-valuenow, aria-valuemin, aria-valuemax',
        wcagCriteria: ['4.1.2'],
      },
      {
        id: 'progress-no-label',
        description: 'Progress bar has no accessible label',
        impact: 'serious',
        howToFix: 'Add aria-label describing what is loading/progressing',
        wcagCriteria: ['1.3.1'],
      },
    ],
    codeExample: {
      correct: `<div
  role="progressbar"
  aria-label="File upload progress"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  className="progress-bar"
>
  <div
    className="progress-fill"
    style={{ width: \`\${progress}%\` }}
  />
  <span className="sr-only">{progress}% complete</span>
</div>`,
      incorrect: `<div className="progress">
  <div style={{ width: '50%' }} />
</div>`,
    },
  },

  // ---------------------------------------------------------------------------
  // DROPDOWN / SELECT
  // ---------------------------------------------------------------------------
  Dropdown: {
    component: 'Dropdown',
    wcagCriteria: ['1.3.1', '2.1.1', '2.1.2', '2.4.3', '4.1.2'],
    ariaPattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    requirements: [
      {
        id: 'dropdown-label',
        description: 'Dropdown must have associated label',
        severity: 'critical',
        automated: true,
        testMethod: 'Check for label or aria-labelledby',
      },
      {
        id: 'dropdown-expanded',
        description: 'Trigger must have aria-expanded state',
        severity: 'critical',
        automated: true,
        testMethod: 'Verify aria-expanded changes when opened/closed',
      },
      {
        id: 'dropdown-focus-trap',
        description: 'Focus must be trapped within open dropdown',
        severity: 'serious',
        automated: false,
        testMethod: 'Tab through open dropdown to verify focus containment',
      },
    ],
    keyboardInteraction: [
      { key: 'Enter/Space', action: 'Opens dropdown, selects focused option', required: true },
      { key: 'ArrowDown', action: 'Opens dropdown (from trigger), moves to next option', required: true },
      { key: 'ArrowUp', action: 'Moves to previous option', required: true },
      { key: 'Escape', action: 'Closes dropdown', required: true },
      { key: 'Home', action: 'Moves to first option', required: false },
      { key: 'End', action: 'Moves to last option', required: false },
    ],
    screenReaderBehavior: 'Announces label, expanded state, selected option, and option count.',
    commonViolations: [
      {
        id: 'dropdown-keyboard-trap',
        description: 'Cannot escape dropdown with keyboard',
        impact: 'critical',
        howToFix: 'Implement Escape key to close dropdown',
        wcagCriteria: ['2.1.2'],
      },
      {
        id: 'dropdown-no-state',
        description: 'Expanded state not communicated',
        impact: 'critical',
        howToFix: 'Add aria-expanded to dropdown trigger',
        wcagCriteria: ['4.1.2'],
      },
    ],
    codeExample: {
      correct: `<div className="dropdown">
  <label id="country-label">Country</label>
  <button
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-labelledby="country-label"
    onClick={toggle}
  >
    {selected || 'Select country'}
  </button>
  {isOpen && (
    <ul role="listbox" aria-labelledby="country-label">
      {countries.map(country => (
        <li
          key={country}
          role="option"
          aria-selected={selected === country}
          onClick={() => select(country)}
        >
          {country}
        </li>
      ))}
    </ul>
  )}
</div>`,
      incorrect: `<div className="dropdown">
  <div onClick={toggle}>{selected}</div>
  <div className={isOpen ? 'open' : 'closed'}>
    {options.map(opt => (
      <div onClick={() => select(opt)}>{opt}</div>
    ))}
  </div>
</div>`,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get accessibility rules for a specific component
 */
export const getComponentRules = (componentName: string): ComponentAccessibilityRule | undefined => {
  return COMPONENT_ACCESSIBILITY_RULES[componentName];
};

/**
 * Get all components that a WCAG criterion applies to
 */
export const getComponentsForCriterion = (criterionId: string): string[] => {
  return Object.entries(COMPONENT_ACCESSIBILITY_RULES)
    .filter(([_, rule]) => rule.wcagCriteria.includes(criterionId))
    .map(([name]) => name);
};

/**
 * Get all violations across all components
 */
export const getAllViolations = (): Violation[] => {
  return Object.values(COMPONENT_ACCESSIBILITY_RULES)
    .flatMap(rule => rule.commonViolations);
};

/**
 * Get violations by severity
 */
export const getViolationsBySeverity = (severity: Violation['impact']): Violation[] => {
  return getAllViolations().filter(v => v.impact === severity);
};

/**
 * Get all keyboard requirements for a component
 */
export const getKeyboardRequirements = (componentName: string): KeyboardRequirement[] => {
  const rules = getComponentRules(componentName);
  return rules?.keyboardInteraction || [];
};

/**
 * Get code examples for a component
 */
export const getCodeExamples = (componentName: string): { correct: string; incorrect: string } | undefined => {
  const rules = getComponentRules(componentName);
  return rules?.codeExample;
};

// ============================================================================
// EXPORT ALL RULES
// ============================================================================

export const getAllComponentRules = (): ComponentAccessibilityRule[] =>
  Object.values(COMPONENT_ACCESSIBILITY_RULES);

export const getComponentNames = (): string[] =>
  Object.keys(COMPONENT_ACCESSIBILITY_RULES);
