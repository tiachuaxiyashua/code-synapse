import { useEffect, useMemo, useRef, useState } from 'react';
import { Code2, X } from 'lucide-react';

import { panCamera, zoomAroundPoint } from './camera';
import { placePopover } from './popover';
import { activeProjection, visibleSelection } from './projection';

const BAND_LABELS = { Z0: '概览 Z0', Z1: '领域步骤 Z1', Z2: '实现细节 Z2' };

function isDescendant(objects, objectId, ancestorId) {
  let current = objects[objectId];
  while (current) {
    if (current.id === ancestorId) return true;
    current = current.parentId ? objects[current.parentId] : null;
  }
  return false;
}

function boundsFor(nodes) {
  if (!nodes.length) return null;
  const left = Math.min(...nodes.map((node) => node.x));
  const top = Math.min(...nodes.map((node) => node.y));
  const right = Math.max(...nodes.map((node) => node.x + node.width));
  const bottom = Math.max(...nodes.map((node) => node.y + node.height));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function normalizationFor(model, band) {
  const z0 = boundsFor(model.flow.bands.Z0.nodes);
  const current = boundsFor(model.flow.bands[band].nodes);
  return current && z0 ? Math.max(1, current.width / z0.width) : 1;
}

function semanticRegions(model, projection, band) {
  if (band === 'Z0') return [];
  return ['signup', 'signin'].map((semanticId) => {
    const nodes = projection.nodes.filter((node) => isDescendant(model.objects, node.semanticId, semanticId));
    const bounds = boundsFor(nodes);
    return bounds ? { semanticId, ...bounds } : null;
  }).filter(Boolean);
}

function edgePath(edge, nodesById) {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  const start = { x: source.x + source.width, y: source.y + source.height / 2 };
  const end = { x: target.x, y: target.y + target.height / 2 };
  const bend = start.x + Math.max(48, (end.x - start.x) / 2);
  return {
    d: `M ${start.x} ${start.y} C ${bend} ${start.y}, ${bend} ${end.y}, ${end.x} ${end.y}`,
    label: { x: (start.x + end.x) / 2 - 85, y: (start.y + end.y) / 2 - 16 },
  };
}

function wrapLabel(label, max = 16) {
  if (label.length <= max) return [label];
  return [label.slice(0, max), label.slice(max, max * 2)];
}

function ProcessNode({ node, object, selected, onHover, onLeave, onPin }) {
  const lines = wrapLabel(object.label);
  const common = {
    role: 'button',
    tabIndex: 0,
    'aria-label': object.label,
    'aria-pressed': selected,
    className: `semantic-node kind-${object.kind}${selected ? ' selected' : ''}`,
    onPointerEnter: (event) => onHover(event, { type: 'node', object, node }),
    onPointerMove: (event) => onHover(event, { type: 'node', object, node }),
    onPointerLeave: onLeave,
    onClick: (event) => { event.stopPropagation(); onPin(event, { type: 'node', object, node }); },
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') onPin(event, { type: 'node', object, node });
    },
  };

  return (
    <g {...common} transform={`translate(${node.x} ${node.y})`}>
      {object.kind === 'decision' ? (
        <polygon points={`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`} />
      ) : object.kind === 'result' ? (
        <rect width={node.width} height={node.height} rx="22" />
      ) : object.kind === 'event' ? (
        <rect width={node.width} height={node.height} rx="2" className="event-shape" />
      ) : (
        <rect width={node.width} height={node.height} rx="5" />
      )}
      <text x={node.width / 2} y={node.height / 2 - (lines.length - 1) * 9} textAnchor="middle">
        {lines.map((line, index) => <tspan key={line} x={node.width / 2} dy={index === 0 ? 0 : 20}>{line}</tspan>)}
      </text>
    </g>
  );
}

function SourceDrawer({ inspectable, evidenceById, onClose }) {
  if (!inspectable) return null;
  const ids = inspectable.type === 'node' ? inspectable.object.evidenceIds : inspectable.edge.evidenceIds;
  const evidence = ids.map((id) => evidenceById.get(id)).filter(Boolean);
  const title = inspectable.type === 'node' ? inspectable.object.label : inspectable.edge.label;
  return (
    <aside className="source-drawer" role="complementary" aria-label="源码证据">
      <header>
        <div><span>源码证据</span><strong>{title}</strong></div>
        <button type="button" className="icon-command" aria-label="关闭源码证据" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="source-scroll">
        {evidence.map((item) => (
          <section className="source-record" key={item.id}>
            <div className="source-location">
              <code>{item.path}:{item.startLine}{item.endLine !== item.startLine ? `-${item.endLine}` : ''}</code>
              <span>{item.kind === 'codegraph-relation' ? '结构关系' : '源码'}</span>
            </div>
            <pre>{item.excerpt || '结构关系没有独立源码片段'}</pre>
          </section>
        ))}
      </div>
    </aside>
  );
}

export default function FlowView({ artifact, selectedId, onSelect }) {
  const { model, evidence } = artifact;
  const canvasRef = useRef(null);
  const panRef = useRef(null);
  const selectionRef = useRef(selectedId);
  const [camera, setCamera] = useState({ x: 24, y: 24, scale: 1, band: 'Z0' });
  const [isPanning, setIsPanning] = useState(false);
  const [popover, setPopover] = useState(null);
  const [inspectable, setInspectable] = useState(null);
  const projection = activeProjection(model, camera.band);
  const normalization = normalizationFor(model, camera.band);
  const visibleId = visibleSelection(model, camera.band, selectedId);
  const nodesById = useMemo(() => new Map(projection.nodes.map((node) => [node.id, node])), [projection.nodes]);
  const evidenceById = useMemo(() => new Map(evidence.map((item) => [item.id, item])), [evidence]);
  const regions = semanticRegions(model, projection, camera.band);
  selectionRef.current = selectedId;

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setPopover(null);
    };
    const closeOutside = (event) => {
      if (!event.target.closest?.('.semantic-popover, .semantic-node, .semantic-edge')) setPopover(null);
    };
    window.addEventListener('keydown', closeWithEscape);
    window.addEventListener('pointerdown', closeOutside);
    return () => {
      window.removeEventListener('keydown', closeWithEscape);
      window.removeEventListener('pointerdown', closeOutside);
    };
  }, []);

  const focusSelection = (next, semanticId, viewport) => {
    const nodes = next.band === 'Z0'
      ? model.flow.bands[next.band].nodes.filter((node) => node.semanticId === semanticId)
      : model.flow.bands[next.band].nodes.filter((node) => isDescendant(model.objects, node.semanticId, semanticId));
    const bounds = boundsFor(nodes);
    if (!bounds) return next;
    const norm = normalizationFor(model, next.band);
    return {
      ...next,
      x: viewport.width / 2 - ((bounds.left + bounds.right) / 2 / norm) * next.scale,
      y: viewport.height / 2 - ((bounds.top + bounds.bottom) / 2 / norm) * next.scale,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setCamera((current) => {
        const next = zoomAroundPoint(current, point, current.scale * Math.exp(-event.deltaY * 0.0015));
        return next.band === current.band ? next : focusSelection(next, selectionRef.current, rect);
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event) => {
    if (event.button !== 1) {
      if (event.target === event.currentTarget) setPopover(null);
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setIsPanning(true);
  };

  const onPointerMove = (event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    const delta = { x: event.clientX - pan.x, y: event.clientY - pan.y };
    panRef.current = { ...pan, x: event.clientX, y: event.clientY };
    setCamera((current) => panCamera(current, delta));
  };

  const stopPan = (event) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const showPopover = (event, item) => {
    if (popover?.pinned) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    setPopover({ item, pinned: false, position: placePopover({ x: event.clientX, y: event.clientY }, { width: 310, height: 230 }, viewport) });
  };

  const pinPopover = (event, item) => {
    const semanticId = item.type === 'node' ? item.object.id : selectedId;
    onSelect(semanticId);
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    setPopover({ item, pinned: true, position: placePopover({ x: event.clientX || 480, y: event.clientY || 280 }, { width: 310, height: 230 }, viewport) });
  };

  const popoverObject = popover?.item.type === 'node' ? popover.item.object : null;
  const popoverEdge = popover?.item.type === 'edge' ? popover.item.edge : null;

  return (
    <main className={inspectable ? 'flow-workspace drawer-open' : 'flow-workspace'}>
      <section className="flow-main">
        <div className="flow-toolbar">
          <div><span className="section-label">行为流程</span><h1>身份认证流程</h1></div>
          <div className="flow-selection"><span>当前范围</span><strong>{model.objects[selectedId]?.label || '身份认证'}</strong></div>
          <div className="band-status"><strong>{BAND_LABELS[camera.band]}</strong><span>{camera.scale.toFixed(2)}×</span></div>
        </div>
        <div
          ref={canvasRef}
          className={isPanning ? 'semantic-canvas panning' : 'semantic-canvas'}
          data-testid="semantic-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopPan}
          onPointerCancel={stopPan}
          onAuxClick={(event) => event.preventDefault()}
        >
          <svg width="100%" height="100%" aria-label={`身份认证流程 ${BAND_LABELS[camera.band]}`}>
            <defs>
              <marker id="arrow-control" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
              <marker id="arrow-data" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
              <marker id="arrow-event" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
            </defs>
            <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale / normalization})`}>
              {regions.map((region) => {
                const object = model.objects[region.semanticId];
                return (
                  <g
                    key={region.semanticId}
                    className={isDescendant(model.objects, selectedId, region.semanticId) ? 'semantic-region selected' : 'semantic-region'}
                    role="button"
                    tabIndex="0"
                    aria-label={`${object.label} 区域`}
                    aria-pressed={isDescendant(model.objects, selectedId, region.semanticId)}
                    onClick={() => onSelect(region.semanticId)}
                  >
                    <rect x={region.left - 36} y={region.top - 54} width={region.width + 72} height={region.height + 90} rx="6" />
                    <text x={region.left - 16} y={region.top - 24}>{object.label}</text>
                  </g>
                );
              })}
              {projection.edges.map((edge) => {
                const pathData = edgePath(edge, nodesById);
                const item = { type: 'edge', edge };
                return (
                  <g
                    key={edge.id}
                    className={`semantic-edge edge-${edge.kind}`}
                    role="button"
                    tabIndex="0"
                    aria-label={`${edge.label} 关系`}
                    onPointerEnter={(event) => showPopover(event, item)}
                    onPointerMove={(event) => showPopover(event, item)}
                    onPointerLeave={() => { if (!popover?.pinned) setPopover(null); }}
                    onClick={(event) => { event.stopPropagation(); pinPopover(event, item); }}
                  >
                    <path className="edge-hit" d={pathData.d} />
                    <path className="edge-visible" d={pathData.d} markerEnd={`url(#arrow-${edge.kind})`} />
                    <foreignObject x={pathData.label.x - 20} y={pathData.label.y} width="210" height="46" pointerEvents="none">
                      <div className="edge-label">{edge.label}</div>
                    </foreignObject>
                  </g>
                );
              })}
              {projection.nodes.map((node) => (
                <ProcessNode
                  key={node.id}
                  node={node}
                  object={model.objects[node.semanticId]}
                  selected={node.id === visibleId}
                  onHover={showPopover}
                  onLeave={() => { if (!popover?.pinned) setPopover(null); }}
                  onPin={pinPopover}
                />
              ))}
            </g>
          </svg>
          {popover ? (
            <div
              className={popover.pinned ? 'semantic-popover pinned' : 'semantic-popover'}
              role="tooltip"
              style={{ left: popover.position.left, top: popover.position.top }}
            >
              <div className="popover-heading"><span>{popoverObject?.kind || popoverEdge?.kind}</span><strong>{popoverObject?.label || popoverEdge?.label}</strong></div>
              <p>{popoverObject?.purpose || popoverEdge?.result || '连接流程中的两个步骤。'}</p>
              {popoverObject ? <dl><div><dt>为什么</dt><dd>{popoverObject.why}</dd></div><div><dt>输入</dt><dd>{popoverObject.input || '无显式输入'}</dd></div><div><dt>输出</dt><dd>{popoverObject.output || '继续控制流'}</dd></div></dl> : null}
              {popoverEdge?.condition ? <dl><div><dt>条件</dt><dd>{popoverEdge.condition}</dd></div><div><dt>结果</dt><dd>{popoverEdge.result}</dd></div></dl> : null}
              <div className="popover-footer"><span>{(popoverObject?.evidenceIds || popoverEdge?.evidenceIds).length} 条证据</span><button type="button" onClick={() => { setInspectable(popover.item); setPopover(null); }}><Code2 size={15} />查看实现</button></div>
            </div>
          ) : null}
        </div>
      </section>
      <SourceDrawer inspectable={inspectable} evidenceById={evidenceById} onClose={() => setInspectable(null)} />
    </main>
  );
}
