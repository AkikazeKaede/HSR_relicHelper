import React, { useState } from 'react';
import type { RelicSet } from '../types';
import './RelicManagerDialog.css';

interface RelicManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    relicSets: RelicSet[];
    planarSets: RelicSet[];
    onUpdateRelics: (sets: RelicSet[]) => void;
    onUpdatePlanars: (sets: RelicSet[]) => void;
}

export const RelicManagerDialog: React.FC<RelicManagerDialogProps> = ({
    isOpen, onClose, relicSets, planarSets, onUpdateRelics, onUpdatePlanars
}) => {
    const [activeTab, setActiveTab] = useState<'Cavern' | 'Planar'>('Cavern');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<RelicSet>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const targetSets = activeTab === 'Cavern' ? relicSets : planarSets;
    // Sort by group, then by ID
    const sortedSets = [...targetSets].sort((a, b) => {
        const groupA = a.group ?? 999;
        const groupB = b.group ?? 999;
        if (groupA !== groupB) return groupA - groupB;
        return a.id.localeCompare(b.id);
    });

    const updateTargetSets = activeTab === 'Cavern' ? onUpdateRelics : onUpdatePlanars;

    const handleEdit = (set: RelicSet) => {
        setEditingId(set.id);
        setEditForm({ ...set });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = () => {
        if (!editForm.id || !editForm.name) {
            setMessage({ type: 'error', text: 'IDと名前は必須です' });
            return;
        }

        if (editingId) {
            // Update existing
            const newSets = targetSets.map(s => s.id === editingId ? { ...s, ...editForm } as RelicSet : s);
            updateTargetSets(newSets);
            setMessage({ type: 'success', text: '更新しました' });
        } else {
            // Add new
            if (targetSets.some(s => s.id === editForm.id)) {
                setMessage({ type: 'error', text: 'このIDは既に使用されています' });
                return;
            }
            const newSet = { ...editForm, type: activeTab } as RelicSet;
            updateTargetSets([...targetSets, newSet]);
            setMessage({ type: 'success', text: '追加しました' });
        }
        handleCancelEdit();
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDelete = (id: string) => {
        if (confirm('本当に削除しますか？')) {
            updateTargetSets(targetSets.filter(s => s.id !== id));
            setMessage({ type: 'success', text: '削除しました' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleAddNew = () => {
        setEditingId(''); // Empty string indicates new item
        setEditForm({ type: activeTab, group: 1 });
        // Scroll to top to show the new input row
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-content relic-manager-dialog">
                <div className="dialog-header">
                    <h2>遺物データ管理</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'Cavern' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Cavern'); handleCancelEdit(); }}
                    >
                        トンネル遺物
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'Planar' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Planar'); handleCancelEdit(); }}
                    >
                        次元界オーナメント
                    </button>
                </div>

                <div className="manager-actions">
                    <button className="add-button" onClick={handleAddNew} disabled={editingId !== null}>
                        + 新規追加
                    </button>
                </div>

                <div className="relic-table-container" ref={tableContainerRef}>
                    <table className="relic-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>ID</th>
                                <th style={{ width: '40%' }}>名前</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>遺物入手場所<br />グループ</th>
                                <th style={{ width: '25%' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editingId === '' && (
                                <tr className="edit-row new-item">
                                    <td>
                                        <input
                                            placeholder="ID"
                                            value={editForm.id || ''}
                                            onChange={e => setEditForm({ ...editForm, id: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            placeholder="名前"
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={editForm.group || ''}
                                            onChange={e => setEditForm({ ...editForm, group: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="save-btn" onClick={handleSave}>保存</button>
                                            <button className="cancel-btn" onClick={handleCancelEdit}>キャンセル</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {sortedSets.map(set => (
                                <tr key={set.id} className={editingId === set.id ? 'edit-row' : ''}>
                                    {editingId === set.id ? (
                                        <>
                                            <td>
                                                <span className="id-static">{set.id}</span>
                                            </td>
                                            <td>
                                                <input
                                                    value={editForm.name || ''}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={editForm.group || ''}
                                                    onChange={e => setEditForm({ ...editForm, group: parseInt(e.target.value) || 1 })}
                                                />
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="save-btn" onClick={handleSave}>保存</button>
                                                    <button className="cancel-btn" onClick={handleCancelEdit}>キャンセル</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="cell-id">{set.id}</td>
                                            <td className="cell-name">{set.name}</td>
                                            <td className="cell-group">{set.group}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="edit-btn" onClick={() => handleEdit(set)}>編集</button>
                                                    <button className="delete-btn" onClick={() => handleDelete(set.id)}>削除</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
