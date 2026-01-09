/**
 * Validate Figma component data
 */
export function validateComponentData(componentData) {
  const errors = [];

  // Check if componentData exists
  if (!componentData) {
    errors.push('Component data is required');
    return { valid: false, errors };
  }

  // Check for required fields
  if (!componentData.id) {
    errors.push('Component ID is required');
  }

  if (!componentData.type) {
    errors.push('Component type is required');
  }

  // Validate component structure
  if (componentData.children && !Array.isArray(componentData.children)) {
    errors.push('Component children must be an array');
  }

  // Validate absolute bounding box
  if (componentData.absoluteBoundingBox) {
    const box = componentData.absoluteBoundingBox;
    if (typeof box.x !== 'number' ||
        typeof box.y !== 'number' ||
        typeof box.width !== 'number' ||
        typeof box.height !== 'number') {
      errors.push('Invalid absoluteBoundingBox structure');
    }
  }

  // Validate fills if present
  if (componentData.fills && !Array.isArray(componentData.fills)) {
    errors.push('Fills must be an array');
  }

  // Validate strokes if present
  if (componentData.strokes && !Array.isArray(componentData.strokes)) {
    errors.push('Strokes must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate generation config
 */
export function validateGenerationConfig(config) {
  const errors = [];
  const validFrameworks = ['react', 'nextjs', 'angular', 'vue'];
  const validStyling = ['styled-components', 'tailwind', 'css-modules', 'emotion', 'sass'];

  if (config.framework && !validFrameworks.includes(config.framework)) {
    errors.push(`Invalid framework. Must be one of: ${validFrameworks.join(', ')}`);
  }

  if (config.styling && !validStyling.includes(config.styling)) {
    errors.push(`Invalid styling method. Must be one of: ${validStyling.join(', ')}`);
  }

  if (config.packageScope && !config.packageScope.startsWith('@')) {
    errors.push('Package scope must start with @');
  }

  if (config.componentName && !/^[A-Z][a-zA-Z0-9]*$/.test(config.componentName)) {
    errors.push('Component name must start with uppercase letter and contain only alphanumeric characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize component name for package naming
 */
export function sanitizeComponentName(name) {
  // Remove special characters and convert to kebab-case
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Validate npm package name
 */
export function validatePackageName(packageName) {
  const errors = [];

  // Check format
  if (!packageName) {
    errors.push('Package name is required');
    return { valid: false, errors };
  }

  // Check if scoped
  if (packageName.startsWith('@')) {
    const parts = packageName.split('/');
    if (parts.length !== 2) {
      errors.push('Scoped package must have format @scope/name');
    }
    if (parts[0].length < 2) {
      errors.push('Scope name is too short');
    }
    if (parts[1] && parts[1].length < 1) {
      errors.push('Package name is too short');
    }
  }

  // Check for invalid characters
  if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(packageName)) {
    errors.push('Package name contains invalid characters');
  }

  // Check length
  if (packageName.length > 214) {
    errors.push('Package name is too long (max 214 characters)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract component metadata from Figma data
 */
export function extractComponentMetadata(componentData) {
  return {
    id: componentData.id,
    name: componentData.name || 'Component',
    type: componentData.type,
    width: componentData.absoluteBoundingBox?.width,
    height: componentData.absoluteBoundingBox?.height,
    hasChildren: componentData.children && componentData.children.length > 0,
    fillColors: extractColors(componentData.fills),
    strokeColors: extractColors(componentData.strokes),
    cornerRadius: componentData.cornerRadius,
    effects: componentData.effects,
    constraints: componentData.constraints,
    layoutMode: componentData.layoutMode,
    primaryAxisSizingMode: componentData.primaryAxisSizingMode,
    counterAxisSizingMode: componentData.counterAxisSizingMode,
    primaryAxisAlignItems: componentData.primaryAxisAlignItems,
    counterAxisAlignItems: componentData.counterAxisAlignItems,
    paddingLeft: componentData.paddingLeft,
    paddingRight: componentData.paddingRight,
    paddingTop: componentData.paddingTop,
    paddingBottom: componentData.paddingBottom,
    itemSpacing: componentData.itemSpacing,
    layoutWrap: componentData.layoutWrap
  };
}

/**
 * Extract colors from fills or strokes
 */
function extractColors(items) {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .filter(item => item.type === 'SOLID' && item.color)
    .map(item => {
      const { r, g, b, a } = item.color;
      return {
        hex: rgbToHex(r, g, b),
        rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
        opacity: a
      };
    });
}

/**
 * Convert RGB to HEX
 */
function rgbToHex(r, g, b) {
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default {
  validateComponentData,
  validateGenerationConfig,
  sanitizeComponentName,
  validatePackageName,
  extractComponentMetadata
};