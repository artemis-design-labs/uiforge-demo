# Artemis Modular Design System - Component Library Analysis

> **Document Version:** 1.0
> **Date:** March 12, 2026
> **Source:** Figma Design System Analysis + Mobbin UI Reference Audit

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Complete Component Inventory](#complete-component-inventory)
   - [Atoms](#atoms-23-components)
   - [Molecules](#molecules-9-ready--37-in-progress)
   - [Organisms](#organisms-5-components)
3. [Gap Analysis: Real-World UI Audit](#gap-analysis-real-world-ui-audit)
4. [New Components to Create](#new-components-to-create)
5. [Component Composition Strategy](#component-composition-strategy)
6. [Implementation Priorities](#implementation-priorities)

---

## Design System Overview

The **Artemis Modular Design System** follows the **Atomic Design** methodology with MUI (Material-UI) as the underlying framework reference.

### Architecture

```
Foundation
├── Grid System (Layout)
├── Design Tokens
│   ├── Color
│   ├── Elevation
│   ├── Spacing
│   └── Typography
└── Assets
    ├── Illustrations & Images
    └── Logo

Components
├── Atoms (Basic building blocks)
├── Molecules (Combinations of atoms)
├── Organisms (Complex UI patterns)
└── Templates (Page-level layouts)
```

### Global Features

| Feature | Description |
|---------|-------------|
| **Theme Support** | All components support Light Mode and Dark Mode |
| **Design Tokens** | Systematic Color, Elevation, Spacing, Typography tokens |
| **Grid System** | Responsive layout system |
| **Typography** | Roboto font family with systematic sizing (XXXS to XL) |
| **Color Palette** | 6-color semantic system (Primary, Secondary, Error, Warning, Info, Success) |

---

## Complete Component Inventory

### Atoms (23 Components)

#### 1. Alert
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Severity | Error, Warning, Info, Success |
| Style | Filled, Outlined, Standard |
| Variant | With title/description, With close action |

**Scope:** Notification banners for user feedback
**Limitations:** Static positioning; use Snackbar for temporary notifications
**MUI Reference:** [mui.com/api/alert](https://mui.com/api/alert)

---

#### 2. Avatar
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Size | Small, Medium, Large |
| Type | Image, Letter, Icon |
| Group | Single, Group (stacked) |

**Scope:** User/entity representation
**Limitations:** Max 4-5 avatars in group before overflow indicator

---

#### 3. Backdrop
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Opacity | Standard overlay |

**Scope:** Modal/dialog background overlay
**Limitations:** Full-screen coverage only

---

#### 4. Badge
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Dot, Number |
| Position | Top-right (default) |

**Scope:** Notification indicators on icons/avatars
**Limitations:** Single position; max 99+ display

---

#### 5. Button
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Contained, Outlined, Text |
| Color | Primary, Secondary, Error, Warning, Info, Success |
| Size | Small, Medium, Large |
| State | Enabled, Hovered, Focused, Pressed, Disabled |
| Icons | None, Leading, Trailing, Both |

**Scope:** Primary user actions
**Limitations:** Text should be concise (1-3 words ideal)
**MUI Reference:** [mui.com/api/button](https://mui.com/api/button)

---

#### 6. Checkbox
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| State | Unchecked, Checked, Indeterminate |
| Disabled | True, False |
| Label | With label, Without label |

**Scope:** Multi-select options
**Limitations:** Use Radio for single-select scenarios
**MUI Reference:** [mui.com/api/checkbox](https://mui.com/api/checkbox)

---

#### 7. Chip
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Filled, Outlined |
| Color | Primary, Secondary, Error, Warning, Info, Success, Default |
| Size | Small, Medium |
| Deletable | True, False |
| Icon | Leading icon, Avatar |
| State | Enabled, Selected, Disabled |

**Scope:** Tags, filters, selections
**Limitations:** Single-line text only

---

#### 8. Divider
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Orientation | Horizontal, Vertical |

**Scope:** Visual separation of content
**Limitations:** Pure visual element

---

#### 9. Floating Action Button (FAB)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Size | Small, Medium, Large |
| Variant | Regular, Extended (with text) |

**Scope:** Primary promoted action
**Limitations:** One per screen; fixed position

---

#### 10. Icon
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Size | Small (16px), Medium (24px), Large |
| Elevated | True, False |

**Icon Library (80+ icons):**
- Navigation: Arrows, Accordion icons, Close, Hamburger
- Actions: Add, Edit, Delete, Save, Refresh, Search
- Status: Check, Error, Warning, Info, Success
- Objects: Calendar, Clock, Folder, File, Cloud
- Users: Person, People, Account

**Scope:** Visual indicators and actions
**Limitations:** Monochrome; use with labels for accessibility
**MUI Reference:** [mui.com/api/icon](https://mui.com/api/icon)

---

#### 11. Link
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| State | Default, Hover, Visited, Disabled |
| Underline | Always, Hover, None |

**Scope:** Navigation and inline references
**Limitations:** Use Button for primary actions

---

#### 12. Metadata
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Layout | Various key-value displays |

**Scope:** Secondary information display
**Limitations:** Read-only content

---

#### 13. Progress
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Type | Linear, Circular (Donut) |
| Color | Primary, Secondary, Error, Warning, Info, Success |
| Determinate | True (with percentage), False (indeterminate) |

**Scope:** Loading states, completion indicators
**Limitations:** Circular limited to small sizes

---

#### 14. Radio Button
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Color | Primary, Secondary, Error, Warning, Info, Success |
| State | Unchecked, Checked |
| Disabled | True, False |
| Label | With label, Without label |
| Group | Single, Radio Group (vertical/horizontal) |

**Scope:** Single-select from mutually exclusive options
**Limitations:** Use Checkbox for multi-select

---

#### 15. Scrollbar
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Orientation | Horizontal, Vertical |

**Scope:** Custom styled scrollbars
**Limitations:** Browser-dependent rendering

---

#### 16. Search
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Shape | Circular (pill) |
| State | Empty, With text |
| Actions | Clear button |

**Scope:** Search input fields
**Limitations:** Use within designated search areas

---

#### 17. Slider
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Orientation | Horizontal, Vertical |
| Type | Continuous, Discrete (with marks) |
| Range | Single value, Range (two thumbs) |
| Label | With value tooltip, Without |

**Scope:** Value selection within range
**Limitations:** Touch targets need adequate size

---

#### 18. Snackbar
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Action | With action button, Without |
| Duration | Timed auto-dismiss |

**Scope:** Brief notifications
**Limitations:** One at a time; brief messages only

---

#### 19. Switch
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Color | Primary, Secondary, Error, Warning, Info, Success |
| State | Off, On |
| Disabled | True, False |
| Label | With label, Without label |
| Size | Small, Medium |

**Scope:** Binary on/off settings
**Limitations:** Use Checkbox for non-settings contexts

---

#### 20. Text Area
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Standard, Filled, Outlined |
| State | Enabled, Focused, Hovered, Error, Disabled |
| Helper Text | With helper, Without |
| Character Count | With counter, Without |

**Scope:** Multi-line text input
**Limitations:** Fixed or auto-expand height
**MUI Reference:** [mui.com/components/text-fields](https://mui.com/components/text-fields)

---

#### 21. Text Field
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Standard, Filled, Outlined |
| State | Enabled, Focused, Hovered, Error, Disabled |
| Type | Text, Password, Number, etc. |
| Adornments | Leading icon, Trailing icon, Both |
| Helper Text | With helper, Error message |
| Autocomplete | With dropdown suggestions |

**Scope:** Single-line text input
**Limitations:** Use Text Area for multi-line

---

#### 22. Tooltip
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Position | Top, Bottom, Left, Right |
| Arrow | With arrow, Without |

**Scope:** Contextual help on hover
**Limitations:** Brief text only; no interactive content

---

#### 23. Icons Library
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Types | 80+ icon types |

**Categories:** Navigation, Actions, Status, Objects, Users, Formatting

---

### Molecules (9 Ready + 37 In Progress)

#### Ready Components

##### 1. Accordion
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Expanded | True, False |
| Disabled | True, False |
| Position | First-of-type, Middle, Last-of-type |
| Variant | Default, Text variant |

**Scope:** Collapsible content sections
**Limitations:** Sequential disclosure; avoid deep nesting

---

##### 2. Bottom Navigation
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Items | 3-5 navigation items |
| State | Active, Inactive |
| Labels | With labels, Icons only |

**Scope:** Mobile primary navigation
**Limitations:** Mobile only; max 5 items

---

##### 3. Breadcrumb
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Separator | Arrow, Slash, Custom |
| Collapsed | Auto-collapse for long paths |

**Scope:** Navigation hierarchy
**Limitations:** Linear path only

---

##### 4. Dropdown
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Standard, Outlined, Filled |
| State | Closed, Open |
| Menu Features | Simple list, With icons, With avatars, With search, With checkboxes, Nested submenus |
| Selection | Single, Multi-select |

**Scope:** Selection from list of options
**Limitations:** Avoid more than ~10 visible items without search

---

##### 5. Pagination
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Size | Small, Medium, Large |
| Variant | Text, Outlined, Contained |
| Boundary/Sibling Count | Configurable visible pages |

**Scope:** Navigate paginated content
**Limitations:** Use infinite scroll for feeds

---

##### 6. Tab Navigation
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Variant | Standard, Scrollable |
| Indicator | Bottom line |
| State | Active, Inactive, Disabled |

**Scope:** Content organization within a view
**Limitations:** Avoid too many tabs; use scrollable variant

---

##### 7. Timeline
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Orientation | Vertical |
| Alignment | Left, Right, Alternating |
| Connector | Line, Custom |

**Scope:** Chronological event display
**Limitations:** Vertical layout only

---

##### 8. Stepper
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Orientation | Horizontal, Vertical |
| Variant | Text, Icon, Number |
| State | Completed, Active, Inactive, Error |
| Type | Linear, Non-linear |

**Scope:** Multi-step processes
**Limitations:** Avoid more than 5-7 steps

---

##### 9. Tree View
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Selection | Single, Multi-select |
| Expanded | Controlled, Uncontrolled |
| Icons | Folder/File, Custom |

**Scope:** Hierarchical data display
**Limitations:** Avoid deep nesting (>4 levels)

---

#### In Progress Components (37)

AI/ML Interface Patterns:
- Auto Fill, Follow up, Inline action, Madlibs, Open input
- Remix/Blend, Summary, Synthesis, Token layering
- Filters, Inpainting, Model management, Parameters
- Personal voice, Primary sources, References, Workflows
- Citations, Controls, Footprints, Prompt transparency
- Regenerate, Sample response, Show the work, Token transparency
- Variations, Incognito mode, Memory, Watermarks
- Data ownership, Rating, Caveat, Color Scheme
- Disclosure, Initial CTA, Name, Personality, Symbols
- Nudges, Suggestions, Templates

---

### Organisms (5 Components)

#### 1. Card (Ready)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Type | Standard, Subtask |
| Elevation | Flat, Raised |
| Content | Header, Body, Media, Actions, Chips, Avatar group |
| Priority | High, Medium, Low, Not set |

**Scope:** Grouped information container
**Limitations:** Avoid overloading with content

---

#### 2. Date and Time Pickers (In Progress)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Type | Date only, Time only, Date and Time |
| View | Calendar, Year, Month |
| Variant | Desktop, Mobile, Native |
| Clock | Digital, Analog |

**Scope:** Date/time selection
**Limitations:** Complex component; follow platform conventions

---

#### 3. Dialog Box (In Progress)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Type | Alert, Form, Confirmation |
| Size | Small, Medium, Large, Full-screen |
| Actions | Single button, Two buttons, Custom |

**Examples:** Login, Register, Create Issue, Invite Members, Integrations, Save Dialog

**Scope:** Modal interactions
**Limitations:** Avoid nested dialogs

---

#### 4. Drawer (In Progress)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Position | Left, Right |
| Variant | Temporary, Persistent, Permanent |
| Content | Navigation items, Search, Subheaders, Dividers, Footer |
| Dense | True, False |
| State | Expanded, Collapsed |

**Scope:** Side navigation and secondary content
**Limitations:** Responsive behavior needed

---

#### 5. Table (In Progress)
| Property | Values |
|----------|--------|
| Mode | Light, Dark |
| Size | Small, Medium, Large |
| Features | Sortable, Selectable, Expandable rows |
| Density | Comfortable, Compact |
| Fixed | Fixed header, Sticky columns |

**Scope:** Tabular data display
**Limitations:** Consider virtualization for large datasets

---

### Component Summary

| Level | Ready | In Progress | Total |
|-------|-------|-------------|-------|
| **Atoms** | 23 | 0 | 23 |
| **Molecules** | 9 | 37 | 46 |
| **Organisms** | 1 | 4 | 5 |
| **Total** | **33** | **41** | **74** |

---

## Gap Analysis: Real-World UI Audit

An analysis was conducted comparing the Artemis Modular Design System against 8 production interface screenshots from Mobbin:

1. **Vanta Web 54** - Compliance dashboard
2. **GitHub Android 7** - Mobile home screen
3. **Stripe Dashboard iOS 41** - Mobile dashboard (2 variants)
4. **Stripe Web 212** - Fraud & risk dashboard
5. **Retool Web 28** - App builder interface
6. **Linear iOS 17** - Mobile home screen
7. **Linear Web 279** - Issue list view

### Coverage Analysis

| Screen | Components Matched | Coverage |
|--------|-------------------|----------|
| Vanta Web 54 | Drawer, Search, Divider, Icon, Link, Progress, Button, Dropdown, Tooltip | ~70% |
| GitHub Android 7 | Bottom Navigation, Icon, Avatar, Divider | ~40% |
| Stripe iOS 41 | Bottom Navigation, Icon, Divider, Tab Navigation | ~50% |
| Stripe Web 212 | Tab Navigation, Alert, Search, Dropdown, Button, Avatar, Icon, Link, Divider, Badge, Switch | ~75% |
| Retool Web 28 | Tab Navigation, Search, Button, Dropdown, Table, Icon, Badge, Divider, Text Field | ~65% |
| Linear iOS 17 | Bottom Navigation, Icon | ~30% |
| Linear Web 279 | Drawer, Tree View, Button, Search, Checkbox, Avatar, Icon, Badge, Divider, Tooltip | ~60% |

**Overall Coverage:** ~60% of UI patterns in production apps

### Key Gaps Identified

#### Components Needing Additional Variants

| Component | Missing Variant | Seen In |
|-----------|-----------------|---------|
| Badge | Text variant ("New", "Try free") | Vanta |
| Tab Navigation | Pill/chip style tabs | Stripe iOS |
| Button | Split button (with dropdown) | Stripe Web |
| Avatar | Square/rounded-square shape | GitHub |
| Icon | Colored backgrounds | GitHub |
| Chip | With leading icon | Linear Web |
| Progress Circular | XSmall size (12-16px) | Linear Web |
| Checkbox | Circular shape | Linear Web |
| Card | Metric/Stats/Picker types | Vanta, Stripe, Retool |
| Progress Linear | Segmented type | Vanta |

---

## New Components to Create

### Components Required from Scratch

These components don't exist in any form in the current system:

#### 1. List

A foundational component entirely missing from Modular.

| Sub-component | Description |
|---------------|-------------|
| List Container | Wrapper with optional dividers, padding options |
| List Item (Single-line) | Icon/Avatar + Primary text |
| List Item (Two-line) | Icon/Avatar + Primary text + Secondary text |
| List Item (Three-line) | Icon/Avatar + Primary text + Secondary text + Tertiary |
| List Subheader | Section label within a list |
| List Item Action | Trailing action (checkbox, switch, icon button, overflow menu) |

**Used in:** GitHub Android, Linear iOS, Linear Web, Vanta, Stripe Web, Retool Web (6/8 screens)

---

#### 2. Chart

No data visualization components exist in Modular.

| Sub-component | Description |
|---------------|-------------|
| Bar Chart | Vertical/horizontal, stacked/grouped |
| Line Chart | Single/multi-line, with area fill option |
| Donut/Pie Chart | With center label option |
| Chart Legend | Horizontal/vertical legend with color indicators |
| Chart Tooltip | Hover state data display |
| Chart Axis | X/Y axis with labels, gridlines |
| Chart Empty State | No data available placeholder |

**Used in:** Stripe Web, Stripe iOS

---

#### 3. Code Editor / Code Block

Specialized component for code display and editing.

| Sub-component | Description |
|---------------|-------------|
| Code Block (Read-only) | Syntax highlighted code display |
| Code Editor (Editable) | With line numbers, syntax highlighting |
| Language Selector | Dropdown for language/mode |

**Used in:** Retool Web

---

#### 4. Empty State

Pattern component for no-data scenarios.

| Sub-component | Description |
|---------------|-------------|
| Empty State Container | Centered layout |
| Empty State Illustration | Optional graphic/icon |
| Empty State Title | Primary message |
| Empty State Description | Secondary explanatory text |
| Empty State Action | CTA button(s) |

**Used in:** Stripe iOS, Stripe Web

---

#### 5. Split View / Resizable Panels

Layout component for adjustable panel interfaces.

| Sub-component | Description |
|---------------|-------------|
| Split Container | Horizontal or vertical split |
| Panel | Individual resizable panel |
| Resize Handle | Draggable divider between panels |

**Used in:** Retool Web

---

#### 6. Keyboard Shortcut (Kbd)

Inline display of keyboard shortcuts.

| Sub-component | Description |
|---------------|-------------|
| Key | Single key display (⌘, K, Ctrl) |
| Key Combination | Multiple keys (⌘+K, Ctrl+Shift+P) |

**Used in:** Vanta Web

---

## Component Composition Strategy

### List Component: Building from Existing Atoms

The List component can be composed using existing atoms from the design system:

#### Atoms Available for Composition

| Atom | Use in List | Purpose |
|------|-------------|---------|
| **Avatar** | Leading visual | User/entity representation |
| **Icon** | Leading visual | Category/action indicator |
| **Checkbox** | Selection control | Multi-select lists |
| **Radio Button** | Selection control | Single-select lists |
| **Switch** | Trailing action | Settings lists |
| **Badge** | Status indicator | Notifications, counts |
| **Chip** | Metadata tags | Labels, categories |
| **Divider** | Separator | Between list items |
| **Link** | Inline action | Secondary navigation |

#### List Item Composition Patterns

**Simple List Item (Icon + Text)**
```
┌─────────────────────────────────────────┐
│  [Icon]   Primary Text                  │
└─────────────────────────────────────────┘
Atoms: Icon
```

**List Item with Avatar + Two Lines**
```
┌─────────────────────────────────────────┐
│  [Avatar]   Primary Text                │
│             Secondary Text              │
└─────────────────────────────────────────┘
Atoms: Avatar
```

**List Item with Trailing Badge**
```
┌─────────────────────────────────────────┐
│  [Icon]   Primary Text         [Badge]  │
└─────────────────────────────────────────┘
Atoms: Icon, Badge
```

**Selectable List Item**
```
┌─────────────────────────────────────────┐
│  [Checkbox]  [Icon]   Primary Text      │
└─────────────────────────────────────────┘
Atoms: Checkbox, Icon
```

**Settings List Item**
```
┌─────────────────────────────────────────┐
│  [Icon]   Primary Text         [Switch] │
│           Helper Text                   │
└─────────────────────────────────────────┘
Atoms: Icon, Switch
```

**Complex List Item (Issue Row)**
```
┌──────────────────────────────────────────────────────────────────┐
│  [Checkbox] [Icon] ID  Title Text   [Chip][Chip]  [Avatar] Date  │
└──────────────────────────────────────────────────────────────────┘
Atoms: Checkbox, Icon, Chip, Avatar
```

#### New Elements Required for List

| Element | Description |
|---------|-------------|
| List Container | Wrapper component with padding, background, divider logic |
| List Item Base | Flex container with spacing, hover/active states, click handling |
| List Subheader | Section label with optional action |
| Trailing Action Area | Container for trailing elements |
| Leading Visual Container | Standardized container for leading icon/avatar |

#### Reusability Summary

| Category | Count | Details |
|----------|-------|---------|
| Atoms to reuse | 8 | Avatar, Icon, Checkbox, Radio, Switch, Badge, Chip, Divider |
| New elements needed | 4 | Container, Item Base, Subheader, Slot containers |

**~70% of the List component can be composed from existing atoms.**

---

## Implementation Priorities

### Priority Matrix

#### High Priority (Core Functionality Gaps)

| Component | Complexity | Screens Using | Impact |
|-----------|------------|---------------|--------|
| **List** | Medium | 6/8 | Critical - foundational component |
| **Chart** | High | 2/8 | Critical - data visualization |
| **Empty State** | Low | 2/8 | High - UX completeness |

#### Medium Priority (Enhanced UX)

| Component | Complexity | Screens Using | Impact |
|-----------|------------|---------------|--------|
| Code Editor | High | 1/8 | Developer tools |
| Split View | Medium | 1/8 | Complex layouts |

#### Low Priority (Nice to Have)

| Component | Complexity | Screens Using | Impact |
|-----------|------------|---------------|--------|
| Keyboard Shortcut | Low | 1/8 | Power user feature |

### Variant Additions (Must Add)

| Component | Variant to Add | Priority |
|-----------|---------------|----------|
| Badge | `Variant=Text` | High |
| Tab Navigation | `Variant=Pill` | High |
| Button | `Type=Split` | Medium |
| Avatar | `Shape=Square, RoundedSquare` | Medium |
| Icon | `Background=Colored` | Medium |
| Chip | `WithIcon=True` | Medium |
| Progress Circular | `Size=XSmall` | Low |
| Checkbox | `Shape=Circular` | Low |
| Card | `Type=Metric, Stats, Picker` | High |
| Progress Linear | `Type=Segmented` | Medium |

---

## Appendix: Screen-by-Screen Analysis

### Vanta Web 54

**Components Found:**
- Drawer, Search, Divider, Icon, Link, Progress Linear, Button, Dropdown, Tooltip

**Components Needing Variants:**
- Badge (text variant for "New", "Try free")
- Progress Linear (segmented type)
- Card (metric/KPI variant)
- Drawer (collapsible variant)

**New Components Needed:**
- Stat Card / KPI Card
- Section Header (collapsible)
- Keyboard Shortcut Hint

---

### GitHub Android 7

**Components Found:**
- Bottom Navigation, Icon, Avatar, Divider

**Components Needing Variants:**
- Avatar (square shape for repo icons)
- Icon (colored backgrounds)

**New Components Needed:**
- List Item (icon + text)
- List Item (avatar + two-line)
- Section Header with Action

---

### Stripe Dashboard iOS 41

**Components Found:**
- Bottom Navigation, Icon, Divider, Tab Navigation

**Components Needing Variants:**
- Tab Navigation (pill variant)
- Card (stats layout)

**New Components Needed:**
- Stats Row Card
- Empty State Chart

---

### Stripe Web 212

**Components Found:**
- Tab Navigation, Alert, Search, Dropdown, Button, Avatar, Icon, Link, Divider, Badge, Switch

**Components Needing Variants:**
- Tab Navigation (pill variant)
- Button (split type)
- Alert (dismissible inline)

**New Components Needed:**
- Bar Chart
- Chart Legend
- Date Range Selector

---

### Retool Web 28

**Components Found:**
- Tab Navigation, Search, Button, Dropdown, Table, Icon, Badge, Divider, Text Field

**Components Needing Variants:**
- Tab Navigation (with icon support)
- Card (picker type)

**New Components Needed:**
- Code Editor
- Component Picker Grid
- Resizable Panels
- Tree View (enhanced with data types)

---

### Linear iOS 17

**Components Found:**
- Bottom Navigation, Icon

**Components Needing Variants:**
- Icon (status colors)

**New Components Needed:**
- List Item (navigation style)
- Section Header
- Project/Issue List Item

---

### Linear Web 279

**Components Found:**
- Drawer, Tree View, Button, Search, Checkbox, Avatar, Icon, Badge, Divider, Tooltip

**Components Needing Variants:**
- Chip (with icon)
- Badge (dot + label)
- Progress Circular (XSmall)
- Checkbox (circular)

**New Components Needed:**
- Issue Row (complex list item)
- Issue Status Icon
- Grouping Header
- View Switcher

---

## References

- **Figma Source:** [Artemis - Modular Design System](https://www.figma.com/design/qyrtCkpQQ1yq1Nv3h0mbkq/Artemis---Modular-Design-System)
- **MUI Documentation:** [mui.com](https://mui.com)
- **Mobbin:** [mobbin.com](https://mobbin.com) - UI reference screenshots

---

*Document generated from Figma design system analysis and Mobbin UI audit.*
