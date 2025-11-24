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
        body: StatType[];
        feet: StatType[];
        planarSphere: StatType[];
        linkRope: StatType[];
    };

    // Target Sub Stats (Unordered set)
    subStats: StatType[];

    note?: string;
}
