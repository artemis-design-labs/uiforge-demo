#!/bin/bash

# UI Forge Demo - Quick Demo Setup
# Sets up mock data and starts the demo without requiring full AI infrastructure

set -e

echo "🎯 UI Forge Demo Mode Setup"
echo "==========================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}This script sets up UI Forge for demo mode:${NC}"
echo "  - Uses mock component data (no AI required)"
echo "  - Pre-configured Figma file examples"
echo "  - Sample generated React components"
echo ""

# Check if repos are set up
if [ ! -f "$ROOT_DIR/apps/frontend/package.json" ]; then
    echo -e "${YELLOW}⚠️  Repositories not found. Running full setup first...${NC}"
    bash "$SCRIPT_DIR/setup.sh"
fi

# Create demo data directory
DEMO_DATA_DIR="$ROOT_DIR/apps/backend/demo-data"
mkdir -p "$DEMO_DATA_DIR"

# Create mock Figma components data
cat > "$DEMO_DATA_DIR/mock-components.json" << 'EOF'
{
  "components": [
    {
      "id": "button-primary",
      "name": "Button/Primary",
      "type": "COMPONENT",
      "description": "Primary action button with hover states",
      "properties": {
        "width": 120,
        "height": 44,
        "cornerRadius": 8,
        "backgroundColor": "#6366F1",
        "textColor": "#FFFFFF",
        "text": "Click Me",
        "fontSize": 14,
        "fontWeight": "600"
      },
      "variants": [
        { "id": "default", "name": "Default" },
        { "id": "hover", "name": "Hover" },
        { "id": "pressed", "name": "Pressed" },
        { "id": "disabled", "name": "Disabled" }
      ],
      "generatedCode": "import React from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'default' | 'hover' | 'pressed' | 'disabled';\n  children: React.ReactNode;\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant = 'default', children, ...props }, ref) => {\n    return (\n      <button\n        ref={ref}\n        className={cn(\n          'inline-flex items-center justify-center rounded-lg px-4 py-2.5',\n          'text-sm font-semibold text-white bg-indigo-500',\n          'hover:bg-indigo-600 focus:outline-none focus:ring-2',\n          'focus:ring-indigo-500 focus:ring-offset-2',\n          'disabled:opacity-50 disabled:cursor-not-allowed',\n          className\n        )}\n        {...props}\n      >\n        {children}\n      </button>\n    );\n  }\n);\n\nButton.displayName = 'Button';"
    },
    {
      "id": "input-text",
      "name": "Input/Text",
      "type": "COMPONENT",
      "description": "Text input field with label and validation states",
      "properties": {
        "width": 320,
        "height": 44,
        "cornerRadius": 8,
        "backgroundColor": "#FFFFFF",
        "borderColor": "#E5E7EB",
        "textColor": "#1F2937",
        "placeholderColor": "#9CA3AF",
        "fontSize": 14
      },
      "variants": [
        { "id": "default", "name": "Default" },
        { "id": "focus", "name": "Focus" },
        { "id": "error", "name": "Error" },
        { "id": "disabled", "name": "Disabled" }
      ],
      "generatedCode": "import React from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {\n  label?: string;\n  error?: string;\n}\n\nexport const Input = React.forwardRef<HTMLInputElement, InputProps>(\n  ({ className, label, error, ...props }, ref) => {\n    return (\n      <div className=\"w-full\">\n        {label && (\n          <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n            {label}\n          </label>\n        )}\n        <input\n          ref={ref}\n          className={cn(\n            'w-full px-3 py-2.5 rounded-lg border',\n            'text-sm text-gray-900 placeholder-gray-400',\n            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',\n            error ? 'border-red-500' : 'border-gray-200',\n            'disabled:bg-gray-50 disabled:cursor-not-allowed',\n            className\n          )}\n          {...props}\n        />\n        {error && (\n          <p className=\"mt-1 text-sm text-red-500\">{error}</p>\n        )}\n      </div>\n    );\n  }\n);\n\nInput.displayName = 'Input';"
    },
    {
      "id": "card-product",
      "name": "Card/Product",
      "type": "COMPONENT",
      "description": "Product card with image, title, and price",
      "properties": {
        "width": 280,
        "height": 360,
        "cornerRadius": 12,
        "backgroundColor": "#FFFFFF",
        "shadowColor": "rgba(0,0,0,0.1)",
        "shadowBlur": 20
      },
      "variants": [
        { "id": "default", "name": "Default" },
        { "id": "hover", "name": "Hover" },
        { "id": "selected", "name": "Selected" }
      ],
      "generatedCode": "import React from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface ProductCardProps {\n  image: string;\n  title: string;\n  price: number;\n  originalPrice?: number;\n  className?: string;\n}\n\nexport const ProductCard: React.FC<ProductCardProps> = ({\n  image,\n  title,\n  price,\n  originalPrice,\n  className,\n}) => {\n  return (\n    <div\n      className={cn(\n        'w-[280px] bg-white rounded-xl overflow-hidden',\n        'shadow-lg hover:shadow-xl transition-shadow duration-300',\n        className\n      )}\n    >\n      <div className=\"aspect-square overflow-hidden\">\n        <img\n          src={image}\n          alt={title}\n          className=\"w-full h-full object-cover hover:scale-105 transition-transform duration-300\"\n        />\n      </div>\n      <div className=\"p-4\">\n        <h3 className=\"text-lg font-semibold text-gray-900 truncate\">\n          {title}\n        </h3>\n        <div className=\"flex items-center gap-2 mt-2\">\n          <span className=\"text-xl font-bold text-indigo-600\">\n            ${price.toFixed(2)}\n          </span>\n          {originalPrice && (\n            <span className=\"text-sm text-gray-400 line-through\">\n              ${originalPrice.toFixed(2)}\n            </span>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n};"
    }
  ],
  "figmaFileUrl": "https://www.figma.com/file/demo/UI-Forge-Design-System",
  "lastUpdated": "2025-01-08T12:00:00Z"
}
EOF

echo -e "${GREEN}✓ Created mock component data${NC}"

# Create sample generated components directory
SAMPLE_COMPONENTS_DIR="$ROOT_DIR/apps/component-tester/generated"
mkdir -p "$SAMPLE_COMPONENTS_DIR"

cat > "$SAMPLE_COMPONENTS_DIR/Button.tsx" << 'EOF'
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 focus:ring-indigo-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4\" fill="none\" viewBox="0 0 24 24\">
            <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4\" />
            <path className="opacity-75\" fill="currentColor\" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z\" />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
EOF

echo -e "${GREEN}✓ Created sample generated components${NC}"

# Update backend to use demo mode
if [ -f "$ROOT_DIR/apps/backend/server.js" ]; then
    # Create demo mode flag
    if ! grep -q "DEMO_MODE" "$ROOT_DIR/apps/backend/.env" 2>/dev/null; then
        echo "" >> "$ROOT_DIR/apps/backend/.env"
        echo "# Demo Mode (uses mock data instead of real AI)" >> "$ROOT_DIR/apps/backend/.env"
        echo "DEMO_MODE=true" >> "$ROOT_DIR/apps/backend/.env"
    fi
fi

echo ""
echo -e "${GREEN}✅ Demo mode setup complete!${NC}"
echo ""
echo -e "${CYAN}Demo Features:${NC}"
echo "  • Mock Figma component data loaded"
echo "  • Sample generated React components ready"
echo "  • No AI/ML infrastructure required"
echo "  • No MongoDB required (in-memory data)"
echo ""
echo -e "${CYAN}To start the demo:${NC}"
echo "  cd $(basename $ROOT_DIR)"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
