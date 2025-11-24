import React, { useRef, useEffect, useState } from 'react';
import type { CharacterFilter, RelicSet } from '../types';
import { STAT_LABELS } from '../constants';
import './CharacterList.css';

interface CharacterListProps {
    characters: CharacterFilter[];
    relicSets: RelicSet[];
    planarSets: RelicSet[];
    onAdd: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    highlightedCharacterId?: string;
}

export const CharacterList: React.FC<CharacterListProps & { onImport: (data: CharacterFilter[]) => void }> = ({ characters, relicSets, planarSets, onAdd, onEdit, onDelete, highlightedCharacterId, onImport }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // 外部からのナビゲーション（ハイライト）を処理
    useEffect(() => {
        if (highlightedCharacterId) {
            setSelectedId(highlightedCharacterId);
            // リストアイテムを表示領域にスクロール
            if (itemRefs.current[highlightedCharacterId]) {
                itemRefs.current[highlightedCharacterId]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    }, [highlightedCharacterId]);

    // デフォルトの選択ロジック
    useEffect(() => {
        if (!selectedId && characters.length > 0 && !highlightedCharacterId) {
            setSelectedId(characters[0].id);
        } else if (selectedId && !characters.find(c => c.id === selectedId)) {
            setSelectedId(characters.length > 0 ? characters[0].id : null);
        }
    }, [characters, selectedId, highlightedCharacterId]);

    const getRelicName = (id: string): string => {
        const allSets = [...relicSets, ...planarSets];
        const found = allSets.find(s => s.id === id);
        return found ? found.name : id;
    };

    const selectedCharacter = characters.find(c => c.id === selectedId);

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setCheckedIds(new Set());
        setMessage(null);
    };

    const toggleCheck = (id: string) => {
        const newChecked = new Set(checkedIds);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedIds(newChecked);
    };

    const handleExport = async () => {
        if (checkedIds.size === 0) {
            setMessage({ type: 'error', text: 'エクスポートするキャラクターを選択してください' });
            return;
        }

        const exportData = characters.filter(c => checkedIds.has(c.id));
        const dataStr = JSON.stringify(exportData, null, 2);

        try {
            const result = await window.electron.exportData(dataStr);
            if (result.success) {
                setMessage({ type: 'success', text: `${checkedIds.size}件のキャラクターをエクスポートしました` });
                setSelectionMode(false);
                setCheckedIds(new Set());
            } else if (!result.canceled) {
                setMessage({ type: 'error', text: `エクスポートに失敗しました: ${result.error}` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `エラーが発生しました: ${error}` });
        }
    };

    const handleImport = async () => {
        try {
            const result = await window.electron.importData();
            if (result.success && result.data) {
                try {
                    const parsedData = JSON.parse(result.data);
                    if (Array.isArray(parsedData)) {
                        // 検証とフィルタリング
                        const validChars: CharacterFilter[] = [];
                        let invalidCount = 0;

                        parsedData.forEach((item: any) => {
                            // 基本的な検証: 必須フィールドの確認
                            if (item.characterName && item.targetRelicSets && item.mainStats) {
                                // 競合を避けるために新しいIDを割り当て
                                const newChar = {
                                    ...item,
                                    id: crypto.randomUUID(),
                                    updatedAt: Date.now()
                                };
                                validChars.push(newChar);
                            } else {
                                invalidCount++;
                            }
                        });

                        if (validChars.length > 0) {
                            onImport(validChars);
                            setMessage({
                                type: 'success',
                                text: `${validChars.length}件インポートしました${invalidCount > 0 ? ` (${invalidCount}件スキップ)` : ''}`
                            });
                        } else {
                            setMessage({ type: 'error', text: '有効なキャラクターデータが見つかりませんでした' });
                        }
                    } else {
                        setMessage({ type: 'error', text: '無効なデータ形式です' });
                    }
                } catch {
                    setMessage({ type: 'error', text: 'JSONの解析に失敗しました' });
                }
            } else if (!result.canceled) {
                setMessage({ type: 'error', text: `インポートに失敗しました: ${result.error}` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `エラーが発生しました: ${error}` });
        }
    };

    return (
        <div className="character-list-container">
            <div className="list-header">
                <h2>登録キャラクター一覧</h2>
                <div className="header-actions">
                    {selectionMode ? (
                        <>
                            <button className="action-button secondary" onClick={toggleSelectionMode}>キャンセル</button>
                            <button className="action-button primary" onClick={handleExport}>選択をエクスポート</button>
                        </>
                    ) : (
                        <>
                            <button className="action-button secondary" onClick={handleImport}>インポート</button>
                            <button className="action-button secondary" onClick={toggleSelectionMode}>選択 / エクスポート</button>
                            <button className="add-button" onClick={onAdd}>+ 新規登録</button>
                        </>
                    )}
                </div>
            </div>

            {message && (
                <div className={`message ${message.type}`} style={{ marginBottom: '10px' }}>
                    {message.text}
                </div>
            )}

            <div className="master-detail-container">
                {/* 左ペイン: キャラクターリスト */}
                <div className="character-list-pane" ref={listRef}>
                    {characters.length === 0 ? (
                        <div className="empty-state">キャラクターが登録されていません</div>
                    ) : (
                        characters.map(char => (
                            <div
                                key={char.id}
                                ref={el => { itemRefs.current[char.id] = el; }}
                                className={`character-list-item ${selectedId === char.id ? 'selected' : ''}`}
                                onClick={() => {
                                    if (selectionMode) {
                                        toggleCheck(char.id);
                                    } else {
                                        setSelectedId(char.id);
                                    }
                                }}
                            >
                                {selectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={checkedIds.has(char.id)}
                                        onChange={() => toggleCheck(char.id)}
                                        className="char-checkbox"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                <div className="char-name">{char.characterName}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* 右ペイン: キャラクター詳細 */}
                <div className="character-detail-pane">
                    {selectedCharacter ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>{selectedCharacter.characterName}</h3>
                                <div className="detail-actions">
                                    <button onClick={() => onEdit(selectedCharacter.id)}>編集</button>
                                    <button className="delete-btn" onClick={() => onDelete(selectedCharacter.id)}>削除</button>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>トンネル遺物</h4>
                                <div className="text-list">
                                    {selectedCharacter.targetRelicSets.length > 0 ? (
                                        selectedCharacter.targetRelicSets.map(id => (
                                            <div key={id} className="text-item">
                                                {getRelicName(id)}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="empty-text">未設定</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>次元界オーナメント</h4>
                                <div className="text-list">
                                    {selectedCharacter.targetPlanarSets.length > 0 ? (
                                        selectedCharacter.targetPlanarSets.map(id => (
                                            <div key={id} className="text-item">
                                                {getRelicName(id)}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="empty-text">未設定</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>メインステータス</h4>
                                <div className="main-stats-list">
                                    <div className="stat-row-vertical">
                                        <span className="label">胴:</span>
                                        <span className="value">
                                            {selectedCharacter.mainStats.body.length > 0
                                                ? selectedCharacter.mainStats.body.map(s => STAT_LABELS[s]).join(', ')
                                                : '指定なし'}
                                        </span>
                                    </div>
                                    <div className="stat-row-vertical">
                                        <span className="label">脚:</span>
                                        <span className="value">
                                            {selectedCharacter.mainStats.feet.length > 0
                                                ? selectedCharacter.mainStats.feet.map(s => STAT_LABELS[s]).join(', ')
                                                : '指定なし'}
                                        </span>
                                    </div>
                                    <div className="stat-row-vertical">
                                        <span className="label">オーブ:</span>
                                        <span className="value">
                                            {selectedCharacter.mainStats.planarSphere.length > 0
                                                ? selectedCharacter.mainStats.planarSphere.map(s => STAT_LABELS[s]).join(', ')
                                                : '指定なし'}
                                        </span>
                                    </div>
                                    <div className="stat-row-vertical">
                                        <span className="label">縄:</span>
                                        <span className="value">
                                            {selectedCharacter.mainStats.linkRope.length > 0
                                                ? selectedCharacter.mainStats.linkRope.map(s => STAT_LABELS[s]).join(', ')
                                                : '指定なし'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>サブステータス</h4>
                                <div className="sub-stats-list">
                                    {selectedCharacter.subStats.length > 0
                                        ? selectedCharacter.subStats.map(s => STAT_LABELS[s]).join(' / ')
                                        : '指定なし'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            キャラクターを選択してください
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
