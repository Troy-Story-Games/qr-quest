import { normaliseUrl, wifiPayload, type WifiSecurity } from '@/core/payload/payload';

export type TemplateId = 'text' | 'web' | 'wifi' | 'secret';

export interface TemplateFields {
  text: string;
  url: string;
  ssid: string;
  password: string;
  security: WifiSecurity;
  secret: string;
  from: string;
}

export const TEMPLATES: Array<{ id: TemplateId; label: string; emoji: string; tip: string }> = [
  {
    id: 'text',
    label: 'Words',
    emoji: '1f4dd',
    tip: 'Type any words. When someone scans it, they will see your words!',
  },
  {
    id: 'web',
    label: 'Website',
    emoji: '1f517',
    tip: 'Type a website. Scanning it opens the website. Ask a grown-up which sites are OK!',
  },
  {
    id: 'wifi',
    label: 'WiFi',
    emoji: '1f4f6',
    tip: 'Make a code that lets phones join a WiFi network without typing the password!',
  },
  {
    id: 'secret',
    label: 'Secret',
    emoji: '1f48c',
    tip: 'Write a secret message. Only people who scan the code can read it!',
  },
];

export const EMPTY_FIELDS: TemplateFields = {
  text: 'Hello!',
  url: '',
  ssid: '',
  password: '',
  security: 'WPA',
  secret: '',
  from: '',
};

/** Turns the form fields into the text that goes inside the code. */
export function buildPayload(template: TemplateId, f: TemplateFields): string {
  switch (template) {
    case 'web':
      return f.url.trim() ? normaliseUrl(f.url) : '';
    case 'wifi':
      return f.ssid
        ? wifiPayload({ ssid: f.ssid, password: f.password, security: f.password ? f.security : 'nopass' })
        : '';
    case 'secret':
      return f.secret ? `💌 Secret message${f.from ? ` from ${f.from}` : ''}: ${f.secret}` : '';
    default:
      return f.text;
  }
}
