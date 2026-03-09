import React from 'react';
import { ICON_PATHS, type IconName, type SvgElement } from './iconPaths';

export type { IconName } from './iconPaths';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'children'> {
  /** Icon identifier — must match a key in ICON_PATHS. */
  name: IconName;
  /** Rendered width & height in px (viewBox is always 0 0 24 24). */
  size?: number;
}

/** Render a single SvgElement descriptor to a React element. */
function renderElement(el: SvgElement, idx: number): React.ReactElement {
  switch (el.tag) {
    case 'path':
      return <path key={idx} d={el.d} />;
    case 'circle':
      return <circle key={idx} cx={el.cx} cy={el.cy} r={el.r} />;
    case 'line':
      return <line key={idx} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} />;
    case 'rect':
      return <rect key={idx} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} ry={el.ry} />;
    case 'polyline':
      return <polyline key={idx} points={el.points} />;
    case 'polygon':
      return <polygon key={idx} points={el.points} />;
  }
}

/**
 * Unified icon component that replaces all inline `<svg>` elements.
 *
 * @example
 * ```tsx
 * <Icon name="search" />
 * <Icon name="home" size={20} className="text-brand" />
 * <Icon name="alert-triangle" size={28} stroke="var(--color-danger-600)" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  strokeWidth = 2,
  stroke = 'currentColor',
  fill = 'none',
  strokeLinecap = 'round',
  strokeLinejoin = 'round',
  className,
  style,
  ...rest
}) => {
  const elements = ICON_PATHS[name];

  if (!elements) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={className}
      style={style}
      {...rest}
    >
      {elements.map(renderElement)}
    </svg>
  );
};
