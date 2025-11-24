import type { StatType } from './types';

export const STAT_LABELS: Record<StatType, string> = {
    'HP': 'HP',
    'Attack': '攻撃力',
    'Defense': '防御力',
    'Speed': '速度',
    'CritRate': '会心率',
    'CritDMG': '会心ダメージ',
    'BreakEffect': '撃破特効',
    'OutgoingHealing': '治癒量',
    'EnergyRegenRate': 'EP回復効率',
    'EffectHitRate': '効果命中',
    'EffectRes': '効果抵抗',
    'PhysicalDMG': '物理与ダメージ',
    'FireDMG': '炎属性与ダメージ',
    'IceDMG': '氷属性与ダメージ',
    'LightningDMG': '雷属性与ダメージ',
    'WindDMG': '風属性与ダメージ',
    'QuantumDMG': '量子属性与ダメージ',
    'ImaginaryDMG': '虚数属性与ダメージ'
};
