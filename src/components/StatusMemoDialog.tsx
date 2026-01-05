import React, { useState, useEffect } from 'react';
import type { StatusItem, StatusMemoMap, MemoStatusType } from '../types';
import { calculateStatus } from '../utils/statusCalculation';
import './StatusMemoDialog.css';

interface StatusMemoDialogProps {
    initialMemo: StatusMemoMap;
    initialTab?: MemoStatusType;
    onSave: (memo: StatusMemoMap) => void;
    onClose: () => void;
}

const STAT_TYPES: { id: MemoStatusType; label: string }[] = [
    { id: 'Speed', label: '速度' },
    { id: 'CritRate', label: '会心率' },
    { id: 'BreakEffect', label: '撃破特効' },
    { id: 'EffectHitRate', label: '効果命中' },
    { id: 'EffectRes', label: '効果抵抗' },
];

export const StatusMemoDialog: React.FC<StatusMemoDialogProps> = ({ initialMemo, initialTab, onSave, onClose }) => {
    // Local type to allow string input (for handling "-", empty string, etc.)
    interface DraftStatusItem extends Omit<StatusItem, 'value'> {
        value: number | string;
    }

    const [activeStatus, setActiveStatus] = useState<MemoStatusType>(initialTab || 'Speed');
    const [memoMap, setMemoMap] = useState<Record<MemoStatusType, DraftStatusItem[]>>({
        Speed: [],
        CritRate: [],
        BreakEffect: [],
        EffectHitRate: [],
        EffectRes: []
    });

    // Load initial data
    useEffect(() => {
        const newMap: Record<MemoStatusType, DraftStatusItem[]> = {
            Speed: [],
            CritRate: [],
            BreakEffect: [],
            EffectHitRate: [],
            EffectRes: []
        };

        STAT_TYPES.forEach(stat => {
            const items = initialMemo[stat.id];
            if (!items || items.length === 0) {
                newMap[stat.id] = [
                    { id: crypto.randomUUID(), name: '基礎値', value: 0, type: 'Base', operation: 'Add', enabled: true, isInBattle: false }
                ];
            } else {
                const loaded = JSON.parse(JSON.stringify(items));
                const hasBase = loaded.some((i: any) => i.type === 'Base');
                if (!hasBase) {
                    newMap[stat.id] = [
                        { id: crypto.randomUUID(), name: '基礎値', value: 0, type: 'Base', operation: 'Add', enabled: true, isInBattle: false },
                        ...loaded
                    ];
                } else {
                    newMap[stat.id] = loaded;
                }
            }
        });
        setMemoMap(newMap);
    }, [initialMemo]);

    const currentItems = memoMap[activeStatus];

    const setCurrentItems = (items: DraftStatusItem[]) => {
        setMemoMap(prev => ({
            ...prev,
            [activeStatus]: items
        }));
    };

    const baseValueItemIndex = currentItems.findIndex(i => i.type === 'Base');
    const baseValueItem = baseValueItemIndex >= 0 ? currentItems[baseValueItemIndex] : null;

    const modifiers = currentItems.filter((_, idx) => idx !== baseValueItemIndex);
    const baseModifiers = modifiers.filter(i => i.type === 'Base');
    const additionalModifiers = modifiers.filter(i => i.type === 'Additional');

    // Helper to covert draft items to strict items for calculation/saving
    const getStrictItems = (draftItems: DraftStatusItem[]): StatusItem[] => {
        return draftItems.map(item => ({
            ...item,
            value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value
        }));
    };

    const result = calculateStatus(getStrictItems(currentItems));

    const handleBaseValueChange = (val: string) => {
        // Allow empty string or minus sign, otherwise parse
        if (val === '' || val === '-') {
            updateModifierValue(baseValueItemIndex, val);
            return;
        }
        const num = parseFloat(val);
        if (!isNaN(num)) {
            updateModifierValue(baseValueItemIndex, num);
        } else {
            updateModifierValue(baseValueItemIndex, val);
        }
    };

    const updateModifierValue = (index: number, val: number | string) => {
        if (index >= 0) {
            const newItems = [...currentItems];
            newItems[index] = { ...newItems[index], value: val };
            setCurrentItems(newItems);
        }
    };

    const addModifier = (type: 'Base' | 'Additional') => {
        const newItem: DraftStatusItem = {
            id: crypto.randomUUID(),
            name: '',
            value: 0,
            type: type,
            operation: 'Add',
            enabled: true,
            isInBattle: true // Default Checked
        };
        setCurrentItems([...currentItems, newItem]);
    };

    const updateModifier = (id: string, field: keyof StatusItem, value: any) => {
        setCurrentItems(currentItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Special handler for value to allow string
    const updateModifierVal = (id: string, val: string) => {
        // Allow empty string or minus sign
        if (val === '' || val === '-') {
            setCurrentItems(currentItems.map(item => item.id === id ? { ...item, value: val } : item));
            return;
        }
        const num = parseFloat(val);
        setCurrentItems(currentItems.map(item => item.id === id ? { ...item, value: !isNaN(num) ? num : val } : item));
    };

    const removeModifier = (id: string) => {
        setCurrentItems(currentItems.filter(item => item.id !== id));
    };

    const handleSave = () => {
        const finalMap: StatusMemoMap = {};
        STAT_TYPES.forEach(stat => {
            finalMap[stat.id] = getStrictItems(memoMap[stat.id]);
        });
        onSave(finalMap);
        onClose();
    };

    // Helper for checkboxes
    const renderModifierRow = (mod: any) => (
        <div key={mod.id} className={`memo-item-row ${mod.enabled === false ? 'disabled' : ''}`}>
            <div className="checkbox-group">
                <label className="checkbox-label" title="有効/無効">
                    <input
                        type="checkbox"
                        checked={mod.enabled !== false}
                        onChange={e => updateModifier(mod.id, 'enabled', e.target.checked)}
                    />
                    <span className="checkbox-text">有効</span>
                </label>
                <label className="checkbox-label" title="戦闘中加算 (チェックでステータス画面計算から除外)">
                    <input
                        type="checkbox"
                        checked={mod.isInBattle !== false}
                        onChange={e => updateModifier(mod.id, 'isInBattle', e.target.checked)}
                    />
                    <span className="checkbox-text">戦闘中</span>
                </label>
            </div>

            <input
                type="text"
                placeholder="項目名"
                className="memo-input name-input"
                value={mod.name}
                onChange={e => updateModifier(mod.id, 'name', e.target.value)}
            />
            <button
                className={`operation-toggle-btn ${mod.operation === 'Multiply' ? 'multiply' : 'add'}`}
                onClick={() => updateModifier(mod.id, 'operation', mod.operation === 'Add' ? 'Multiply' : 'Add')}
                title="クリックして切り替え (加算/乗算)"
            >
                {mod.operation === 'Add' ? '加算 (+)' : '乗算 (%)'}
            </button>
            <input
                type="number"
                className="memo-input value-input"
                value={mod.value}
                onChange={e => updateModifierVal(mod.id, e.target.value)}
            />
            <span className={`unit-label ${mod.operation === 'Add' ? 'hidden' : ''}`}>%</span>
            <button className="remove-btn" onClick={() => removeModifier(mod.id)}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );

    return (
        <div className="status-memo-overlay" onClick={onClose}>
            <div className="status-memo-dialog" onClick={e => e.stopPropagation()}>
                <div className="status-memo-header">
                    <h3>ステータスメモ</h3>
                    <button className="remove-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="status-memo-body">
                    {/* Sidebar */}
                    <div className="status-sidebar">
                        {STAT_TYPES.map(stat => (
                            <button
                                key={stat.id}
                                className={`sidebar-item ${activeStatus === stat.id ? 'active' : ''}`}
                                onClick={() => setActiveStatus(stat.id)}
                            >
                                {stat.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="status-content-area">
                        <div className="status-memo-content">
                            {/* 1. Base Value (No Flags, assumed Enabled and !InBattle) */}
                            <div className="memo-section">
                                <h4>{STAT_TYPES.find(s => s.id === activeStatus)?.label} - 基礎ステータス (Base)</h4>
                                <div className="memo-row base-value-row">
                                    <label>基礎値</label>
                                    <input
                                        type="number"
                                        className="memo-input"
                                        value={baseValueItem ? baseValueItem.value : 0}
                                        onChange={e => handleBaseValueChange(e.target.value)}
                                    />
                                </div>

                                <div className="memo-list">
                                    {baseModifiers.map(mod => renderModifierRow(mod))}
                                    <button className="add-item-btn" onClick={() => addModifier('Base')}>+ 補正を追加</button>
                                </div>
                            </div>

                            {/* 2. Additional Modifiers */}
                            <div className="memo-section">
                                <h4>追加ステータス (Additional)</h4>
                                <div className="memo-list">
                                    {additionalModifiers.map(mod => renderModifierRow(mod))}
                                    <button className="add-item-btn" onClick={() => addModifier('Additional')}>+ 補正を追加</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-memo-footer">
                    <div className="result-group">
                        <div className="result-display">
                            <span className="result-label">ステータス画面:</span>
                            <span className="result-value">
                                {result.statusScreenFinal.toFixed(1)}
                                {activeStatus !== 'Speed' && '%'}
                            </span>
                        </div>
                        <div className="result-display">
                            <span className="result-label">最終値 (戦闘中):</span>
                            <span className="result-value">
                                {result.finalTotal.toFixed(1)}
                                {activeStatus !== 'Speed' && '%'}
                            </span>
                        </div>
                    </div>
                    <div className="footer-actions">
                        <button className="action-button secondary" onClick={onClose}>キャンセル</button>
                        <button className="action-button primary" onClick={handleSave}>保存</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
