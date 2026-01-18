
import React from 'react';
import { Node, NodeStatus } from '../types';

interface EnergyNodeProps {
  node: Node;
}

export const EnergyNode: React.FC<EnergyNodeProps> = ({ node }) => {
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.ACTIVE: return 'text-green-400 border-green-400';
      case NodeStatus.STANDBY: return 'text-yellow-400 border-yellow-400';
      case NodeStatus.LOCKED: return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <div className={`border-l-4 p-4 bg-black/40 backdrop-blur-md mb-4 transition-all hover:bg-black/60 ${getStatusColor(node.status)}`}>
      <h3 className="cinzel text-xl font-bold uppercase tracking-widest">{node.name}</h3>
      <p className="text-sm text-gray-400 mt-1 italic">{node.location}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs uppercase tracking-tighter">Lead: {node.lead}</span>
        <span className={`text-xs px-2 py-0.5 border rounded-full uppercase`}>
          {node.status}
        </span>
      </div>
    </div>
  );
};
