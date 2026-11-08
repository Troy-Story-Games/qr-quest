import { useMemo } from 'react';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { GameIcon } from '@/components/GameIcon';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { QrView } from '@/components/qr/QrView';
import { cluePayload } from '@/core/payload/payload';
import { encode } from '@/core/qr';
import { useHunt } from '@/game/huntStore';
import { useProgress } from '@/game/progressStore';
import styles from './TreasureHuntScreen.module.css';

const MAX_CLUES = 10;
const printed = new Set<string>();

export function TreasureHuntScreen() {
  const { draft, setDraft, resetFound, foundOf } = useHunt();
  const { addXp, bumpStat } = useProgress();
  const clues = draft.filter((c) => c.trim());
  const total = clues.length;

  // Keyed on the clue text so unrelated re-renders don't re-encode every code.
  const cluesKey = JSON.stringify(clues);
  const codes = useMemo(() => {
    const list: string[] = JSON.parse(cluesKey);
    return list.map((text, i) =>
      encode(cluePayload({ number: i + 1, total: list.length, text: text.trim() }), { ecc: 'Q' }),
    );
  }, [cluesKey]);

  const update = (i: number, value: string) => setDraft(draft.map((d, j) => (j === i ? value : d)));
  const remove = (i: number) => setDraft(draft.filter((_, j) => j !== i));

  const print = () => {
    const key = clues.join('|');
    if (!printed.has(key)) {
      printed.add(key);
      bumpStat('huntsMade');
      addXp(30, 'Made a treasure hunt!');
    }
    resetFound();
    setTimeout(() => window.print(), 100);
  };

  return (
    <Page title="Treasure Hunt" emoji="1f5fa" wide>
      <div className="no-print">
        <Mascot
          pose="show"
          says="Each clue says where the NEXT code is hiding. Print the codes, hide them around the house, and give the first one to a friend. They scan each code with the Scanner to find the next!"
          size={96}
        />

        <Panel className={styles.editor}>
          <h2>Write your clues</h2>
          <ol className={styles.list}>
            {draft.map((clue, i) => (
              <li key={i}>
                <span className={styles.number}>{i + 1}</span>
                <input
                  type="text"
                  value={clue}
                  maxLength={120}
                  placeholder="Where is the next code hiding?"
                  onChange={(e) => update(i, e.target.value)}
                />
                <KidButton
                  size="icon"
                  variant="danger"
                  aria-label={`Remove clue ${i + 1}`}
                  onClick={() => remove(i)}
                  disabled={draft.length <= 1}
                >
                  <GameIcon name="trashcan" />
                </KidButton>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <KidButton
              variant="secondary"
              onClick={() => setDraft([...draft, ''])}
              disabled={draft.length >= MAX_CLUES}
            >
              + Add a clue
            </KidButton>
            <KidButton variant="good" size="lg" onClick={print} disabled={total === 0}>
              <Emoji code="1f5a8" /> Print the hunt!
            </KidButton>
            <KidButton onClick={() => navigate('scan')}>
              <Emoji code="1f4f7" /> Go scan
            </KidButton>
          </div>
          {total > 0 && (
            <p className={styles.progress}>
              Found so far: {foundOf(total)} of {total}
            </p>
          )}
        </Panel>
      </div>

      <div className={styles.sheet}>
        {codes.map((build, i) => (
          <div key={i} className={styles.card}>
            <QrView modules={build.modules} quietZone={3} label={`Clue ${i + 1}`} />
            <strong>
              <Emoji code="1f5fa" /> Clue {i + 1}
            </strong>
          </div>
        ))}
      </div>
    </Page>
  );
}
