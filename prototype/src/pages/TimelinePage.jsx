import { ChevronDown, Clock3, Crosshair, Link2, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react';
import { timelineRows, variants } from '../model';

const flows = {
  A: [[1, 58, 2, 40], [2, 72, 3, 76]],
  B: [[0, 22, 1, 33], [1, 44, 2, 56], [1, 44, 3, 56], [3, 78, 4, 86]],
  C: [[0, 18, 1, 25], [1, 35, 2, 48], [2, 55, 3, 38], [2, 70, 4, 68]],
};

export default function TimelinePage({ variant, setScope }) {
  const rows = timelineRows[variant];
  return (
    <div className="page timeline-page">
      <header className="timeline-toolbar">
        <div>
          <p className="eyeline">独立网页 · Runtime projection</p>
          <h1>{variants[variant].label} · 真实运行时间轴</h1>
        </div>
        <div className="timeline-controls">
          <button className="icon-button" title="暂停"><Pause size={16} /></button>
          <button className="icon-button" title="播放"><Play size={16} /></button>
          <button className="icon-button" title="缩小"><ZoomOut size={16} /></button>
          <button className="icon-button" title="放大"><ZoomIn size={16} /></button>
          <button className="icon-text"><Crosshair size={15} />适合窗口</button>
        </div>
      </header>
      <div className="timeline-meta">
        <span><Clock3 size={14} />Trace #42 · monotonic clock</span>
        <span>范围 0–10ms</span>
        <span>观察证据 · 模拟</span>
        <button><ChevronDown size={14} />过滤 Tracks</button>
      </div>
      <div className="timeline-shell">
        <div className="time-axis">
          <span />
          {Array.from({ length: 11 }, (_, i) => <b key={i}>{i}ms</b>)}
        </div>
        <div className="timeline-body">
          <svg className="flow-overlay" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="flow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill="#7c3aed" />
              </marker>
            </defs>
            {flows[variant].map(([fromRow, fromX, toRow, toX], index) => {
              const y1 = fromRow * 82 + 52;
              const y2 = toRow * 82 + 52;
              return <path key={index} d={`M ${fromX * 10} ${y1} C ${fromX * 10 + 35} ${y1}, ${toX * 10 - 35} ${y2}, ${toX * 10} ${y2}`} markerEnd="url(#flow-arrow)" />;
            })}
          </svg>
          {rows.map((row) => (
            <div className="timeline-row" key={row.id}>
              <div className="track-label"><strong>{row.label}</strong><small>{row.counter ? 'counter' : 'thread / task'}</small></div>
              <div className="track">
                {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ left: `${i * 10}%` }} />)}
                {row.slices?.map((slice) => (
                  <button
                    key={slice.id}
                    className={`time-slice tone-${slice.tone || 'normal'}`}
                    style={{ left: `${slice.start * 10}%`, width: `${Math.max(1.2, (slice.end - slice.start) * 10)}%` }}
                    onClick={() => slice.scope && setScope(slice.scope)}
                    title={`${slice.label} · ${slice.start}–${slice.end}ms`}
                  >
                    {slice.label}
                  </button>
                ))}
                {row.counter && (
                  <svg className="counter-line" viewBox="0 0 700 56" preserveAspectRatio="none">
                    <polyline points={row.counter.map((value, index) => `${index * 100},${52 - value / 2}`).join(' ')} />
                  </svg>
                )}
              </div>
            </div>
          ))}
          <div className="deadline" style={{ left: 'calc(150px + 83.3%)' }}><span>Deadline 8.33ms</span></div>
        </div>
      </div>
      <footer className="timeline-footer">
        <span><Link2 size={14} />紫色箭头是跨 Track 因果 Flow，不是装饰线</span>
        <span>点击 Slice 会向其他独立页面广播 Scope</span>
      </footer>
    </div>
  );
}
