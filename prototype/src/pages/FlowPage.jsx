import { ChevronRight, Eye, GitCompare, Layers, MousePointer2, Route, Share2 } from 'lucide-react';
import FlowCanvas from '../components/FlowCanvas';
import { featureTrees, graphFor } from '../model';

export default function FlowPage({ variant, scope, setScope }) {
  const graph = graphFor(variant, scope);
  const root = featureTrees[variant];

  return (
    <div className="page canvas-page">
      <header className="canvas-toolbar">
        <div className="breadcrumbs">
          <button onClick={() => setScope(root.id)}>{root.label}</button>
          {scope !== root.id && <><ChevronRight size={14} /><strong>{scope}</strong></>}
        </div>
        <div className="canvas-title">
          <h1>{graph.title}</h1>
          <p>{graph.subtitle}</p>
        </div>
        <div className="toolbar-actions">
          <button className="icon-text active"><Route size={15} />主关系</button>
          <button className="icon-text"><Share2 size={15} />数据边</button>
          <button className="icon-text"><GitCompare size={15} />变更</button>
          <button className="icon-button" title="显示证据"><Eye size={16} /></button>
        </div>
      </header>
      <div className="canvas-stage">
        <FlowCanvas graph={graph} onScopeChange={setScope} />
        <div className="canvas-hint">
          <MousePointer2 size={14} />
          {graph.terminal ? '已到终端实现层；选择节点可查看代码与证据' : '双击节点进入下层；端口和边标签来自模型文件'}
        </div>
        <aside className="canvas-legend">
          <strong>关系</strong>
          <span><i className="legend-line data" />数据/消息</span>
          <span><i className="legend-line call" />调用/控制</span>
          <span><i className="legend-line event" />异步事件</span>
          <a href={`/layers?variant=${variant}&scope=${scope}`} target="_blank" rel="noreferrer"><Layers size={14} />在分层图定位</a>
        </aside>
      </div>
    </div>
  );
}
