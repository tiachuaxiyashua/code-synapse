import { Box, ChevronRight, ExternalLink, Layers3 } from 'lucide-react';
import { layerData, variants } from '../model';

export default function LayersPage({ variant, scope, setScope }) {
  return (
    <div className="page layers-page">
      <header className="page-header">
        <div>
          <p className="eyeline">独立网页 · Architecture projection</p>
          <h1>{variants[variant].project} · 软件分层</h1>
          <p>选中范围：<strong>{scope}</strong>。跟随模式下，其他页面下钻会在这里自动定位对应模块。</p>
        </div>
        <a className="button" href={`/flow?variant=${variant}&scope=${scope}`} target="_blank" rel="noreferrer">打开流程图<ExternalLink size={13} /></a>
      </header>
      <div className="layer-stack">
        {layerData[variant].map((layer, index) => (
          <section key={layer.label} className="layer-band">
            <div className="layer-label"><span>{index + 1}</span><div><strong>{layer.label}</strong><small>{index === 0 ? '高层策略与编排' : index === layerData[variant].length - 1 ? '平台和外部依赖' : '稳定模块边界'}</small></div></div>
            <div className="layer-modules">
              {layer.modules.map((module) => (
                <button key={module} className={scope.toLowerCase().includes(module.toLowerCase()) ? 'selected' : ''} onClick={() => setScope(module.toLowerCase())}>
                  <Box size={14} /><span>{module}</span><ChevronRight size={14} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="layer-notes">
        <Layers3 size={18} />
        <div><strong>层级不是文件夹</strong><p>逻辑层由 AI 建议并链接到实际包、文件和符号；每个映射保留证据与置信度。</p></div>
      </div>
    </div>
  );
}
