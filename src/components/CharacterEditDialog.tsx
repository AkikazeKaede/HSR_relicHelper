import React, { useState, useEffect, useRef } from 'react';
import type { CharacterFilter, StatType, RelicSet, WeightedStat, StatOperator } from '../types';
import { MainStats } from '../types';
import { STAT_LABELS } from '../constants';
import './CharacterEditDialog.css';

interface CharacterEditDialogProps {
    isOpen: boolean;
    initialData?: CharacterFilter;
    onClose: () => void;
    onSave: (data: Omit<CharacterFilter, 'id' | 'updatedAt'>) => void;
    relicSets: RelicSet[];
    planarSets: RelicSet[];
}

const ALL_SUB_STATS: StatType[] = [
    'HP', 'Attack', 'Defense', 'Speed', 'CritRate', 'CritDMG',
    'BreakEffect', 'EffectHitRate', 'EffectRes'
];

interface PriorityStatSelectorProps {
    availableStats: StatType[];
    selectedStats: WeightedStat[];
    onChange: (stats: WeightedStat[]) => void;
    title?: string;
}

const PriorityStatSelector: React.FC<PriorityStatSelectorProps> = ({ availableStats, selectedStats, onChange, title }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleToggle = (stat: StatType) => {
        const existingIndex = selectedStats.findIndex(s => s.stat === stat);

        if (existingIndex >= 0) {
            // Remove
            const newStats = [...selectedStats];
            newStats.splice(existingIndex, 1);

            // If we removed the first item, ensure the new first item has '-' operator
            if (newStats.length > 0 && existingIndex === 0) {
                newStats[0].operator = '-';
            }
            onChange(newStats);
        } else {
            // Add
            const newItem: WeightedStat = {
                stat,
                operator: selectedStats.length === 0 ? '-' : '>'
            };
            onChange([...selectedStats, newItem]);
        }
    };

    const toggleOperator = (index: number) => {
        if (index === 0) return; // First item always has '-'

        const newStats = [...selectedStats];
        const currentOp = newStats[index].operator;
        let nextOp: StatOperator = '>';
        if (currentOp === '>') nextOp = '>=';
        else if (currentOp === '>=') nextOp = '=';
        else if (currentOp === '=') nextOp = '>';

        newStats[index].operator = nextOp;
        onChange(newStats);
    };

    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        const newStats = [...selectedStats];
        const draggedItemContent = newStats.splice(dragItem.current, 1)[0];
        newStats.splice(dragOverItem.current, 0, draggedItemContent);

        // Reset operators logic after reorder
        if (newStats.length > 0) {
            newStats[0].operator = '-';
            for (let i = 1; i < newStats.length; i++) {
                if (newStats[i].operator === '-') {
                    newStats[i].operator = '>';
                }
            }
        }

        dragItem.current = null;
        dragOverItem.current = null;
        onChange(newStats);
    };

    return (
        <div className="priority-selector">
            {title && <h4>{title}</h4>}

            {/* Selected List (Draggable) */}
            <div className="selected-stats-list">
                {selectedStats.length === 0 && <div className="empty-selection-msg">ステータスを選択してください</div>}
                {selectedStats.map((item, index) => (
                    <div
                        key={`${item.stat}-${index}`}
                        className="priority-item"
                        draggable
                        onDragStart={(e) => {
                            dragItem.current = index;
                            e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnter={(e) => {
                            dragOverItem.current = index;
                            if (dragItem.current !== null && dragItem.current !== index) {
                                handleSort();
                                dragItem.current = index;
                            }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {/* Operator Badge */}
                        <div
                            className={`operator-badge ${index === 0 ? 'hidden' : 'clickable'}`}
                            onClick={() => toggleOperator(index)}
                            title={index === 0 ? "" : "クリックで変更 ( > / >= / = )"}
                        >
                            {index === 0 ? '' : item.operator}
                        </div>

                        <span className="stat-label">
                            {STAT_LABELS[item.stat]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Available Pool */}
            <div className="available-stats-pool">
                {availableStats.map(stat => {
                    const isSelected = selectedStats.some(s => s.stat === stat);
                    return (
                        <button
                            key={stat}
                            className={`pool-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggle(stat)}
                        >
                            {STAT_LABELS[stat]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const CharacterEditDialog: React.FC<CharacterEditDialogProps> = ({ isOpen, initialData, onClose, onSave, relicSets, planarSets }) => {
    const [name, setName] = useState('');
    const [targetRelicSets, setTargetRelicSets] = useState<string[]>([]);
    const [targetPlanarSets, setTargetPlanarSets] = useState<string[]>([]);

    // Updated State for WeightedStat
    const [mainStats, setMainStats] = useState<CharacterFilter['mainStats']>({
        body: [], feet: [], planarSphere: [], linkRope: []
    });
    const [subStats, setSubStats] = useState<WeightedStat[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.characterName);
                setTargetRelicSets(initialData.targetRelicSets);
                setTargetPlanarSets(initialData.targetPlanarSets);
                // initialData is already migrated at this point in App.tsx
                setMainStats(initialData.mainStats);
                setSubStats(initialData.subStats);
            } else {
                setName('');
                setTargetRelicSets([]);
                setTargetPlanarSets([]);
                setMainStats({ body: [], feet: [], planarSphere: [], linkRope: [] });
                setSubStats([]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            alert('キャラクター名を入力してください');
            return;
        }
        onSave({
            characterName: name,
            targetRelicSets,
            targetPlanarSets,
            mainStats,
            subStats
        });
        onClose();
    };

    const toggleSelection = (list: string[], item: string, setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-content wide-dialog">
                <h2>{initialData ? 'キャラクター編集' : 'キャラクター追加'}</h2>

                <div className="dialog-body">
                    <div className="form-group">
                        <label>キャラクター名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="名前を入力"
                        />
                    </div>

                    <div className="form-section">
                        <h3>トンネル遺物</h3>
                        <div className="selection-grid">
                            {relicSets.map(set => (
                                <label key={set.id} className={`selection-item ${targetRelicSets.includes(set.id) ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={targetRelicSets.includes(set.id)}
                                        onChange={() => toggleSelection(targetRelicSets, set.id, setTargetRelicSets)}
                                    />
                                    {set.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>次元界オーナメント</h3>
                        <div className="selection-grid">
                            {planarSets.map(set => (
                                <label key={set.id} className={`selection-item ${targetPlanarSets.includes(set.id) ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={targetPlanarSets.includes(set.id)}
                                        onChange={() => toggleSelection(targetPlanarSets, set.id, setTargetPlanarSets)}
                                    />
                                    {set.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>メインステータス優先度</h3>
                        <div className="main-stats-grid">
                            <PriorityStatSelector
                                title="胴"
                                availableStats={MainStats.Body}
                                selectedStats={mainStats.body}
                                onChange={(stats) => setMainStats({ ...mainStats, body: stats })}
                            />
                            <PriorityStatSelector
                                title="脚"
                                availableStats={MainStats.Feet}
                                selectedStats={mainStats.feet}
                                onChange={(stats) => setMainStats({ ...mainStats, feet: stats })}
                            />
                            <PriorityStatSelector
                                title="オーブ"
                                availableStats={MainStats.PlanarSphere}
                                selectedStats={mainStats.planarSphere}
                                onChange={(stats) => setMainStats({ ...mainStats, planarSphere: stats })}
                            />
                            <PriorityStatSelector
                                title="縄"
                                availableStats={MainStats.LinkRope}
                                selectedStats={mainStats.linkRope}
                                onChange={(stats) => setMainStats({ ...mainStats, linkRope: stats })}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>サブステータス優先度</h3>
                        <PriorityStatSelector
                            availableStats={ALL_SUB_STATS}
                            selectedStats={subStats}
                            onChange={setSubStats}
                        />
                    </div>
                </div>

                <div className="dialog-actions">
                    <button onClick={onClose}>キャンセル</button>
                    <button className="save-button" onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
};
