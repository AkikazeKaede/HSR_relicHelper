import React from 'react';
import type { StatusItem } from '../types';
import { calculateStatus } from '../utils/statusCalculation';
import './StatusMemoPanel.css';

interface StatusMemoPanelProps {
    initialItems: StatusItem[];
    onEdit: () => void;
}

export const StatusMemoPanel: React.FC<StatusMemoPanelProps> = ({ initialItems, onEdit }) => {

    const result = calculateStatus(initialItems || []);

    return (
        <div className="status-memo-panel">
            <div className="status-memo-header">
                <h3>ステータスメモ (速度)</h3>
                <button className="action-button secondary compact" onClick={onEdit}>編集</button>
            </div>

            <div className="status-memo-content read-only">
                <div className="status-memo-result-container">
                    <div className="result-group">
                        <div className="result-display-sub">
                            <span className="result-label-sub">ステータス画面:</span>
                            <span className="result-value-sub">{result.statusScreenFinal.toFixed(1)}</span>
                        </div>
                        <div className="result-display-main">
                            <span className="result-label">最終値 (戦闘中):</span>
                            <span className="result-value-inline">{result.finalTotal.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
