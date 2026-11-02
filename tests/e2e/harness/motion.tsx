// Motion harness: exercises the real Phase 6 infrastructure (provider, Reveal, hooks) in a real
// browser. Test fixture only — inline styles and sizes here are not site design values.

import { motion } from 'motion/react';
import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/tokens.css';
import '../../../src/styles/base.css';
import {
  MotionPreferenceProvider,
  useMotionPreference,
} from '../../../src/motion/MotionPreference.tsx';
import { Reveal, RevealScrollRoot } from '../../../src/motion/Reveal.tsx';
import { useMagnetic } from '../../../src/motion/hooks/useMagnetic.ts';
import { useScrollLinked } from '../../../src/motion/hooks/useScrollLinked.ts';
import { initMotion } from '../../../src/motion/preference.ts';

const spacer = { height: '150vh' };

function ScrollLinkedBox() {
  const ref = useRef<HTMLDivElement>(null);
  const y = useScrollLinked(ref, {
    offset: ['start end', 'end start'],
    output: [-12, 12],
    offValue: 0,
  });
  return (
    <div ref={ref} style={{ height: 200, overflow: 'hidden' }}>
      <motion.div data-testid="scroll-linked" style={{ y, height: 100 }}>
        Scroll-linked
      </motion.div>
    </div>
  );
}

function MagneticBox() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useMagnetic(ref);
  return (
    <motion.div
      ref={ref}
      data-testid="magnetic"
      style={{ x, y, width: 200, height: 100, margin: '0 auto', border: '1px solid' }}
    >
      Magnetic
    </motion.div>
  );
}

function Modal({ onClose }: { readonly onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      data-testid="modal-scroll"
      style={{
        position: 'fixed',
        inset: '80px 40px',
        overflowY: 'auto',
        background: '#101010',
        zIndex: 10,
      }}
    >
      <RevealScrollRoot rootRef={scrollRef}>
        <button type="button" data-testid="close-modal" onClick={onClose}>
          Close
        </button>
        <div style={{ height: 800 }} />
        <Reveal mode="modal" data-testid="modal-reveal">
          Modal block
        </Reveal>
        <div style={{ height: 800 }} />
      </RevealScrollRoot>
    </div>
  );
}

function Harness() {
  const { motionOn, toggleOwnerPreference } = useMotionPreference();
  const [open, setOpen] = useState(false);
  return (
    <main>
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 20, display: 'flex', gap: 8 }}>
        <span data-testid="state">{motionOn ? 'on' : 'off'}</span>
        <button type="button" data-testid="toggle" onClick={toggleOwnerPreference}>
          Toggle motion
        </button>
        <button type="button" data-testid="open-modal" onClick={() => setOpen(true)}>
          Open
        </button>
      </div>
      <MagneticBox />
      <div style={spacer} />
      <Reveal data-testid="page-reveal">Page block</Reveal>
      <div style={spacer} />
      <ScrollLinkedBox />
      <div style={spacer} />
      {open ? <Modal onClose={() => setOpen(false)} /> : null}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
initMotion();
createRoot(root).render(
  <StrictMode>
    <MotionPreferenceProvider>
      <Harness />
    </MotionPreferenceProvider>
  </StrictMode>,
);
