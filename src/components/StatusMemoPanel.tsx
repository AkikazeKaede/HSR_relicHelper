import React from 'react';
import type { StatusMemoMap, MemoStatusType } from '../types';
import { calculateStatus } from '../utils/statusCalculation';
import './StatusMemoPanel.css';

interface StatusMemoPanelProps {
    memoMap: StatusMemoMap;
    onEdit: (tab?: MemoStatusType) => void;
}

const STAT_LABELS: Record<MemoStatusType, string> = {
    Speed: '速度',
    CritRate: '会心率',
    BreakEffect: '撃破特効',
    EffectHitRate: '効果命中',
    EffectRes: '効果抵抗'
};

export const StatusMemoPanel: React.FC<StatusMemoPanelProps> = ({ memoMap, onEdit }) => {
    // Check if there is any data
    const hasData = memoMap && Object.values(memoMap).some(items => items && items.length > 0);

    return (
        <div className="status-memo-panel">
            <div className="status-memo-panel-header">
                <h3>ステータスメモ</h3>
            </div>

            <div className="status-memo-content read-only">
                {hasData ? (
                    <div className="status-memo-card-list">
                        {(Object.keys(STAT_LABELS) as MemoStatusType[]).map(type => {
                            const items = memoMap[type];
                            if (!items || items.length === 0) return null;

                            const result = calculateStatus(items);
                            // Avoid showing if base is 0 and no modifiers (optional, but cleaner)
                            if (result.finalTotal === 0 && result.baseTotal === 0) return null;

                            const statusScreenVal = result.statusScreenFinal.toFixed(1) + (type !== 'Speed' ? '%' : '');
                            const finalVal = result.finalTotal.toFixed(1) + (type !== 'Speed' ? '%' : '');

                            return (
                                <div
                                    key={type}
                                    className="status-memo-card"
                                    onClick={() => onEdit(type)}
                                    title={`ステータス画面: ${statusScreenVal}`}
                                >
                                    <div className="card-label">
                                        {STAT_LABELS[type]}
                                    </div>
                                    <div className="card-value">
                                        {finalVal}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-memo-result">
                        <button className="add-status-btn" onClick={() => onEdit()}>
                            + ステータスメモを追加
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};
