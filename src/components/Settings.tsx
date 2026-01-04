import React, { useState } from 'react';
import type { RelicSet } from '../types';
import { RelicManagerDialog } from './RelicManagerDialog';
import './Settings.css';

interface SettingsProps {
    relicSets: RelicSet[];
    planarSets: RelicSet[];
    onUpdateRelics: (sets: RelicSet[]) => void;
    onUpdatePlanars: (sets: RelicSet[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ relicSets, planarSets, onUpdateRelics, onUpdatePlanars }) => {
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);



    const handleExportRelics = async () => {
        try {
            const data = JSON.stringify({ relicSets, planarSets }, null, 2);
            const result = await window.electron.exportRelics(data);
            if (result.success) {
                setMessage({ type: 'success', text: '遺物データをエクスポートしました' });
            } else if (!result.canceled) {
                setMessage({ type: 'error', text: 'エクスポートに失敗しました: ' + result.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'エラーが発生しました' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleImportRelics = async () => {
        try {
            const result = await window.electron.importRelics();
            if (result.success && result.data) {
                const parsed = JSON.parse(result.data);
                if (parsed.relicSets && Array.isArray(parsed.relicSets)) {
                    onUpdateRelics(parsed.relicSets);
                }
                if (parsed.planarSets && Array.isArray(parsed.planarSets)) {
                    onUpdatePlanars(parsed.planarSets);
                }
                setMessage({ type: 'success', text: '遺物データをインポートしました' });
            } else if (!result.canceled) {
                setMessage({ type: 'error', text: 'インポートに失敗しました: ' + result.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: '無効なデータ形式です' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="settings-container">
            <h2>設定</h2>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="settings-section">
                <h3>遺物データ管理</h3>
                <p className="section-description">
                    遺物セットや次元界オーナメントのデータを追加・編集・削除します。
                </p>

                <div className="relic-management-controls">
                    <button className="primary-button" onClick={() => setIsManagerOpen(true)}>
                        遺物データを管理する
                    </button>

                    <div className="import-export-group">
                        <button className="secondary-button" onClick={handleExportRelics}>エクスポート</button>
                        <button className="secondary-button" onClick={handleImportRelics}>インポート</button>
                    </div>
                </div>
            </div>



            <div className="settings-section">
                <h3>アプリケーション情報</h3>
                <p>バージョン: 1.0.1</p>
                <p>作者: Gemini 3 Pro</p>
            </div>

            <RelicManagerDialog
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                relicSets={relicSets}
                planarSets={planarSets}
                onUpdateRelics={onUpdateRelics}
                onUpdatePlanars={onUpdatePlanars}
            />
        </div>
    );
};
