import { forwardRef } from 'react';
import type { QRBuild } from '@/core/qr';
import type { CodeStyle } from '@/game/myCodes';
import { COLOR_THEMES } from '@/game/unlocks';
import { QrView } from './QrView';

interface StyledQrProps {
  build: QRBuild;
  /** Decoration; plain black-and-white when missing. */
  style?: CodeStyle;
  className?: string;
  label?: string;
}

/** A finished code drawn with its decoration, the same everywhere it appears. */
export const StyledQr = forwardRef<SVGSVGElement, StyledQrProps>(function StyledQr(
  { build, style, className, label },
  ref,
) {
  const theme = COLOR_THEMES.find((t) => t.id === style?.themeId) ?? COLOR_THEMES[0];
  const shape = style?.shape ?? 'square';
  const isEye = (x: number, y: number) => build.info[y][x].region === 'finder';
  return (
    <QrView
      ref={ref}
      className={className}
      modules={build.modules}
      quietZone={4}
      background={theme.light}
      shape={shape}
      sticker={style?.sticker}
      // Fancy dot shapes get solid eyes so scanners can still find the code.
      eyeColor={shape === 'square' ? undefined : theme.eye}
      fill={(x, y, dark) => (dark ? (isEye(x, y) ? theme.eye : theme.dark) : null)}
      label={label ?? `QR code for: ${build.text}`}
    />
  );
});
