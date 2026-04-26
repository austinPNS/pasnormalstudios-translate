'use client';

import type { Tweaks } from '@/lib/types';
import { IcSliders } from './icons';

interface Props {
  tweaks: Tweaks;
  setTweaks: (updater: (t: Tweaks) => Tweaks) => void;
  active: boolean;
}

export const TweaksPanel = ({ tweaks, setTweaks, active }: Props) => {
  if (!active) return null;
  const set = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) =>
    setTweaks((s) => ({ ...s, [k]: v }));

  return (
    <div className="tweaks-panel">
      <div className="hd">
        <IcSliders size={14} />
        <span>Tweaks</span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--mono)',
            fontSize: 10.5,
            color: 'var(--ink-4)',
          }}
        >
          4 options
        </span>
      </div>
      <div className="bd">
        <div className="tweak-row">
          <div className="lbl">Documents layout</div>
          <div className="seg">
            {(['matrix', 'list', 'kanban'] as const).map((v) => (
              <button
                key={v}
                className={tweaks.layout === v ? 'on' : ''}
                onClick={() => set('layout', v)}
                style={{ textTransform: 'capitalize' }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="lbl">Viewer diff mode</div>
          <div className="seg">
            {([
              ['side', 'Side'],
              ['diff', 'Diff'],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                className={tweaks.diffMode === v ? 'on' : ''}
                onClick={() => set('diffMode', v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="lbl">Navigation</div>
          <div className="seg">
            {([
              ['sidebar', 'Sidebar'],
              ['topbar', 'Top tabs'],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                className={tweaks.nav === v ? 'on' : ''}
                onClick={() => set('nav', v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="lbl">Density</div>
          <div className="seg">
            {([
              ['compact', 'Compact'],
              ['comfortable', 'Comfortable'],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                className={tweaks.density === v ? 'on' : ''}
                onClick={() => set('density', v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
