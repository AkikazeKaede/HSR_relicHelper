import React, { useState, useEffect } from 'react';
import type { CharacterFilter, StatType, RelicSet } from '../types';
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

export const CharacterEditDialog: React.FC<CharacterEditDialogProps> = ({ isOpen, initialData, onClose, onSave, relicSets, planarSets }) => {
    const [name, setName] = useState('');
    const [targetRelicSets, setTargetRelicSets] = useState<string[]>([]);
    const [targetPlanarSets, setTargetPlanarSets] = useState<string[]>([]);
    const [mainStats, setMainStats] = useState<CharacterFilter['mainStats']>({
        body: [], feet: [], planarSphere: [], linkRope: []
    });
    const [subStats, setSubStats] = useState<StatType[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.characterName);
                setTargetRelicSets(initialData.targetRelicSets);
                setTargetPlanarSets(initialData.targetPlanarSets);
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

    const toggleMainStat = (slot: keyof CharacterFilter['mainStats'], stat: StatType) => {
        const currentList = mainStats[slot];
        const newList = currentList.includes(stat)
            ? currentList.filter(s => s !== stat)
            : [...currentList, stat];

        setMainStats({ ...mainStats, [slot]: newList });
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-content">
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
                        <h3>メインステータス</h3>
                        <div className="stats-grid">
                            <div className="stat-column">
                                <h4>胴</h4>
                                {MainStats.Body.map(stat => (
                                    <label key={stat}>
                                        <input
                                            type="checkbox"
                                            checked={mainStats.body.includes(stat)}
                                            onChange={() => toggleMainStat('body', stat)}
                                        /> {STAT_LABELS[stat]}
                                    </label>
                                ))}
                            </div>
                            <div className="stat-column">
                                <h4>脚</h4>
                                {MainStats.Feet.map(stat => (
                                    <label key={stat}>
                                        <input
                                            type="checkbox"
                                            checked={mainStats.feet.includes(stat)}
                                            onChange={() => toggleMainStat('feet', stat)}
                                        /> {STAT_LABELS[stat]}
                                    </label>
                                ))}
                            </div>
                            <div className="stat-column">
                                <h4>オーブ</h4>
                                {MainStats.PlanarSphere.map(stat => (
                                    <label key={stat}>
                                        <input
                                            type="checkbox"
                                            checked={mainStats.planarSphere.includes(stat)}
                                            onChange={() => toggleMainStat('planarSphere', stat)}
                                        /> {STAT_LABELS[stat]}
                                    </label>
                                ))}
                            </div>
                            <div className="stat-column">
                                <h4>縄</h4>
                                {MainStats.LinkRope.map(stat => (
                                    <label key={stat}>
                                        <input
                                            type="checkbox"
                                            checked={mainStats.linkRope.includes(stat)}
                                            onChange={() => toggleMainStat('linkRope', stat)}
                                        /> {STAT_LABELS[stat]}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>サブステータス</h3>
                        <div className="selection-grid">
                            {ALL_SUB_STATS.map(stat => (
                                <label key={stat} className={`selection-item ${subStats.includes(stat) ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={subStats.includes(stat)}
                                        onChange={() => toggleSelection(subStats as string[], stat, setSubStats as any)}
                                    />
                                    {STAT_LABELS[stat]}
                                </label>
                            ))}
                        </div>
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
