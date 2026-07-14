import { Braces, CheckCircle2, ExternalLink, FileCode2, GitFork, Info, MessageSquareText } from 'lucide-react';
import { codeExamples, variants } from '../model';

export default function CodePage({ variant, scope }) {
  const example = codeExamples[variant];
  return (
    <div className="page code-page">
      <header className="page-header">
        <div>
          <p className="eyeline">独立网页 · Source evidence</p>
          <h1>{example.title}</h1>
          <p>{example.path}</p>
        </div>
        <a className="button" href={`/flow?variant=${variant}&scope=${scope}`} target="_blank" rel="noreferrer"><GitFork size={15} />在流程图定位<ExternalLink size={13} /></a>
      </header>
      <div className="code-workspace">
        <section className="code-editor">
          <div className="editor-toolbar"><FileCode2 size={15} /><span>{example.path}</span><strong>read-only prototype</strong></div>
          <pre>{example.code.split('\n').map((line, index) => <code key={index}><span>{index + 1}</span>{line || ' '}</code>)}</pre>
        </section>
        <aside className="code-inspector">
          <section>
            <h2>作用</h2>
            <p>{example.purpose}</p>
          </section>
          <section>
            <h2>建图标记</h2>
            <div className="evidence-list">
              <div><CheckCircle2 size={14} /><span>feature</span><strong>代码注释</strong></div>
              <div><CheckCircle2 size={14} /><span>input/output</span><strong>类型系统</strong></div>
              <div><Info size={14} /><span>purpose</span><strong>AI 建议</strong></div>
            </div>
          </section>
          <section>
            <h2>模型关系</h2>
            <div className="relationship-list">
              <button><Braces size={14} />调用 4 个函数</button>
              <button><GitFork size={14} />参与 2 条功能链</button>
              <button><MessageSquareText size={14} />7 条解释证据</button>
            </div>
          </section>
          <section className="annotation-warning">
            <strong>注释是提示，不是真相源</strong>
            <p>Skill 写入的标记会减少后续 AI 成本，但仍需与 AST、类型和运行轨迹交叉验证。</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
