import { useEffect, useMemo, useState } from 'react';
import { Braces, GitBranch } from 'lucide-react';

import FeatureView from './FeatureView';
import FlowView from './FlowView';

const CHANNEL = 'code-synapse-phase-one-selection';

export default function SemanticZoomApp({ artifact }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const view = params.get('view') === 'flow' ? 'flow' : 'features';
  const [selectedId, setSelectedId] = useState(() => params.get('selected') || 'auth');

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = ({ data }) => {
      if (data?.type === 'selection' && artifact.model.objects[data.semanticId]) {
        setSelectedId(data.semanticId);
      }
    };
    return () => channel.close();
  }, [artifact.model.objects]);

  const select = (semanticId) => {
    if (!artifact.model.objects[semanticId]) return;
    setSelectedId(semanticId);
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: 'selection', semanticId, sourceView: view });
    channel.close();
  };

  return (
    <div className="semantic-app">
      <header className="semantic-header">
        <a className="semantic-brand" href="/semantic-zoom.html?view=features">
          <span className="semantic-brand-mark"><Braces size={17} /></span>
          <span>Code Synapse</span>
        </a>
        <div className="semantic-context">
          <GitBranch size={14} />
          <span>bulletproof-nodejs</span>
          <code>{artifact.generatedFrom.commit.slice(0, 8)}</code>
        </div>
        <span className="semantic-evidence-state">证据模型 v{artifact.schemaVersion}</span>
      </header>
      {view === 'features' ? (
        <FeatureView model={artifact.model} selectedId={selectedId} onSelect={select} />
      ) : (
        <FlowView artifact={artifact} selectedId={selectedId} onSelect={select} />
      )}
    </div>
  );
}
