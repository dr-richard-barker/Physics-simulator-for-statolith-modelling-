
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SimulationConfig, GlobalSettings } from '../types';
import Canvas from './Canvas';
import { Info, RefreshCw, X, Settings, Maximize2 } from 'lucide-react';

interface SimulationCardProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  onDelete: (id: number) => void;
  onEdit: (config: SimulationConfig) => void;
  onMaximize: () => void;
}

const SimulationCard: React.FC<SimulationCardProps> = ({ config, globalSettings, onDelete, onEdit, onMaximize }) => {
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col relative group w-full max-w-xs">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10 pointer-events-auto cursor-pointer" onClick={onMaximize}>
             <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider hover:text-cyan-300 transition-colors">{config.name}</h3>
        </div>
        <div className="flex gap-1.5 pointer-events-auto">
             <button 
                onClick={onMaximize}
                className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Full Screen"
            >
                <Maximize2 size={14} />
            </button>
             <button 
                onClick={() => onEdit(config)}
                className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Edit Parameters"
            >
                <Settings size={14} />
            </button>
            <button 
                onClick={() => setResetKey(k => k + 1)}
                className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Restart Simulation"
            >
                <RefreshCw size={14} />
            </button>
            <button 
                onClick={() => onDelete(config.id)}
                className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer"
                title="Remove Simulation"
            >
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow relative aspect-square bg-black">
        {/* The key prop forces full remount of Canvas on reset */}
        <Canvas key={resetKey} config={config} globalSettings={globalSettings} />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-950 p-3 border-t border-gray-800 flex flex-col gap-2">
        <div className="flex items-start gap-2">
            <Info size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2" title={config.nuanceDescription}>
                {config.nuanceDescription}
            </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                G: {config.gravity}x
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                Balls: {config.ballCount}
            </span>
        </div>
      </div>
    </div>
  );
};

export default SimulationCard;
