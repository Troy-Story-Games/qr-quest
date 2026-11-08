import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useCurrentCode } from '@/app/currentCode';
import { navigate } from '@/app/router';
import { EccPicker } from '@/components/EccPicker';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { downloadPng } from '@/components/qr/qrExport';
import { QrView } from '@/components/qr/QrView';
import { useReveal } from '@/components/qr/useReveal';
import { encode, numDataCodewords, QRCapacityError, type QRBuild } from '@/core/qr';
import { holdCelebrationsFor } from '@/game/celebrations';
import { useProgress } from '@/game/progressStore';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';
import styles from './MakerScreen.module.css';
import { buildPayload, EMPTY_FIELDS, TEMPLATES, type TemplateFields, type TemplateId } from './templates';

const MODE_NAMES = { numeric: 'Numbers only', alphanumeric: 'CAPITALS & numbers', byte: 'Anything goes' };

/** Codes already rewarded this session, so retyping the same text doesn't farm XP. */
const rewarded = new Set<string>();

export function MakerScreen() {
  const { text: savedText, ecc, setText, setEcc } = useCurrentCode();
  const [template, setTemplate] = useState<TemplateId>('text');
  const [fields, setFields] = useState<TemplateFields>({ ...EMPTY_FIELDS, text: savedText });
  const [made, setMade] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const { addXp, bumpStat } = useProgress();

  const payload = buildPayload(template, fields);
  const result = useMemo((): { build?: QRBuild; error?: string } => {
    if (!payload) return {};
    try {
      return { build: encode(payload, { ecc }) };
    } catch (e) {
      return { error: e instanceof QRCapacityError ? e.message : 'Oops, something went wrong.' };
    }
  }, [payload, ecc]);
  const build = result.build;

  const { visible, rank } = useReveal(build ? build.size * build.size : 0, 900, made);
  const tip = TEMPLATES.find((t) => t.id === template)!.tip;
  const set = (patch: Partial<TemplateFields>) => setFields((f) => ({ ...f, ...patch }));

  const makeIt = () => {
    if (!build) return;
    setText(payload);
    setMade((n) => n + 1);
    playSound('powerup');
    setTimeout(() => {
      playSound('success');
      burstConfetti();
    }, 900);
    const key = `${payload}|${ecc}`;
    if (!rewarded.has(key)) {
      rewarded.add(key);
      // Let the code finish popping in before any badge appears.
      holdCelebrationsFor(1800);
      bumpStat('codesMade');
      if (template === 'wifi') bumpStat('wifiCodes');
      addXp(10, 'Made a code!');
    }
  };

  const fullness = build
    ? Math.min(
        1,
        build.stream.filter((b) => b.role !== 'padByte').length / (numDataCodewords(build.version, ecc) * 8),
      )
    : 0;

  return (
    <Page title="Make a Code" emoji="1f4dd" wide>
      <div className={styles.layout}>
        <div className={styles.form}>
          <div className={styles.tabs} role="tablist">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={template === t.id}
                className={`${styles.tab} ${template === t.id ? styles.activeTab : ''}`}
                onClick={() => {
                  playSound('toggle');
                  setTemplate(t.id);
                }}
              >
                <Emoji code={t.emoji} size={32} />
                {t.label}
              </button>
            ))}
          </div>

          <Panel>
            {template === 'text' && (
              <label className={styles.field}>
                <span>Your words</span>
                <textarea
                  value={fields.text}
                  onChange={(e) => set({ text: e.target.value })}
                  placeholder="Type something fun!"
                  maxLength={600}
                />
              </label>
            )}
            {template === 'web' && (
              <label className={styles.field}>
                <span>Website</span>
                <input
                  type="text"
                  inputMode="url"
                  value={fields.url}
                  onChange={(e) => set({ url: e.target.value })}
                  placeholder="example.com"
                  autoCapitalize="off"
                />
              </label>
            )}
            {template === 'wifi' && (
              <>
                <label className={styles.field}>
                  <span>WiFi name</span>
                  <input
                    type="text"
                    value={fields.ssid}
                    onChange={(e) => set({ ssid: e.target.value })}
                    placeholder="Treehouse"
                  />
                </label>
                <label className={styles.field}>
                  <span>Password (leave empty if there isn't one)</span>
                  <input
                    type="text"
                    value={fields.password}
                    onChange={(e) => set({ password: e.target.value })}
                    autoCapitalize="off"
                  />
                </label>
              </>
            )}
            {template === 'secret' && (
              <>
                <label className={styles.field}>
                  <span>Secret message</span>
                  <textarea
                    value={fields.secret}
                    onChange={(e) => set({ secret: e.target.value })}
                    placeholder="The cookies are hidden in the blue jar..."
                    maxLength={400}
                  />
                </label>
                <label className={styles.field}>
                  <span>From (your name)</span>
                  <input type="text" value={fields.from} onChange={(e) => set({ from: e.target.value })} />
                </label>
              </>
            )}

            <div className={styles.field}>
              <span>Backup dots (so it still works if it gets messy)</span>
              <EccPicker value={ecc} onChange={setEcc} />
            </div>
          </Panel>

          <Mascot pose="talk" says={result.error ?? tip} size={96} />
        </div>

        <div className={styles.preview}>
          <Panel tone="purple" className={styles.codeCard}>
            {build ? (
              <motion.div
                key={build.version}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={styles.code}
              >
                <QrView
                  ref={svgRef}
                  modules={build.modules}
                  quietZone={4}
                  fill={(x, y, dark) => (dark && rank[y * build.size + x] < visible ? '#1d1b2f' : null)}
                  label={`QR code for: ${payload}`}
                />
              </motion.div>
            ) : (
              <div className={styles.empty}>
                <Emoji code="1f4dd" size={80} />
                <p>Type something to make a code!</p>
              </div>
            )}

            {build && (
              <ul className={styles.facts}>
                <li>
                  <strong>
                    {build.size} × {build.size}
                  </strong>{' '}
                  dots (size {build.version})
                </li>
                <li>
                  <strong>{build.chars.length}</strong> letters · {MODE_NAMES[build.mode]}
                </li>
                <li className={styles.meter}>
                  <span>How full?</span>
                  <span className={styles.meterTrack}>
                    <motion.span className={styles.meterFill} animate={{ width: `${fullness * 100}%` }} />
                  </span>
                </li>
              </ul>
            )}
          </Panel>

          <div className={`${styles.actions} no-print`}>
            <KidButton size="lg" variant="good" disabled={!build} onClick={makeIt} sound={null}>
              <Emoji code="2b50" /> Make it!
            </KidButton>
            <KidButton
              variant="secondary"
              disabled={!build}
              onClick={() => svgRef.current && downloadPng(svgRef.current, 'my-qr-code')}
            >
              Save picture
            </KidButton>
            <KidButton variant="secondary" disabled={!build} onClick={() => window.print()}>
              <Emoji code="1f5a8" /> Print
            </KidButton>
          </div>
          <div className={`${styles.actions} no-print`}>
            <KidButton
              disabled={!build}
              onClick={() => {
                setText(payload);
                navigate('learn');
              }}
            >
              <Emoji code="1f393" /> How was it built?
            </KidButton>
            <KidButton
              disabled={!build}
              onClick={() => {
                setText(payload);
                navigate('decorate');
              }}
            >
              <Emoji code="1f3a8" /> Decorate it
            </KidButton>
            <KidButton
              disabled={!build}
              onClick={() => {
                setText(payload);
                navigate('scratch');
              }}
            >
              <Emoji code="1f9ea" /> Scratch test
            </KidButton>
          </div>
          <div className={`${styles.actions} no-print`}>
            <KidButton
              size="lg"
              variant="gold"
              disabled={!build}
              onClick={() => {
                setText(payload);
                navigate('handmade');
              }}
            >
              <Emoji code="1f9e9" /> Build it by hand!
            </KidButton>
          </div>
        </div>
      </div>
    </Page>
  );
}
