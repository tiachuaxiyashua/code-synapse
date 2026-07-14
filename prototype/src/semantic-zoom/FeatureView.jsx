import { ChevronRight, ExternalLink } from 'lucide-react';

function openFlow(semanticId, onSelect) {
  onSelect(semanticId);
  const url = `/semantic-zoom.html?view=flow&selected=${encodeURIComponent(semanticId)}`;
  const flow = window.open(url, 'code-synapse-flow');
  flow?.focus();
}

export default function FeatureView({ model, selectedId, onSelect }) {
  const root = model.objects[model.featureTree[0]];
  const children = model.featureTree.slice(1).map((id) => model.objects[id]);

  return (
    <main className="feature-workspace">
      <section className="feature-rail" aria-label="功能树">
        <div className="feature-title-row">
          <div>
            <h1>代码功能</h1>
            <p>bulletproof-nodejs / auth</p>
          </div>
        </div>
        <div className="feature-tree">
          <button
            type="button"
            className={selectedId === root.id ? 'feature-root selected' : 'feature-root'}
            aria-pressed={selectedId === root.id}
            onClick={() => openFlow(root.id, onSelect)}
          >
            <span className="tree-caret">▾</span>
            <span><strong>{root.label}</strong><small>{root.purpose}</small></span>
          </button>
          <div className="feature-children">
            {children.map((item) => (
              <button
                type="button"
                key={item.id}
                className={selectedId === item.id ? 'feature-item selected' : 'feature-item'}
                aria-pressed={selectedId === item.id}
                aria-label={`${item.label}：${item.purpose}`}
                onClick={() => openFlow(item.id, onSelect)}
              >
                <span className="tree-branch" />
                <span><strong>{item.label}</strong><small>{item.purpose}</small></span>
                <ExternalLink size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="feature-inspection" aria-live="polite">
        <div className="feature-inspection-inner">
          <p className="section-label">当前能力</p>
          <h2>{model.objects[selectedId]?.label || root.label}</h2>
          <p className="feature-purpose">{model.objects[selectedId]?.purpose || root.purpose}</p>
          <dl className="feature-facts">
            <div><dt>作用</dt><dd>{model.objects[selectedId]?.why || root.why}</dd></div>
            <div><dt>直接子功能</dt><dd>{children.filter((item) => item.parentId === selectedId).length || '实现流程中展开'}</dd></div>
            <div><dt>证据</dt><dd>{model.objects[selectedId]?.evidenceIds.length || root.evidenceIds.length} 条</dd></div>
          </dl>
          <button type="button" className="primary-command" onClick={() => openFlow(selectedId, onSelect)}>
            查看流程 <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}
