/** Every third-party asset in the app. Keep in sync with CREDITS.md. */
export interface Credit {
  what: string;
  author: string;
  license: string;
  url: string;
}

export const CREDITS: Credit[] = [
  {
    what: 'Robot mascot (Toon Characters 1)',
    author: 'Kenney',
    license: 'CC0 1.0',
    url: 'https://kenney.nl/assets/toon-characters-1',
  },
  { what: 'Game icons', author: 'Kenney', license: 'CC0 1.0', url: 'https://kenney.nl/assets/game-icons' },
  {
    what: 'Interface sounds',
    author: 'Kenney',
    license: 'CC0 1.0',
    url: 'https://kenney.nl/assets/interface-sounds',
  },
  {
    what: 'Digital audio',
    author: 'Kenney',
    license: 'CC0 1.0',
    url: 'https://kenney.nl/assets/digital-audio',
  },
  {
    what: 'Music jingles',
    author: 'Kenney',
    license: 'CC0 1.0',
    url: 'https://kenney.nl/assets/music-jingles',
  },
  {
    what: 'Fredoka font',
    author: 'Milena Brandão',
    license: 'SIL Open Font License 1.1',
    url: 'https://github.com/hafontia-zz/Fredoka-One',
  },
  {
    what: 'Emoji pictures (Twemoji)',
    author: 'Twitter, Inc. and contributors',
    license: 'CC-BY 4.0',
    url: 'https://github.com/jdecked/twemoji',
  },
];
