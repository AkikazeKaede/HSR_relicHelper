export type StatType =
    | 'HP' | 'Attack' | 'Defense' | 'Speed'
    | 'CritRate' | 'CritDMG' | 'BreakEffect'
    | 'OutgoingHealing' | 'EnergyRegenRate'
    | 'EffectHitRate' | 'EffectRes'
    | 'PhysicalDMG' | 'FireDMG' | 'IceDMG' | 'LightningDMG' | 'WindDMG' | 'QuantumDMG' | 'ImaginaryDMG';

export const MainStats = {
    Head: ['HP'] as StatType[],
    Hands: ['Attack'] as StatType[],
    Body: ['HP', 'Attack', 'Defense', 'CritRate', 'CritDMG', 'OutgoingHealing', 'EffectHitRate'] as StatType[],
    Feet: ['HP', 'Attack', 'Defense', 'Speed'] as StatType[],
    PlanarSphere: ['HP', 'Attack', 'Defense', 'PhysicalDMG', 'FireDMG', 'IceDMG', 'LightningDMG', 'WindDMG', 'QuantumDMG', 'ImaginaryDMG'] as StatType[],
    LinkRope: ['HP', 'Attack', 'Defense', 'BreakEffect', 'EnergyRegenRate'] as StatType[]
};

export interface RelicSet {
    id: string;
    name: string;
    type: 'Cavern' | 'Planar'; // Cavern = Tunnel Relic, Planar = Planar Ornament
    imageUrl?: string; // Optional for now
    group?: number; // For grouping by Cavern/World
}

export type StatOperator = '>' | '>=' | '=' | '-';

export interface WeightedStat {
    stat: StatType;
    operator: StatOperator;
}


export type StatusType = 'Base' | 'Additional';
export type StatusOperation = 'Add' | 'Multiply';

export interface StatusItem {
    id: string;
    name: string;
    value: number;
    type: StatusType;
    operation: StatusOperation;
    enabled?: boolean; // Default true
    isInBattle?: boolean; // Default true (false means displayed on status screen)
}

export interface CharacterFilter {
    id: string;
    characterName: string;
    updatedAt: number;

    // Target Relic Sets (IDs)
    targetRelicSets: string[];

    // Target Planar Ornament Sets (IDs)
    targetPlanarSets: string[];

    // Target Main Stats per slot
    mainStats: {
        body: WeightedStat[];
        feet: WeightedStat[];
        planarSphere: WeightedStat[];
        linkRope: WeightedStat[];
    };

    // Target Sub Stats (Ordered list with operators)
    subStats: WeightedStat[];

    // Status Memo items
    statusMemo?: StatusItem[];

    note?: string;
}

// For migration purposes
export interface LegacyCharacterFilter extends Omit<CharacterFilter, 'mainStats' | 'subStats' | 'statusMemo'> {
    mainStats: {
        body: StatType[];
        feet: StatType[];
        planarSphere: StatType[];
        linkRope: StatType[];
    };
    subStats: StatType[];
}
