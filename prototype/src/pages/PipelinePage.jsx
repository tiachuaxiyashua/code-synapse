import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  CircleDotDashed,
  Database,
  FileJson2,
  GitBranch,
  Network,
  Play,
  Puzzle,
  Terminal,
} from 'lucide-react';

const Stage = ({ icon: Icon, title, detail, status = 'ready' }) => (
  <div className="pipeline-stage">
    <Icon size={18} />
    <div><strong>{title}</strong><small>{detail}</small></div>
    <span className={status}>{status === 'ready' ? <Check size={12} /> : <CircleDotDashed size={12} />}{status}</span>
  </div>
);

export default function PipelinePage() {
  return (
    <div className="page pipeline-page">
      <header className="page-header">
        <div>
          <p className="eyeline">原型架构 · Integration projection</p>
          <h1>多次建图与 Skill 管线</h1>
          <p>复用基础代码图，把 AI 用在功能语义和高层抽象上；最终产物保存为可增量更新的文件。</p>
        </div>
      </header>

      <section className="pipeline-section">
        <div className="section-number">01</div>
        <div className="pipeline-content">
          <h2>首次导入或无标记项目</h2>
          <div className="pipeline-row">
            <Stage icon={Network} title="GitNexus / CodeGraph" detail="符号、调用、导入、基础流程" />
            <ArrowRight size={18} />
            <Stage icon={Database} title="Normalize" detail="统一 Entity / Relation / Evidence" />
            <ArrowRight size={18} />
            <Stage icon={Bot} title="AI Pass 1" detail="函数作用、模块职责、术语标记" status="ai" />
            <ArrowRight size={18} />
            <Stage icon={GitBranch} title="AI Pass 2" detail="功能树、功能链、复合流程" status="ai" />
            <ArrowRight size={18} />
            <Stage icon={FileJson2} title=".code_synapse/" detail="版本化 JSONL / JSON 产物" />
          </div>
        </div>
      </section>

      <section className="pipeline-section">
        <div className="section-number">02</div>
        <div className="pipeline-content">
          <h2>AI 写代码时同步维护</h2>
          <div className="skill-grid">
            <div>
              <div className="skill-title"><Puzzle size={18} /><strong>code_synapse-author</strong><span>Codex / Claude Skill</span></div>
              <p>AI 创建或修改函数时，按规则写入最小语义标记，并运行局部更新脚本。</p>
              <pre>{`@code_synapse.feature pitch-correction
@code_synapse.purpose Correct microphone pitch
@code_synapse.input MicFrame + PitchFrame
@code_synapse.output CorrectedFrame`}</pre>
            </div>
            <div>
              <div className="skill-title"><Puzzle size={18} /><strong>code_synapse-bootstrap</strong><span>补全 Skill</span></div>
              <p>导入没有标记的仓库时，读取基础图并让 AI 批量建议注释；用户确认后写入源码或 sidecar。</p>
              <pre>{`scan missing annotations
→ propose purpose / feature / contracts
→ verify against graph and tests
→ apply comments or annotations.jsonl`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="pipeline-section">
        <div className="section-number">03</div>
        <div className="pipeline-content">
          <h2>调用方式</h2>
          <div className="command-grid">
            <div><Terminal size={17} /><strong>自动</strong><code>AI invokes skill hooks</code><span>写代码、提交或切换分支时</span></div>
            <div><Play size={17} /><strong>CLI</strong><code>code_synapse build</code><span>首次建图与全量重建</span></div>
            <div><GitBranch size={17} /><strong>增量</strong><code>code_synapse update --diff</code><span>只处理变更符号和受影响功能</span></div>
            <div><Braces size={17} /><strong>页面</strong><code>code_synapse serve</code><span>启动本地独立投影页面</span></div>
          </div>
        </div>
      </section>

      <section className="artifact-ledger">
        <h2>Token 节省策略</h2>
        <ol>
          <li><span>1</span><div><strong>先读结构化图文件</strong><p>AI 不重新通读仓库。</p></div></li>
          <li><span>2</span><div><strong>注释只写稳定语义</strong><p>作用、功能、输入输出；易变关系由分析器生成。</p></div></li>
          <li><span>3</span><div><strong>按 Git diff 局部更新</strong><p>只重建受影响的实体、关系和功能链。</p></div></li>
          <li><span>4</span><div><strong>AI 结果保留证据</strong><p>避免同一解释在每次会话中重复生成。</p></div></li>
        </ol>
      </section>
    </div>
  );
}
