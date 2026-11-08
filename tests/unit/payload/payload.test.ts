import { describe, expect, it } from 'vitest';
import {
  classify,
  cluePayload,
  normaliseUrl,
  parseClue,
  parseWifi,
  wifiPayload,
} from '@/core/payload/payload';

describe('wifi payloads', () => {
  it('builds the standard format', () => {
    expect(wifiPayload({ ssid: 'Treehouse', password: 'secret', security: 'WPA' })).toBe(
      'WIFI:T:WPA;S:Treehouse;P:secret;;',
    );
  });

  it('escapes special characters and round-trips', () => {
    const info = { ssid: 'My;Net:"1"', password: 'a\\b,c', security: 'WPA' as const, hidden: false };
    expect(parseWifi(wifiPayload(info))).toEqual(info);
  });

  it('omits the password for open networks', () => {
    expect(wifiPayload({ ssid: 'Cafe', password: 'x', security: 'nopass' })).toBe('WIFI:T:nopass;S:Cafe;;');
  });
});

describe('clues', () => {
  it('round-trips', () => {
    const clue = { number: 2, total: 5, text: 'Look under\nthe couch!' };
    expect(parseClue(cluePayload(clue))).toEqual(clue);
  });
});

describe('classify', () => {
  it('recognises each kind', () => {
    expect(classify('https://example.com')).toBe('web');
    expect(classify('WIFI:T:WPA;S:x;P:y;;')).toBe('wifi');
    expect(classify(cluePayload({ number: 1, total: 1, text: 'hi' }))).toBe('clue');
    expect(classify('hello')).toBe('text');
    expect(classify('javascript:alert(1)')).toBe('text');
  });

  it('normalises bare domains', () => {
    expect(normaliseUrl('example.com')).toBe('https://example.com');
    expect(normaliseUrl('http://a.b')).toBe('http://a.b');
  });
});
