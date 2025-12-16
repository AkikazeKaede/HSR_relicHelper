import React, { useState, useMemo } from 'react';
import type { CharacterFilter, RelicSet } from '../types';
import { STAT_LABELS } from '../constants';
import './RelicReverseLookup.css';

interface RelicReverseLookupProps {
    characters: CharacterFilter[];
    relicSets: RelicSet[];
    planarSets: RelicSet[];
}

type TabType = 'Cavern' | 'Planar';

interface StatGroup {
    stat: string;
    characters: string[];
}

interface SlotGroup {
    slotName: string;
    stats: StatGroup[];
}

interface SetBreakdown {
    id: string;
    name: string;
    group?: number;
    slots: SlotGroup[];
    subStats: StatGroup[];
    totalChars: number;
    charIdMap?: Record<string, string>;
}

export const RelicReverseLookup: React.FC<RelicReverseLookupProps & { onNavigateToCharacter: (id: string) => void }> = ({ characters, onNavigateToCharacter, relicSets, planarSets }) => {
    const [activeTab, setActiveTab] = useState<TabType>('Cavern');
    const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

    const toggleSet = (setId: string) => {
        const newExpanded = new Set(expandedSets);
        if (newExpanded.has(setId)) {
            newExpanded.delete(setId);
        } else {
            newExpanded.add(setId);
        }
        setExpandedSets(newExpanded);
    };

    const targetSets = activeTab === 'Cavern' ? relicSets : planarSets;

    const breakdownData = useMemo(() => {
        const data: SetBreakdown[] = [];

        targetSets.forEach(set => {
            // グループ化のための一時ストレージ
            const slotMap: Record<string, Record<string, string[]>> = {};
            const subStatMap: Record<string, string[]> = {};
            const uniqueChars = new Set<string>();
            const charIdMap: Record<string, string> = {}; // ナビゲーション用に名前をIDにマッピング

            // タブに基づいてスロットを初期化
            const targetSlots = activeTab === 'Cavern'
                ? ['胴体', '脚部']
                : ['次元界オーブ', '連結縄'];

            targetSlots.forEach(slot => {
                slotMap[slot] = {};
            });

            characters.forEach(char => {
                const hasSet = activeTab === 'Cavern'
                    ? char.targetRelicSets.includes(set.id)
                    : char.targetPlanarSets.includes(set.id);

                if (hasSet) {
                    uniqueChars.add(char.characterName);
                    charIdMap[char.characterName] = char.id;

                    // 1. メインステータスの内訳
                    if (activeTab === 'Cavern') {
                        // Body
                        char.mainStats.body.forEach(item => {
                            const label = STAT_LABELS[item.stat];
                            if (!slotMap['胴体'][label]) slotMap['胴体'][label] = [];
                            slotMap['胴体'][label].push(char.characterName);
                        });
                        // Feet
                        char.mainStats.feet.forEach(item => {
                            const label = STAT_LABELS[item.stat];
                            if (!slotMap['脚部'][label]) slotMap['脚部'][label] = [];
                            slotMap['脚部'][label].push(char.characterName);
                        });
                    } else {
                        // Sphere
                        char.mainStats.planarSphere.forEach(item => {
                            const label = STAT_LABELS[item.stat];
                            if (!slotMap['次元界オーブ'][label]) slotMap['次元界オーブ'][label] = [];
                            slotMap['次元界オーブ'][label].push(char.characterName);
                        });
                        // Rope
                        char.mainStats.linkRope.forEach(item => {
                            const label = STAT_LABELS[item.stat];
                            if (!slotMap['連結縄'][label]) slotMap['連結縄'][label] = [];
                            slotMap['連結縄'][label].push(char.characterName);
                        });
                    }

                    // 2. サブステータスの内訳
                    // サブステータスのユニークな組み合わせでグループ化
                    // 順序に関係なく一貫したグループ化を保証するためにサブステータスをソート
                    const sortedSubStats = char.subStats.map(s => s.stat).sort();
                    const subStatLabel = sortedSubStats.length > 0
                        ? sortedSubStats.map(s => STAT_LABELS[s]).join(' / ')
                        : '指定なし';

                    if (!subStatMap[subStatLabel]) subStatMap[subStatLabel] = [];
                    subStatMap[subStatLabel].push(char.characterName);
                }
            });

            // マップを配列構造に変換
            if (uniqueChars.size > 0) {
                const slots: SlotGroup[] = Object.entries(slotMap).map(([slotName, statsMap]) => ({
                    slotName,
                    stats: Object.entries(statsMap).map(([stat, chars]) => ({
                        stat,
                        characters: chars
                    }))
                }));

                const subStats: StatGroup[] = Object.entries(subStatMap).map(([stat, chars]) => ({
                    stat,
                    characters: chars
                }));

                data.push({
                    id: set.id,
                    name: set.name,
                    group: set.group, // グループ情報を追加
                    slots,
                    subStats,
                    totalChars: uniqueChars.size,
                    charIdMap // ナビゲーション用にマップを渡す
                });
            }
        });

        // グループ番号でソート
        data.sort((a, b) => {
            if (a.group && b.group) {
                return a.group - b.group;
            }
            return 0;
        });

        return data;
    }, [characters, activeTab, targetSets]);

    return (
        <div className="reverse-lookup-container">
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'Cavern' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Cavern')}
                    >
                        トンネル遺物
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'Planar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Planar')}
                    >
                        次元界オーナメント
                    </button>
                </div>
            </div>

            <div className="sets-list">
                {breakdownData.map((set, index) => {
                    const isExpanded = expandedSets.has(set.id);
                    // グループIDの偶奇に基づいてグループバリアントクラス（1または2）を決定
                    // 同じグループのアイテムが同じ色を共有するようにグループ番号を直接使用
                    const groupVariant = set.group ? (set.group % 2 !== 0 ? 'group-variant-1' : 'group-variant-2') : '';

                    // 区切り線が必要か確認（前のアイテムとグループが変わった場合）
                    const prevSet = index > 0 ? breakdownData[index - 1] : null;
                    const showSeparator = prevSet && set.group !== prevSet.group;

                    return (
                        <React.Fragment key={set.id}>
                            {showSeparator && <hr className="group-separator" />}
                            <div className={`set-accordion ${groupVariant}`}>
                                <div
                                    className="set-header"
                                    onClick={() => toggleSet(set.id)}
                                >
                                    <span className="set-name">{set.name}</span>
                                    <span className="char-count">{set.totalChars} キャラ</span>
                                    <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                                </div>

                                {isExpanded && (
                                    <div className="set-content">
                                        {/* Main Stats per Slot */}
                                        {set.slots.map(slot => (
                                            <div key={slot.slotName} className="breakdown-section">
                                                <div className="section-title">{slot.slotName}</div>
                                                <div className="stat-rows">
                                                    {slot.stats.length > 0 ? (
                                                        slot.stats.map(statGroup => (
                                                            <div key={statGroup.stat} className="stat-row">
                                                                <div className="stat-name">{statGroup.stat}</div>
                                                                <div className="char-list">
                                                                    {statGroup.characters.map((char, idx) => (
                                                                        <span
                                                                            key={`${char}-${idx}`}
                                                                            className="char-tag clickable"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const charId = set.charIdMap?.[char];
                                                                                if (charId) onNavigateToCharacter(charId);
                                                                            }}
                                                                        >
                                                                            {char}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="empty-row">指定なし</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Sub Stats */}
                                        <div className="breakdown-section">
                                            <div className="section-title">サブステータス</div>
                                            <div className="stat-rows">
                                                {set.subStats.map(statGroup => (
                                                    <div key={statGroup.stat} className="stat-row">
                                                        <div className="stat-name">{statGroup.stat}</div>
                                                        <div className="char-list">
                                                            {statGroup.characters.map((char, idx) => (
                                                                <span
                                                                    key={`${char}-${idx}`}
                                                                    className="char-tag clickable"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const charId = set.charIdMap?.[char];
                                                                        if (charId) onNavigateToCharacter(charId);
                                                                    }}
                                                                >
                                                                    {char}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}

                {breakdownData.length === 0 && (
                    <div className="empty-message">
                        該当するキャラクターがいません
                    </div>
                )}
            </div>
        </div>
    );
};
