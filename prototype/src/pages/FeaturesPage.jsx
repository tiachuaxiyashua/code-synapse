import { ChevronDown, ChevronRight, ExternalLink, GitFork, Info, Search, TreePine } from 'lucide-react';
import { featureTrees } from '../model';

function findFeature(root, id) {
  if (root.id === id) return root;
  return root.children?.find((child) => child.id === id) || root;
}

export default function FeaturesPage({ variant, scope, setScope }) {
  const tree = featureTrees[variant];
  const selected = findFeature(tree, scope);
  const query = new URLSearchParams({ variant, scope: selected.id }).toString();

  return (
    <div className="page split-page">
      <aside className="tree-rail">
        <div className="rail-heading">
          <TreePine size={18} />
          <div><strong>功能树</strong><small>AI 建议 · 可由用户修正</small></div>
        </div>
        <label className="tree-search"><Search size={14} /><input placeholder="查找功能" /></label>
        <div className="tree-list">
          <button className={scope === tree.id ? 'selected' : ''} onClick={() => setScope(tree.id)}>
            <ChevronDown size={15} /><span><strong>{tree.label}</strong><small>根能力 · {tree.children.length} 个子功能</small></span>
          </button>
          <div className="tree-children">
            {tree.children.map((child) => (
              <button key={child.id} className={scope === child.id ? 'selected' : ''} onClick={() => setScope(child.id)}>
                <ChevronRight size={14} /><span><strong>{child.label}</strong><small>{child.kind}</small></span>
              </button>
            ))}
          </div>
        </div>
        <div className="coverage-note"><Info size={14} /><span>当前树由 AI 根据代码图生成，7 项证据已确认，2 项仍是推测。</span></div>
      </aside>

      <section className="feature-detail">
        <div className="detail-header">
          <div>
            <p className="eyeline">功能 · {selected.kind}</p>
            <h1>{selected.label}</h1>
            <p>{selected.summary}</p>
          </div>
          <div className="header-actions">
            <a className="button primary" href={`/flow?${query}`} target="_blank" rel="noreferrer"><GitFork size={15} />打开流程图<ExternalLink size={13} /></a>
            <a className="button" href={`/code?${query}`} target="_blank" rel="noreferrer">查看实现<ExternalLink size={13} /></a>
          </div>
        </div>

        <div className="feature-metadata">
          <div><span>触发</span><strong>{variant === 'B' ? 'OrderPlaced event' : variant === 'C' ? 'POST /api/login' : 'audio frame tick'}</strong></div>
          <div><span>输出</span><strong>{variant === 'B' ? '履约状态变化' : variant === 'C' ? 'Session' : 'Audio / Pitch stream'}</strong></div>
          <div><span>实现覆盖</span><strong>12 symbols · 4 modules</strong></div>
          <div><span>可信度</span><strong className="confidence">高 · 8 条证据</strong></div>
        </div>

        <div className="feature-sections">
          <section>
            <h2>功能链</h2>
            <ol className="chain-list">
              {(selected.children || tree.children).map((item, index) => (
                <li key={item.id} onClick={() => setScope(item.id)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div><strong>{item.label}</strong><small>{item.summary}</small></div>
                  <ChevronRight size={16} />
                </li>
              ))}
              {!selected.children && (
                <>
                  <li><span>01</span><div><strong>进入功能</strong><small>从所属流程定位入口和输入。</small></div></li>
                  <li><span>02</span><div><strong>执行实现</strong><small>查看子流程、函数和数据交换。</small></div></li>
                  <li><span>03</span><div><strong>产生结果</strong><small>输出、状态变化和失败行为。</small></div></li>
                </>
              )}
            </ol>
          </section>
          <section>
            <h2>实现映射</h2>
            <div className="mapping-table">
              <div><span>模块</span><strong>src/{selected.id}/</strong><small>静态事实</small></div>
              <div><span>入口</span><strong>{selected.id}.start</strong><small>框架适配器</small></div>
              <div><span>数据</span><strong>{variant === 'A' ? 'AudioFrame / PitchFrame' : variant === 'B' ? 'OrderEvent' : 'LoginRequest / Session'}</strong><small>类型系统</small></div>
              <div><span>测试</span><strong>tests/{selected.id}.spec</strong><small>代码引用</small></div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
