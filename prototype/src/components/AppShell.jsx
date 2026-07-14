import {
  Activity,
  Braces,
  Boxes,
  GitCompareArrows,
  GitFork,
  Home,
  Layers3,
  Network,
  Puzzle,
  Radio,
  Search,
  TreePine,
} from 'lucide-react';
import { variants } from '../model';

const nav = [
  ['/', '项目', Home],
  ['/features', '功能树', TreePine],
  ['/flow', '流程图', GitFork],
  ['/timeline', '时序图', Activity],
  ['/layers', '分层图', Layers3],
  ['/code', '代码', Braces],
  ['/pipeline', '建图管线', Puzzle],
];

function withVariant(path, variant, scope) {
  const params = new URLSearchParams({ variant });
  if (scope) params.set('scope', scope);
  return `${path}?${params}`;
}

export default function AppShell({ children, variant, scope, following, onFollowingChange }) {
  const currentPath = window.location.pathname;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href={withVariant('/', variant, scope)}>
          <span className="brand-mark"><Network size={18} /></span>
          <span>Code Synapse</span>
          <span className="prototype-tag">PROTOTYPE</span>
        </a>
        <div className="project-context">
          <strong>{variants[variant].project}</strong>
          <span>main@42ac91</span>
          <span className="model-status"><Radio size={13} /> 模拟模型已加载</span>
        </div>
        <div className="top-actions">
          <button className="icon-button" title="全局定位"><Search size={17} /></button>
          <button
            className={`follow-button ${following ? 'active' : ''}`}
            onClick={() => onFollowingChange(!following)}
            title={following ? '当前窗口会跟随其他页面' : '当前窗口已固定'}
          >
            <GitCompareArrows size={15} />
            {following ? 'Follow' : 'Pinned'}
          </button>
        </div>
      </header>
      <nav className="main-nav" aria-label="原型页面">
        {nav.map(([path, label, Icon]) => (
          <a
            key={path}
            className={currentPath === path ? 'active' : ''}
            href={withVariant(path, variant, scope)}
            target={path === currentPath ? undefined : '_self'}
          >
            <Icon size={15} />
            {label}
          </a>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}
