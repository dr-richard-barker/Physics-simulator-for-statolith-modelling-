
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { presets } from './utils/presets';
import SimulationCard from './components/SimulationCard';
import { GlobalSettings, SimulationConfig } from './types';
import { Play, Pause, Activity, Image as ImageIcon, Trash2, UploadCloud, RefreshCw, X, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import Canvas from './components/Canvas';
import { processImageForSimulation } from './utils/imageProcessor';

const App: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationConfig[]>(presets);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    timeScale: 1.0,
    gravityMultiplier: 1.0,
    rotationMultiplier: 1.0,
    bouncinessMultiplier: 1.0,
    stickinessMultiplier: 1.0,
    userImage: null,
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [editingSim, setEditingSim] = useState<SimulationConfig | null>(null);
  const [maximizedSimId, setMaximizedSimId] = useState<number | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      setGlobalSettings(prev => ({ ...prev, timeScale: 0 }));
    } else {
      setGlobalSettings(prev => ({ ...prev, timeScale: 1 }));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setGlobalSettings(prev => ({ ...prev, userImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAnalysisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          const imageSrc = event.target?.result as string;
          
          try {
            const result = await processImageForSimulation(imageSrc);
            if (result && result.polygon.length > 0) {
                const newId = Math.max(...simulations.map(s => s.id), 0) + 1;
                
                const newConfig: SimulationConfig = {
                    id: newId,
                    name: `Custom Scan ${newId}`,
                    shapeType: 'custom',
                    customPolygon: result.polygon,
                    initialBalls: result.balls,
                    vertexCount: result.polygon.length,
                    gravity: 0.2,
                    friction: 0.01,
                    restitution: 0.7,
                    stickiness: 0,
                    rotationSpeed: 0.002, // Slow rotation for better manual control
                    ballCount: result.balls.length,
                    ballSize: 8,
                    initialSpeed: 2,
                    nuanceDescription: "Shape and balls detected from uploaded image. Drag to rotate!",
                };
                
                setSimulations(prev => [newConfig, ...prev]);
            } else {
                alert("Could not detect a blue rim or yellow balls in the image.");
            }
          } catch (err) {
              console.error(err);
              alert("Error processing image.");
          } finally {
              setIsAnalyzing(false);
          }
      };
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = '';
  };

  const removeSimulation = (id: number) => {
      setSimulations(prev => prev.filter(s => s.id !== id));
      if (maximizedSimId === id) setMaximizedSimId(null);
  };

  const openEditor = (sim: SimulationConfig) => {
      setEditingSim({ ...sim });
  };

  const saveSimulationChanges = () => {
      if (!editingSim) return;
      setSimulations(prev => prev.map(s => s.id === editingSim.id ? editingSim : s));
      setEditingSim(null);
  };

  const clearImage = () => {
    setGlobalSettings(prev => ({ ...prev, userImage: null }));
  };

  const maximizedSimConfig = simulations.find(s => s.id === maximizedSimId);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Sticky Header Controls */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Activity className="text-cyan-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Physics <span className="text-cyan-400">Simulator</span></h1>
              </div>
            </div>

            {/* Controls Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
              
              {/* Time/Speed Control */}
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Sim Speed</span>
                    <span className="text-cyan-400">{isPlaying ? globalSettings.timeScale.toFixed(1) + 'x' : 'PAUSED'}</span>
                 </label>
                 <div className="flex items-center gap-2 h-7">
                     <button 
                        onClick={togglePlay}
                        className={`p-1.5 rounded ${isPlaying ? 'bg-gray-800 hover:bg-gray-700 text-red-400' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}
                     >
                        {isPlaying ? <Pause size={14}/> : <Play size={14}/>}
                     </button>
                     <input 
                        type="range" min="0.1" max="3" step="0.1"
                        value={isPlaying ? globalSettings.timeScale : 1}
                        onChange={(e) => {
                            if(!isPlaying) togglePlay();
                            setGlobalSettings(p => ({...p, timeScale: parseFloat(e.target.value)}))
                        }}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                     />
                 </div>
              </div>

               {/* Gravity Control */}
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Global Gravity</span>
                    <span className="text-cyan-400">{globalSettings.gravityMultiplier.toFixed(1)}x</span>
                 </label>
                 <div className="flex items-center h-7">
                    <input 
                        type="range" min="0" max="3" step="0.1"
                        value={globalSettings.gravityMultiplier}
                        onChange={(e) => setGlobalSettings(p => ({...p, gravityMultiplier: parseFloat(e.target.value)}))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                 </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Global Rotation</span>
                    <span className="text-cyan-400">{globalSettings.rotationMultiplier.toFixed(1)}x</span>
                 </label>
                 <div className="flex items-center h-7">
                    <input 
                        type="range" min="0" max="5" step="0.1"
                        value={globalSettings.rotationMultiplier}
                        onChange={(e) => setGlobalSettings(p => ({...p, rotationMultiplier: parseFloat(e.target.value)}))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                 </div>
              </div>

               {/* Stickiness Control */}
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Global Stickiness</span>
                    <span className="text-cyan-400">{globalSettings.stickinessMultiplier.toFixed(1)}x</span>
                 </label>
                 <div className="flex items-center h-7">
                    <input 
                        type="range" min="0" max="2" step="0.1"
                        value={globalSettings.stickinessMultiplier}
                        onChange={(e) => setGlobalSettings(p => ({...p, stickinessMultiplier: parseFloat(e.target.value)}))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                 </div>
              </div>

              {/* Image Analysis */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Scan Image</span>
                    {isAnalyzing && <span className="text-cyan-400 animate-pulse">SCANNING...</span>}
                </label>
                <div className="flex items-center gap-2 h-7">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="analysis-upload"
                        onChange={handleAnalysisUpload}
                        disabled={isAnalyzing}
                    />
                    <label 
                        htmlFor="analysis-upload"
                        className={`w-full flex items-center justify-center gap-2 ${isAnalyzing ? 'bg-cyan-900 cursor-wait' : 'bg-cyan-600 hover:bg-cyan-500 cursor-pointer'} text-white border border-transparent rounded h-full text-xs font-medium transition-all`}
                        title="Upload image with Blue Rim and Yellow Balls"
                    >
                        {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <UploadCloud size={12} />}
                        <span>{isAnalyzing ? 'Processing' : 'Upload'}</span>
                    </label>
                </div>
              </div>

              {/* Texture Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 flex justify-between">
                    <span>Ball Texture</span>
                    <span className={`text-[10px] ${globalSettings.userImage ? 'text-cyan-400' : 'text-gray-600'}`}>
                        {globalSettings.userImage ? 'ACTIVE' : 'DEFAULT'}
                    </span>
                </label>
                <div className="flex items-center gap-2 h-7">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="texture-upload"
                        onChange={handleTextureUpload}
                    />
                    {globalSettings.userImage ? (
                        <button 
                            onClick={clearImage}
                            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded h-full text-xs font-medium transition-all"
                            title="Reset to default balls"
                        >
                            <Trash2 size={12} />
                            <span>Reset</span>
                        </button>
                    ) : (
                        <label 
                            htmlFor="texture-upload"
                            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-cyan-500/50 rounded h-full text-xs font-medium cursor-pointer transition-all"
                        >
                            <ImageIcon size={12} />
                            <span>Texture</span>
                        </label>
                    )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Editor Modal Overlay */}
      {editingSim && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                    <h2 className="text-lg font-bold text-white">Edit <span className="text-cyan-400">{editingSim.name}</span></h2>
                    <button onClick={() => setEditingSim(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            Gravity Strength
                            <span className="text-cyan-400">{editingSim.gravity.toFixed(2)}</span>
                        </label>
                        <input 
                            type="range" min="-0.5" max="1.0" step="0.01" 
                            value={editingSim.gravity}
                            onChange={(e) => setEditingSim({...editingSim, gravity: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            Rotation Speed
                            <span className="text-cyan-400">{editingSim.rotationSpeed.toFixed(4)}</span>
                        </label>
                        <input 
                            type="range" min="-0.1" max="0.1" step="0.001" 
                            value={editingSim.rotationSpeed}
                            onChange={(e) => setEditingSim({...editingSim, rotationSpeed: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            Bounciness (Restitution)
                            <span className="text-cyan-400">{editingSim.restitution.toFixed(2)}</span>
                        </label>
                        <input 
                            type="range" min="0.1" max="1.2" step="0.05" 
                            value={editingSim.restitution}
                            onChange={(e) => setEditingSim({...editingSim, restitution: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            Wall Stickiness
                            <span className="text-cyan-400">{editingSim.stickiness ? editingSim.stickiness.toFixed(2) : '0.00'}</span>
                        </label>
                        <input 
                            type="range" min="0" max="0.5" step="0.01" 
                            value={editingSim.stickiness || 0}
                            onChange={(e) => setEditingSim({...editingSim, stickiness: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            Friction (Air Resistance)
                            <span className="text-cyan-400">{editingSim.friction.toFixed(3)}</span>
                        </label>
                        <input 
                            type="range" min="0" max="0.2" step="0.001" 
                            value={editingSim.friction}
                            onChange={(e) => setEditingSim({...editingSim, friction: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
                    <button 
                        onClick={() => setEditingSim(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveSimulationChanges}
                        className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full h-full min-h-[calc(100vh-80px)]">
        
        {/* Full Screen Mode */}
        {maximizedSimConfig ? (
            <div className="h-[calc(100vh-80px)] flex flex-col relative animate-in fade-in duration-300">
                <div className="absolute top-4 left-4 z-20">
                     <button 
                        onClick={() => setMaximizedSimId(null)}
                        className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                     >
                        <ChevronLeft size={20} />
                        Back to Grid
                     </button>
                </div>
                <div className="absolute top-4 right-4 z-20 flex gap-3">
                    <button 
                        onClick={() => openEditor(maximizedSimConfig)}
                        className="bg-gray-900/80 backdrop-blur p-2 rounded-lg border border-gray-700 text-white hover:text-cyan-400 transition-colors shadow-lg"
                        title="Settings"
                    >
                        <Activity size={20} />
                    </button>
                </div>
                <div className="flex-1 bg-black/50 w-full h-full">
                     <Canvas 
                        config={maximizedSimConfig} 
                        globalSettings={globalSettings} 
                     />
                </div>
                <div className="bg-gray-900/50 backdrop-blur border-t border-gray-800 p-4 text-center">
                    <h2 className="text-xl font-bold text-cyan-400">{maximizedSimConfig.name}</h2>
                    <p className="text-gray-400">{maximizedSimConfig.nuanceDescription}</p>
                </div>
            </div>
        ) : (
            /* Grid Mode */
            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                {simulations.map(sim => (
                    <SimulationCard 
                        key={sim.id} 
                        config={sim} 
                        globalSettings={globalSettings}
                        onDelete={removeSimulation} 
                        onEdit={openEditor}
                        onMaximize={() => setMaximizedSimId(sim.id)}
                    />
                ))}
                
                {simulations.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <p className="text-gray-500">No simulations active. Upload an image or refresh to reload presets.</p>
                        <button onClick={() => setSimulations(presets)} className="mt-4 text-cyan-400 underline">Reset Defaults</button>
                    </div>
                )}
            </div>
        )}
      </main>

    </div>
  );
};

export default App;
