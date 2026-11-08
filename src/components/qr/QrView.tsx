import { forwardRef, useCallback, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import type { DotShape } from '@/game/unlocks';
import { emojiUrl } from '../emojiAssets';

export interface QrViewProps {
  modules: boolean[][];
  /** Colour for a module, or null to leave it blank. Defaults to dark modules in `darkColor`. */
  fill?: (x: number, y: number, dark: boolean) => string | null;
  darkColor?: string;
  background?: string;
  shape?: DotShape;
  /** Modules to outline (e.g. the one being inspected). */
  highlight?: (x: number, y: number) => boolean;
  /** Draw faint cell outlines so empty spots are visible. */
  showGrid?: boolean;
  /** Light modules around the code; scanners need some. */
  quietZone?: number;
  /** Twemoji code for a sticker in the centre. */
  sticker?: string;
  /**
   * Draw the three finder "eyes" as solid rounded rings in this colour. Used with
   * fancy dot shapes, which would otherwise break the eyes' outline for scanners.
   */
  eyeColor?: string;
  onModuleTap?: (x: number, y: number) => void;
  /** Called while a finger drags across modules (for scratching). */
  onModuleDrag?: (x: number, y: number) => void;
  className?: string;
  label?: string;
  children?: ReactNode;
}

const HEART =
  'M0.5 0.88C0.12 0.6 0.02 0.42 0.08 0.26C0.15 0.08 0.4 0.06 0.5 0.26C0.6 0.06 0.85 0.08 0.92 0.26C0.98 0.42 0.88 0.6 0.5 0.88Z';

function moduleShape(shape: DotShape, x: number, y: number, color: string, key: string) {
  switch (shape) {
    case 'round':
      return <rect key={key} x={x + 0.04} y={y + 0.04} width={0.92} height={0.92} rx={0.3} fill={color} />;
    case 'dot':
      return <circle key={key} cx={x + 0.5} cy={y + 0.5} r={0.46} fill={color} />;
    case 'diamond':
      return (
        <path
          key={key}
          d={`M${x + 0.5} ${y}L${x + 1} ${y + 0.5}L${x + 0.5} ${y + 1}L${x} ${y + 0.5}Z`}
          fill={color}
        />
      );
    case 'heart':
      return <path key={key} d={HEART} transform={`translate(${x} ${y})`} fill={color} />;
    default:
      return null;
  }
}

/** Renders a QR grid as crisp, scalable SVG, with optional interaction. */
export const QrView = forwardRef<SVGSVGElement, QrViewProps>(function QrView(
  {
    modules,
    fill,
    darkColor = '#1d1b2f',
    background = '#ffffff',
    shape = 'square',
    highlight,
    showGrid = false,
    quietZone = 2,
    sticker,
    eyeColor,
    onModuleTap,
    onModuleDrag,
    className,
    label = 'QR code',
    children,
  },
  ref,
) {
  const size = modules.length;
  const total = size + quietZone * 2;
  const dragging = useRef(false);
  const lastDrag = useRef('');

  const inEye = useCallback(
    (x: number, y: number) =>
      eyeColor !== undefined &&
      (x < 7 || x >= size - 7) &&
      (y < 7 || y >= size - 7) &&
      !(x >= size - 7 && y >= size - 7),
    [eyeColor, size],
  );

  const colorOf = useCallback(
    (x: number, y: number, dark: boolean) => {
      if (inEye(x, y)) return null;
      return fill ? fill(x, y, dark) : dark ? darkColor : null;
    },
    [fill, darkColor, inEye],
  );

  // Square modules are merged into one path per colour: fast even for big codes.
  const content = useMemo(() => {
    if (shape === 'square') {
      const paths = new Map<string, string[]>();
      modules.forEach((row, y) =>
        row.forEach((dark, x) => {
          const color = colorOf(x, y, dark);
          if (!color) return;
          if (!paths.has(color)) paths.set(color, []);
          paths.get(color)!.push(`M${x} ${y}h1v1h-1z`);
        }),
      );
      return [...paths].map(([color, d]) => (
        <path key={color} d={d.join('')} fill={color} shapeRendering="crispEdges" />
      ));
    }
    const nodes: ReactNode[] = [];
    modules.forEach((row, y) =>
      row.forEach((dark, x) => {
        const color = colorOf(x, y, dark);
        if (color) nodes.push(moduleShape(shape, x, y, color, `${x},${y}`));
      }),
    );
    return nodes;
  }, [modules, colorOf, shape]);

  const highlights = useMemo(() => {
    if (!highlight) return null;
    const out: ReactNode[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (highlight(x, y)) {
          out.push(
            <rect
              key={`h${x},${y}`}
              x={x - 0.1}
              y={y - 0.1}
              width={1.2}
              height={1.2}
              fill="none"
              stroke="#ffc533"
              strokeWidth={0.28}
              rx={0.2}
            />,
          );
        }
      }
    }
    return out;
  }, [highlight, size]);

  const toModule = (e: PointerEvent<SVGSVGElement>): [number, number] | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * total - quietZone);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * total - quietZone);
    return x >= 0 && y >= 0 && x < size && y < size ? [x, y] : null;
  };

  const drag = (e: PointerEvent<SVGSVGElement>) => {
    const m = toModule(e);
    if (!m || !onModuleDrag) return;
    const key = m.join(',');
    if (key === lastDrag.current) return;
    lastDrag.current = key;
    onModuleDrag(m[0], m[1]);
  };

  const interactive = Boolean(onModuleTap || onModuleDrag);
  const stickerUrl = sticker ? emojiUrl(sticker) : undefined;
  const stickerSize = Math.max(5, Math.round(size * 0.22));
  const stickerPos = (size - stickerSize) / 2;

  return (
    <svg
      ref={ref}
      viewBox={`${-quietZone} ${-quietZone} ${total} ${total}`}
      className={className}
      role="img"
      aria-label={label}
      style={{
        touchAction: interactive ? 'none' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        display: 'block',
      }}
      onPointerDown={(e) => {
        if (onModuleDrag) {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag(e);
        }
      }}
      onPointerMove={(e) => dragging.current && drag(e)}
      onPointerUp={(e) => {
        dragging.current = false;
        lastDrag.current = '';
        if (onModuleTap) {
          const m = toModule(e);
          if (m) onModuleTap(m[0], m[1]);
        }
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <rect
        x={-quietZone}
        y={-quietZone}
        width={total}
        height={total}
        fill={background}
        rx={quietZone ? 0.8 : 0}
      />
      {showGrid && (
        <g stroke="rgb(43 33 71 / 0.12)" strokeWidth={0.04}>
          {Array.from({ length: size + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i} y1={0} x2={i} y2={size} />
              <line x1={0} y1={i} x2={size} y2={i} />
            </g>
          ))}
        </g>
      )}
      {content}
      {eyeColor &&
        [
          [0, 0],
          [size - 7, 0],
          [0, size - 7],
        ].map(([ex, ey]) => (
          <g key={`eye${ex},${ey}`} fill={eyeColor}>
            <path
              fillRule="evenodd"
              d={`M${ex + 1.6} ${ey}h3.8a1.6 1.6 0 0 1 1.6 1.6v3.8a1.6 1.6 0 0 1-1.6 1.6h-3.8a1.6 1.6 0 0 1-1.6-1.6v-3.8a1.6 1.6 0 0 1 1.6-1.6z M${ex + 1.8} ${ey + 1}h3.4a0.8 0.8 0 0 1 0.8 0.8v3.4a0.8 0.8 0 0 1-0.8 0.8h-3.4a0.8 0.8 0 0 1-0.8-0.8v-3.4a0.8 0.8 0 0 1 0.8-0.8z`}
            />
            <rect x={ex + 2} y={ey + 2} width={3} height={3} rx={0.9} />
          </g>
        ))}
      {stickerUrl && (
        <g>
          <rect
            x={stickerPos - 0.5}
            y={stickerPos - 0.5}
            width={stickerSize + 1}
            height={stickerSize + 1}
            rx={1.2}
            fill={background}
          />
          <image href={stickerUrl} x={stickerPos} y={stickerPos} width={stickerSize} height={stickerSize} />
        </g>
      )}
      {highlights}
      {children}
    </svg>
  );
});
