'use client';
import React from 'react';

// Chevron SVG icons
const ChevronDown = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/>
    </svg>
);

const ChevronUp = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" fill="currentColor"/>
    </svg>
);

export interface AccordionProps {
    heading?: string;
    secondaryHeading?: string;
    content?: string;
    expanded?: boolean;
    disabled?: boolean;
    firstOfType?: boolean;
    lastOfType?: boolean;
    darkMode?: boolean;
}

export function AccordionItem({
    heading = "Heading",
    secondaryHeading = "Secondary heading",
    content = "Content",
    expanded = false,
    disabled = false,
    firstOfType = false,
    lastOfType = false,
    darkMode = false
}: AccordionProps) {
    // Determine border radius based on position
    const borderRadius = `${firstOfType ? 'rounded-t-md' : ''} ${lastOfType ? 'rounded-b-md' : ''}`.trim();

    // Background and text colors based on mode and state
    const bgColor = darkMode ? 'bg-[#1e1e1e]' : 'bg-white';
    const textPrimary = darkMode ? 'text-white/87' : 'text-black/87';
    const textSecondary = darkMode ? 'text-white/60' : 'text-black/60';
    const disabledBg = darkMode ? 'bg-white/12' : 'bg-black/12';

    const containerClasses = `
        ${bgColor}
        ${borderRadius}
        shadow-[0px_2px_1px_-1px_rgba(0,0,0,0.2),0px_1px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.12)]
        w-[600px]
        overflow-hidden
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className={containerClasses}>
            {/* Summary row */}
            <div className={`flex items-center w-full ${disabled ? disabledBg : ''}`}>
                {/* Expand icon */}
                <div className="flex items-center justify-center w-12 h-12">
                    <div className={`${textPrimary}`}>
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                    </div>
                </div>

                {/* Heading */}
                <div className="flex-1 py-3">
                    <p className={`text-base font-normal leading-6 tracking-wide ${disabled ? textSecondary : textPrimary}`}>
                        {heading}
                    </p>
                </div>

                {/* Secondary heading */}
                <div className="flex-1 py-3">
                    <p className={`text-base font-normal leading-6 tracking-wide ${textSecondary}`}>
                        {secondaryHeading}
                    </p>
                </div>
            </div>

            {/* Content (only shown when expanded) */}
            {expanded && !disabled && (
                <div className="px-12 py-3">
                    <p className={`text-base font-normal leading-6 tracking-wide ${textPrimary}`}>
                        {content}
                    </p>
                </div>
            )}
        </div>
    );
}

// Generate JSX string for a variant
export function generateAccordionJSX(props: AccordionProps): string {
    const {
        heading = "Heading",
        secondaryHeading = "Secondary heading",
        content = "Content",
        expanded = false,
        disabled = false,
        firstOfType = false,
        lastOfType = false,
        darkMode = false
    } = props;

    const borderRadius = `${firstOfType ? 'rounded-t-md' : ''} ${lastOfType ? 'rounded-b-md' : ''}`.trim();
    const bgColor = darkMode ? 'bg-[#1e1e1e]' : 'bg-white';
    const textPrimary = darkMode ? 'text-white/87' : 'text-black/87';
    const textSecondary = darkMode ? 'text-white/60' : 'text-black/60';
    const disabledBg = darkMode ? 'bg-white/12' : 'bg-black/12';

    const containerClasses = `${bgColor} ${borderRadius} shadow-[0px_2px_1px_-1px_rgba(0,0,0,0.2),0px_1px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.12)] w-[600px] overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`;

    const chevronSvg = expanded
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" fill="currentColor"/></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/></svg>`;

    const contentSection = expanded && !disabled
        ? `<div className="px-12 py-3"><p className="text-base font-normal leading-6 tracking-wide ${textPrimary}">${content}</p></div>`
        : '';

    return `
<div className="${containerClasses}">
  <div className="flex items-center w-full ${disabled ? disabledBg : ''}">
    <div className="flex items-center justify-center w-12 h-12">
      <div className="${textPrimary}" dangerouslySetInnerHTML={{ __html: '${chevronSvg}' }} />
    </div>
    <div className="flex-1 py-3">
      <p className="text-base font-normal leading-6 tracking-wide ${disabled ? textSecondary : textPrimary}">${heading}</p>
    </div>
    <div className="flex-1 py-3">
      <p className="text-base font-normal leading-6 tracking-wide ${textSecondary}">${secondaryHeading}</p>
    </div>
  </div>
  ${contentSection}
</div>
`.trim();
}

// Pre-defined variants for the component set
export const ACCORDION_VARIANTS = [
    // DarkMode variants (with darkMode: false as they have white background)
    { id: '1:46', name: 'Expanded=False, Disabled=False, First-of-type=False, Last-of-type=False', props: { expanded: false, disabled: false, firstOfType: false, lastOfType: false, darkMode: false } },
    { id: '1:55', name: 'Expanded=True, Disabled=False, First-of-type=False, Last-of-type=False', props: { expanded: true, disabled: false, firstOfType: false, lastOfType: false, darkMode: false } },
    { id: '1:66', name: 'Expanded=False, Disabled=False, First-of-type=True, Last-of-type=False', props: { expanded: false, disabled: false, firstOfType: true, lastOfType: false, darkMode: false } },
    { id: '1:75', name: 'Expanded=True, Disabled=False, First-of-type=True, Last-of-type=False', props: { expanded: true, disabled: false, firstOfType: true, lastOfType: false, darkMode: false } },
    { id: '1:86', name: 'Expanded=False, Disabled=False, First-of-type=False, Last-of-type=True', props: { expanded: false, disabled: false, firstOfType: false, lastOfType: true, darkMode: false } },
    { id: '1:95', name: 'Expanded=True, Disabled=False, First-of-type=False, Last-of-type=True', props: { expanded: true, disabled: false, firstOfType: false, lastOfType: true, darkMode: false } },
    { id: '1:108', name: 'Expanded=False, Disabled=True, First-of-type=False, Last-of-type=False', props: { expanded: false, disabled: true, firstOfType: false, lastOfType: false, darkMode: false } },
    { id: '1:117', name: 'Expanded=False, Disabled=True, First-of-type=True, Last-of-type=False', props: { expanded: false, disabled: true, firstOfType: true, lastOfType: false, darkMode: false } },
    { id: '1:126', name: 'Expanded=False, Disabled=True, First-of-type=False, Last-of-type=True', props: { expanded: false, disabled: true, firstOfType: false, lastOfType: true, darkMode: false } },
];

export default AccordionItem;
