import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    Handle,
    Position,
    MarkerType,
    Panel,
} from '@xyflow/react';
import type { Connection, Node, Edge, NodeProps } from '@xyflow/react';
import { Plus, Pencil, Eye, Save, Trash2, X, GitBranch, ChevronRight } from 'lucide-react';
import { useAppState } from '../StateContext';
import { flowchartService } from '../services/flowchartService';
import { useTranslation } from '../services/translationService';
import type { Flowchart, FlowchartNodeShape } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function luminance(hex: string): number {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function textColor(bg: string) {
    return luminance(bg) > 0.4 ? '#111827' : '#ffffff';
}

// ─── Custom Node ──────────────────────────────────────────────────────────────

interface NodeData {
    navn: string;
    beskrivelse: string;
    farve: string;
    form_type: FlowchartNodeShape;
    [key: string]: unknown;
}

const FlowchartNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
    const d = data as NodeData;
    const bg = d.farve || '#3b82f6';
    const fg = textColor(bg);

    const base = `flex items-center justify-center text-center font-bold text-[12px] leading-tight
        border-2 transition-all w-full h-full
        ${selected ? 'border-blue-400 shadow-lg' : 'border-transparent shadow-md'}`;

    if (d.form_type === 'diamond') {
        return (
            <div
                className="relative flex items-center justify-center"
                style={{
                    width: '100%',
                    height: '100%',
                    transform: 'rotate(45deg)',
                    backgroundColor: bg,
                    border: selected ? '2px solid #60a5fa' : '2px solid transparent',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
            >
                <Handle type="target" position={Position.Top} style={{ top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }} />
                <span style={{ transform: 'rotate(-45deg)', color: fg, fontSize: 12, fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', padding: '0 4px' }}>
                    {d.navn || '…'}
                </span>
                <Handle type="source" position={Position.Bottom} style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-45deg)' }} />
            </div>
        );
    }

    if (d.form_type === 'oval') {
        return (
            <div
                className={base}
                style={{ backgroundColor: bg, color: fg, borderRadius: '50%', padding: '4px 12px' }}
            >
                <Handle type="target" position={Position.Top} />
                <span className="truncate max-w-[120px] px-1">{d.navn || '…'}</span>
                <Handle type="source" position={Position.Bottom} />
            </div>
        );
    }

    return (
        <div
            className={base}
            style={{ backgroundColor: bg, color: fg, borderRadius: 8, padding: '4px 12px' }}
        >
            <Handle type="target" position={Position.Top} />
            <span className="truncate max-w-[140px] px-1">{d.navn || '…'}</span>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

const nodeTypes = { flowchartNode: FlowchartNodeComponent };

// ─── Helpers: convert DB ↔ ReactFlow ─────────────────────────────────────────

function dbNodesToRF(dbNodes: Flowchart['nodes']): Node[] {
    return dbNodes.map(n => ({
        id: n.node_id,
        type: 'flowchartNode',
        position: { x: n.x_pos, y: n.y_pos },
        style: { width: n.bredde, height: n.hoejde },
        data: {
            navn: n.navn,
            beskrivelse: n.beskrivelse,
            farve: n.farve,
            form_type: n.form_type,
            dbId: n.id,
        },
    }));
}

function dbEdgesToRF(dbEdges: Flowchart['edges']): Edge[] {
    return dbEdges.map(e => ({
        id: e.edge_id,
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.label || undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
    }));
}

// ─── Palette shapes ───────────────────────────────────────────────────────────

const PALETTE_SHAPES: { shape: FlowchartNodeShape; label: string; labelKey: string }[] = [
    { shape: 'rectangle', label: 'Rectangle', labelKey: 'flowchart.shape.rectangle' },
    { shape: 'diamond', label: 'Diamond', labelKey: 'flowchart.shape.diamond' },
    { shape: 'oval', label: 'Oval', labelKey: 'flowchart.shape.oval' },
];

const SHAPE_SIZES: Record<FlowchartNodeShape, { w: number; h: number }> = {
    rectangle: { w: 160, h: 60 },
    diamond: { w: 100, h: 100 },
    oval: { w: 140, h: 60 },
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

// ─── DropZone (renders inside <ReactFlow> so useReactFlow() works correctly) ──

interface DropZoneProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    editMode: boolean;
    nodeIdCounter: React.MutableRefObject<number>;
    t: (key: string, fallback: string) => string;
    onNodeAdd: (node: Node) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ canvasRef, editMode, nodeIdCounter, t, onNodeAdd }) => {
    const { screenToFlowPosition } = useReactFlow();

    useEffect(() => {
        if (!editMode) return;
        const el = canvasRef.current;
        if (!el) return;

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const shape = e.dataTransfer?.getData('application/flowchart-shape') as FlowchartNodeShape;
            if (!shape) return;
            const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            const { w, h } = SHAPE_SIZES[shape];
            const newId = `node-${Date.now()}-${nodeIdCounter.current++}`;
            const labelKey = shape === 'diamond'
                ? 'flowchart.shape.diamond'
                : shape === 'oval'
                    ? 'flowchart.shape.oval'
                    : 'flowchart.shape.rectangle';
            const newNode: Node = {
                id: newId,
                type: 'flowchartNode',
                position,
                style: { width: w, height: h },
                data: { navn: t(labelKey, shape), beskrivelse: '', farve: '#3b82f6', form_type: shape },
            };
            onNodeAdd(newNode);
        };

        el.addEventListener('drop', handleDrop);
        return () => el.removeEventListener('drop', handleDrop);
    }, [editMode, canvasRef, nodeIdCounter, t, onNodeAdd, screenToFlowPosition]);

    return null;
};

// Small shape preview for palette
const ShapePreview: React.FC<{ shape: FlowchartNodeShape }> = ({ shape }) => {
    if (shape === 'diamond') return <div className="w-8 h-8 bg-blue-200 border border-blue-400" style={{ transform: 'rotate(45deg)' }} />;
    if (shape === 'oval') return <div className="w-10 h-6 bg-blue-200 border border-blue-400 rounded-full" />;
    return <div className="w-10 h-6 bg-blue-200 border border-blue-400 rounded" />;
};

// ─── Canvas (no external ReactFlowProvider needed) ────────────────────────────

interface CanvasProps {
    flowchart: Flowchart;
    editMode: boolean;
    onSave: (nodes: Node[], edges: Edge[]) => void;
    isSaving: boolean;
}

const FlowchartCanvas: React.FC<CanvasProps> = ({ flowchart, editMode, onSave, isSaving }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(dbNodesToRF(flowchart.nodes));
    const [edges, setEdges, onEdgesChange] = useEdgesState(dbEdgesToRF(flowchart.edges));
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [propForm, setPropForm] = useState({ navn: '', beskrivelse: '', farve: '#3b82f6', form_type: 'rectangle' as FlowchartNodeShape });
    const nodeIdCounter = useRef(flowchart.nodes.length + 1);

    // Reset canvas when flowchart changes
    useEffect(() => {
        setNodes(dbNodesToRF(flowchart.nodes));
        setEdges(dbEdgesToRF(flowchart.edges));
        setSelectedNode(null);
        nodeIdCounter.current = flowchart.nodes.length + 1;
    }, [flowchart.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges(eds => addEdge({
                ...connection,
                id: `e-${Date.now()}`,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2 },
            }, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        const d = node.data as NodeData;
        setPropForm({ navn: d.navn, beskrivelse: d.beskrivelse, farve: d.farve, form_type: d.form_type });
    }, []);

    const onPaneClick = useCallback(() => setSelectedNode(null), []);

    const applyProps = () => {
        if (!selectedNode) return;
        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...propForm } } : n));
        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...propForm } } : prev);
    };

    const deleteSelectedNode = () => {
        if (!selectedNode) return;
        setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
        setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
    };

    const handleNodeAdd = useCallback((node: Node) => setNodes(nds => [...nds, node]), [setNodes]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Shape palette (edit mode) */}
            {editMode && (
                <div className="w-28 bg-white border-r border-gray-200 flex flex-col gap-2 p-2 z-10 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('flowchart.add_shape', 'Add shape')}</span>
                    {PALETTE_SHAPES.map(({ shape, labelKey, label }) => (
                        <div
                            key={shape}
                            draggable
                            onDragStart={e => {
                                e.dataTransfer.setData('application/flowchart-shape', shape);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            className="cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all select-none"
                        >
                            <ShapePreview shape={shape} />
                            <span className="text-[10px] font-bold text-gray-600 leading-tight text-center">{t(labelKey, label)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Canvas */}
            <div ref={canvasRef} className="flex-1 relative" onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={editMode ? onNodesChange : undefined}
                    onEdgesChange={editMode ? onEdgesChange : undefined}
                    onConnect={editMode ? onConnect : undefined}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    nodesDraggable={editMode}
                    nodesConnectable={editMode}
                    elementsSelectable
                    fitView
                    deleteKeyCode={editMode ? 'Delete' : null}
                    className="bg-gray-50"
                >
                    {/* DropZone is a child of ReactFlow so useReactFlow() works correctly */}
                    <DropZone
                        canvasRef={canvasRef}
                        editMode={editMode}
                        nodeIdCounter={nodeIdCounter}
                        t={t}
                        onNodeAdd={handleNodeAdd}
                    />
                    <Background gap={20} color="#e5e7eb" />
                    <Controls />
                    <MiniMap
                        nodeColor={n => (n.data as NodeData).farve || '#3b82f6'}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                    />
                    {/* Save button */}
                    {editMode && (
                        <Panel position="bottom-right">
                            <button
                                onClick={() => onSave(nodes, edges)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-60"
                            >
                                <Save size={15} />
                                {isSaving ? '…' : t('flowchart.save', 'Save')}
                            </button>
                        </Panel>
                    )}
                </ReactFlow>
            </div>

            {/* Properties panel */}
            {selectedNode && (
                <div className="w-60 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{t('flowchart.properties', 'Properties')}</span>
                        <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight block mb-0.5">{t('flowchart.name', 'Name')}</label>
                            {editMode ? (
                                <input value={propForm.navn} onChange={e => setPropForm(f => ({ ...f, navn: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-[12px] text-gray-900 focus:outline-none focus:border-blue-400" />
                            ) : (
                                <p className="text-[13px] font-bold text-gray-900 leading-tight">{propForm.navn}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight block mb-0.5">{t('flowchart.description', 'Description')}</label>
                            {editMode ? (
                                <textarea value={propForm.beskrivelse} onChange={e => setPropForm(f => ({ ...f, beskrivelse: e.target.value }))}
                                    rows={4} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-[12px] text-gray-900 focus:outline-none focus:border-blue-400 resize-none" />
                            ) : (
                                <p className="text-[12px] text-gray-700 leading-tight whitespace-pre-wrap">{propForm.beskrivelse || <span className="italic text-gray-400">—</span>}</p>
                            )}
                        </div>
                        {editMode && (
                            <>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight block mb-1">{t('flowchart.color', 'Color')}</label>
                                    <div className="flex flex-wrap gap-1.5 mb-1">
                                        {DEFAULT_COLORS.map(c => (
                                            <button key={c} onClick={() => setPropForm(f => ({ ...f, farve: c }))}
                                                className={`w-5 h-5 rounded-full border-2 transition-all ${propForm.farve === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <input type="color" value={propForm.farve} onChange={e => setPropForm(f => ({ ...f, farve: e.target.value }))}
                                        className="w-full h-7 rounded border border-gray-300 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight block mb-1">{t('flowchart.shape', 'Shape')}</label>
                                    <div className="flex gap-1">
                                        {PALETTE_SHAPES.map(({ shape, labelKey, label }) => (
                                            <button key={shape} onClick={() => setPropForm(f => ({ ...f, form_type: shape }))}
                                                className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all ${propForm.form_type === shape ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                                                {t(labelKey, label)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {editMode && (
                        <div className="p-3 border-t border-gray-100 flex gap-2">
                            <button onClick={applyProps}
                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all">
                                {t('flowchart.save', 'Save')}
                            </button>
                            <button onClick={deleteSelectedNode}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                                title={t('flowchart.delete_node', 'Delete node')}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const FlowchartPage: React.FC = () => {
    const { t } = useTranslation();
    const { state } = useAppState();
    const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
    const [selected, setSelected] = useState<Flowchart | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newTeam, setNewTeam] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        flowchartService.getAll()
            .then(data => setFlowcharts(data))
            .catch(err => console.error('Flowchart load error:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const created = await flowchartService.create({ navn: newName.trim(), beskrivelse: newDesc.trim(), team: newTeam });
            setFlowcharts(prev => [...prev, created]);
            setSelected(created);
            setShowNewModal(false);
            setNewName('');
            setNewDesc('');
            setNewTeam(null);
            setEditMode(true);
        } catch (err) {
            console.error('Create flowchart error:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleSave = async (nodes: Node[], edges: Edge[]) => {
        if (!selected) return;
        setIsSaving(true);
        try {
            const payload = {
                nodes: nodes.map(n => {
                    const d = n.data as NodeData;
                    return {
                        node_id: n.id,
                        navn: d.navn,
                        beskrivelse: d.beskrivelse,
                        farve: d.farve,
                        form_type: d.form_type,
                        x_pos: n.position.x,
                        y_pos: n.position.y,
                        bredde: (n.style?.width as number) || 160,
                        hoejde: (n.style?.height as number) || 60,
                    };
                }),
                edges: edges.map(e => ({
                    edge_id: e.id,
                    source_node_id: e.source,
                    target_node_id: e.target,
                    label: (e.label as string) || '',
                })),
            };
            const updated = await flowchartService.bulkSave(selected.id, payload);
            setSelected(updated);
            setFlowcharts(prev => prev.map(f => f.id === updated.id ? updated : f));
        } catch (err) {
            console.error('Save flowchart error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar: flowchart list */}
            <div className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <GitBranch size={14} className="text-blue-600" />
                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Flowcharts</span>
                    </div>
                    <button onClick={() => setShowNewModal(true)}
                        className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title={t('flowchart.new', 'New Flowchart')}>
                        <Plus size={15} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                    {loading && <p className="text-[11px] text-gray-400 px-3 py-2">…</p>}
                    {!loading && flowcharts.length === 0 && (
                        <p className="text-[11px] text-gray-400 px-3 py-2 italic">{t('flowchart.no_flowcharts', 'No flowcharts yet')}</p>
                    )}
                    {flowcharts.map(fc => (
                        <button key={fc.id} onClick={() => { setSelected(fc); setEditMode(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-[12px] font-bold transition-all ${selected?.id === fc.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <span className="truncate flex-1">{fc.navn}</span>
                            {fc.team_details && (
                                <span className="text-[9px] ml-1 px-1 py-0.5 rounded font-black uppercase"
                                    style={{ backgroundColor: fc.team_details.color + '33', color: fc.team_details.color }}>
                                    {fc.team_details.navn}
                                </span>
                            )}
                            {selected?.id === fc.id && <ChevronRight size={12} className="ml-1 shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selected ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <GitBranch size={48} className="mb-3 opacity-20" />
                        <p className="text-[13px] font-bold">{t('flowchart.select_hint', 'Select a flowchart to view')}</p>
                    </div>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
                            <span className="font-black text-gray-900 text-sm">{selected.navn}</span>
                            {selected.team_details && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase"
                                    style={{ backgroundColor: selected.team_details.color + '22', color: selected.team_details.color }}>
                                    {selected.team_details.navn}
                                </span>
                            )}
                            <div className="ml-auto">
                                <button onClick={() => setEditMode(m => !m)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${editMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                                    {editMode ? <><Eye size={13} />{t('flowchart.view_mode', 'View')}</> : <><Pencil size={13} />{t('flowchart.edit_mode', 'Edit')}</>}
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <FlowchartCanvas
                            key={selected.id}
                            flowchart={selected}
                            editMode={editMode}
                            onSave={handleSave}
                            isSaving={isSaving}
                        />
                    </>
                )}
            </div>

            {/* New Flowchart Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-gray-900">{t('flowchart.new', 'New Flowchart')}</h3>
                            <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">{t('flowchart.name', 'Name')} *</label>
                                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">{t('flowchart.description', 'Description')}</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                    rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">{t('flowchart.team', 'Team')}</label>
                                <select value={newTeam ?? ''} onChange={e => setNewTeam(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400">
                                    <option value="">{t('flowchart.team_all', 'All (company-wide)')}</option>
                                    {state.teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.navn}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleCreate} disabled={!newName.trim() || creating}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
                                {creating ? '…' : t('flowchart.new', 'New Flowchart')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlowchartPage;
