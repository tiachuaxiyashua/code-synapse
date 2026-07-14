import { memo } from 'react';
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
} from '@xyflow/react';
import { Box, CircleDot, Database, RadioTower } from 'lucide-react';

const ProcessNode = memo(({ data }) => (
  <div className={`flow-node process-node kind-${data.kind}`}>
    <Handle type="target" position={Position.Left} className="node-port" />
    <div className="node-title"><Box size={14} />{data.label}</div>
    <div className="node-contract">
      <span>{data.input || 'input'}</span>
      <span>{data.output || 'output'}</span>
    </div>
    <Handle type="source" position={Position.Right} className="node-port" />
  </div>
));

const BufferNode = memo(({ data }) => (
  <div className="flow-node buffer-node">
    <Handle type="target" position={Position.Left} className="node-port" />
    <div className="node-title">
      {data.kind === 'buffer' ? <Database size={14} /> : <RadioTower size={14} />}
      {data.label}
    </div>
    <div className="node-contract">
      <span>{data.input || 'write'}</span>
      <span>{data.output || 'read'}</span>
    </div>
    <Handle type="source" position={Position.Right} className="node-port" />
  </div>
));

const LaneNode = memo(({ data }) => (
  <div className="lane-node">
    <CircleDot size={13} />
    <strong>{data.label}</strong>
  </div>
));

const nodeTypes = { process: ProcessNode, buffer: BufferNode, lane: LaneNode };

export default function FlowCanvas({ graph, onScopeChange }) {
  return (
    <ReactFlow
      nodes={graph.nodes}
      edges={graph.edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.35}
      maxZoom={1.8}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      onNodeDoubleClick={(_, node) => {
        if (node.data.scope) onScopeChange(node.data.scope);
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={22} size={1} color="#dce2e8" />
      <MiniMap pannable zoomable nodeStrokeWidth={2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
