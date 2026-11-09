import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Modal } from '@/components/Modal';
import { Page } from '@/components/Page';
import { downloadPng } from '@/components/qr/qrExport';
import { StyledQr } from '@/components/qr/StyledQr';
import { SpeakButton } from '@/components/SpeakButton';
import { parseClue, parseWifi } from '@/core/payload/payload';
import { encode, type QRBuild } from '@/core/qr';
import { useMyCodes, type SavedCode } from '@/game/myCodes';
import styles from './MyCodesScreen.module.css';

function buildOf(code: SavedCode): QRBuild | null {
  try {
    return encode(code.text, { ecc: code.ecc });
  } catch {
    return null;
  }
}

/** What the code says, in words a kid can read (WiFi codes are full of symbols). */
function describe(text: string): string {
  const wifi = parseWifi(text);
  if (wifi) return `WiFi: ${wifi.ssid}`;
  const clue = parseClue(text);
  if (clue) return `Clue ${clue.number}: ${clue.text}`;
  return text;
}

function fileName(code: SavedCode): string {
  const slug = code.text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `qr-${slug || 'code'}`;
}

/** Every code the kid has made, to view, save as a picture or print. */
export function MyCodesScreen() {
  const codes = useMyCodes((s) => s.codes);
  const remove = useMyCodes((s) => s.remove);
  const builds = useMemo(() => new Map(codes.map((c) => [c.id, buildOf(c)])), [codes]);
  const [viewing, setViewing] = useState<SavedCode | null>(null);
  const [deleting, setDeleting] = useState<SavedCode | null>(null);
  const [printing, setPrinting] = useState<SavedCode | null>(null);
  const svgs = useRef(new Map<string, SVGSVGElement>());
  const viewSvg = useRef<SVGSVGElement>(null);

  const print = (code: SavedCode) => {
    // Render the print-only copy before the print dialog takes its snapshot.
    flushSync(() => setPrinting(code));
    window.print();
  };

  const save = (code: SavedCode, svg: SVGSVGElement | null | undefined) => {
    if (svg) void downloadPng(svg, fileName(code));
  };

  const printBuild = printing ? builds.get(printing.id) : null;
  const viewBuild = viewing ? builds.get(viewing.id) : null;

  return (
    <>
      <div className="no-print">
        <Page title="My Codes" emoji="1f5c2" wide>
          {codes.length === 0 ? (
            <>
              <Mascot
                pose="think"
                says="You haven't made any codes yet! Make one and press Make it, and it will appear here."
              />
              <KidButton size="lg" onClick={() => navigate('make')} style={{ marginTop: 16 }}>
                <Emoji code="1f4dd" /> Make a code
              </KidButton>
            </>
          ) : (
            <>
              <Mascot
                pose="show"
                says={`You have made ${codes.length} code${codes.length === 1 ? '' : 's'}! Tap one to see it big.`}
                size={90}
              />
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Message</th>
                    <th>Made</th>
                    <th>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const build = builds.get(code.id);
                    if (!build) return null;
                    return (
                      <tr key={code.id}>
                        <td>
                          <button
                            className={styles.thumb}
                            onClick={() => setViewing(code)}
                            aria-label={`View ${code.text}`}
                          >
                            <StyledQr
                              ref={(el) => {
                                if (el) svgs.current.set(code.id, el);
                                else svgs.current.delete(code.id);
                              }}
                              build={build}
                              style={code.style}
                            />
                          </button>
                        </td>
                        <td className={styles.message}>
                          {describe(code.text)}
                          {code.style && (
                            <span className={styles.fancy}>
                              <Emoji code="1f3a8" size={16} /> Decorated
                            </span>
                          )}
                        </td>
                        <td className={styles.date}>{new Date(code.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <KidButton variant="secondary" onClick={() => setViewing(code)}>
                              View
                            </KidButton>
                            <KidButton
                              variant="secondary"
                              onClick={() => save(code, svgs.current.get(code.id))}
                            >
                              Save picture
                            </KidButton>
                            <KidButton variant="secondary" onClick={() => print(code)}>
                              <Emoji code="1f5a8" /> Print
                            </KidButton>
                            <KidButton
                              size="icon"
                              variant="secondary"
                              aria-label={`Delete ${code.text}`}
                              onClick={() => setDeleting(code)}
                            >
                              <Emoji code="1f5d1" />
                            </KidButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </Page>
      </div>

      <Modal open={viewing !== null} onClose={() => setViewing(null)} label="Your code">
        {viewing && viewBuild && (
          <>
            <StyledQr ref={viewSvg} build={viewBuild} style={viewing.style} className={styles.big} />
            <p className={styles.bigText}>
              {describe(viewing.text)} <SpeakButton text={describe(viewing.text)} />
            </p>
            <div className={styles.modalActions}>
              <KidButton variant="secondary" onClick={() => save(viewing, viewSvg.current)}>
                Save picture
              </KidButton>
              <KidButton variant="secondary" onClick={() => print(viewing)}>
                <Emoji code="1f5a8" /> Print
              </KidButton>
              <KidButton variant="good" onClick={() => setViewing(null)}>
                Done
              </KidButton>
            </div>
          </>
        )}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} label="Delete code">
        <h2>Delete this code?</h2>
        <p>"{deleting && describe(deleting.text)}" will be gone from My Codes.</p>
        <div className={styles.modalActions}>
          <KidButton variant="secondary" onClick={() => setDeleting(null)}>
            Keep it
          </KidButton>
          <KidButton
            variant="danger"
            onClick={() => {
              if (deleting) remove(deleting.id);
              setDeleting(null);
            }}
          >
            Delete
          </KidButton>
        </div>
      </Modal>

      {printing && printBuild && (
        <div className={`print-only ${styles.printArea}`}>
          <StyledQr build={printBuild} style={printing.style} className={styles.printCode} />
          <p>{describe(printing.text)}</p>
        </div>
      )}
    </>
  );
}
