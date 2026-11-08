/** Builds and recognises the special kinds of text that QR codes commonly carry. */

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export interface WifiInfo {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden?: boolean;
}

const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

/** The standard format phones understand: scanning it offers to join the network. */
export function wifiPayload({ ssid, password, security, hidden }: WifiInfo): string {
  const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
  if (security !== 'nopass') parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

export function parseWifi(text: string): WifiInfo | null {
  if (!text.startsWith('WIFI:')) return null;
  const fields = new Map<string, string>();
  const re = /([TSPH]):((?:\\.|[^;])*);/g;
  for (const m of text.slice(5).matchAll(re)) fields.set(m[1], m[2].replace(/\\(.)/g, '$1'));
  const ssid = fields.get('S');
  if (ssid === undefined) return null;
  const t = fields.get('T');
  return {
    ssid,
    password: fields.get('P') ?? '',
    security: t === 'WEP' || t === 'nopass' ? t : 'WPA',
    hidden: fields.get('H') === 'true',
  };
}

/** Adds https:// if the kid typed "example.com". */
export function normaliseUrl(input: string): string {
  const trimmed = input.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isWebUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface Clue {
  number: number;
  total: number;
  text: string;
}

/**
 * Treasure hunt clues are plain text so any phone can read them, with a
 * recognisable prefix so this app can track progress and celebrate.
 */
export function cluePayload({ number, total, text }: Clue): string {
  return `🗺️ Clue ${number} of ${total}: ${text}`;
}

export function parseClue(text: string): Clue | null {
  const m = /^🗺️ Clue (\d+) of (\d+): ([\s\S]*)$/u.exec(text);
  if (!m) return null;
  return { number: Number(m[1]), total: Number(m[2]), text: m[3] };
}

export type PayloadKind = 'web' | 'wifi' | 'clue' | 'text';

export function classify(text: string): PayloadKind {
  if (parseWifi(text)) return 'wifi';
  if (parseClue(text)) return 'clue';
  if (isWebUrl(text)) return 'web';
  return 'text';
}
