import {
  ArrowUpRight,
  Braces,
  CheckCircle2,
  CircleDashed,
  GitFork,
  Layers3,
  Play,
  Puzzle,
  TreePine,
} from 'lucide-react';
import { featureTrees, variants } from '../model';

const routes = [
  ['/features', '功能树', '功能层级、作用和实现覆盖', TreePine],
  ['/flow', '流程图', '按机制选择端口图、事件拓扑或调用图', GitFork],
  ['/timeline', '时序图', '真实时间轴、线程轨道、Slice 和因果边', Play],
  ['/layers', '分层图', '软件层级及当前 Scope 对应模块', Layers3],
  ['/code', '代码详情', '函数作用、注释标记、证据与源码', Braces],
  ['/pipeline', '建图管线', 'GitNexus/CodeGraph、AI 多次建图与 Skill', Puzzle],
];

export default function HomePage({ variant, scope }) {
  const feature = featureTrees[variant];
  const query = new URLSearchParams({ variant, scope }).toString();
  return (
    <div className="page page-home">
      <section className="home-intro">
        <div>
          <p className="eyeline">可运行 UI 原型 · 所有分析数据均为模拟</p>
          <h1>{variants[variant].project}</h1>
          <p className="lead">{feature.summary}</p>
        </div>
        <div className="build-summary">
          <div><CheckCircle2 size={16} /><span>基础代码图</span><strong>ready</strong></div>
          <div><CheckCircle2 size={16} /><span>AI 语义标注</span><strong>ready</strong></div>
          <div><CheckCircle2 size={16} /><span>功能链与流程投影</span><strong>ready</strong></div>
          <div><CircleDashed size={16} /><span>真实运行轨迹</span><strong>simulated</strong></div>
        </div>
      </section>

      <section className="home-band">
        <div className="section-heading">
          <div>
            <h2>独立页面</h2>
            <p>按住 Command 点击可在多个窗口打开；开启 Follow 后会同步当前节点。</p>
          </div>
        </div>
        <div className="route-list">
          {routes.map(([path, title, description, Icon]) => (
            <a key={path} href={`${path}?${query}`} target="_blank" rel="noreferrer">
              <Icon size={18} />
              <span><strong>{title}</strong><small>{description}</small></span>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </section>

      <section className="home-band model-files">
        <div className="section-heading">
          <div>
            <h2>可版本化的图模型文件</h2>
            <p>网页读取文件而不是依赖一次性 AI 对话；Codex、Claude Code 和 CLI 共用同一产物。</p>
          </div>
        </div>
        <pre>{`.code_synapse/
├── manifest.json
├── entities.jsonl
├── relations.jsonl
├── evidence.jsonl
├── features/
│   └── feature-tree.json
├── flows/
│   ├── audio-root.json
│   └── pitch-extraction.json
└── views/
    ├── layers.json
    └── timeline.json`}</pre>
      </section>
    </div>
  );
}
