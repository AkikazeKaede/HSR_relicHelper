import type { StatusItem } from '../types';

export interface CalculationResult {
    baseTotal: number;
    finalTotal: number;
    statusScreenFinal: number;
}

const performCalculation = (items: StatusItem[]): { baseTotal: number, finalTotal: number } => {
    if (!items || items.length === 0) {
        return { baseTotal: 0, finalTotal: 0 };
    }

    // 1. Identify Base Value
    const baseItems = items.filter(i => i.type === 'Base');

    if (baseItems.length === 0) {
        return { baseTotal: 0, finalTotal: 0 };
    }

    const baseValueItem = baseItems[0];
    const baseValue = baseValueItem.value;

    // 2. Sum other 'Base' modifiers
    let baseModifiers = 0;

    // Process remaining base items
    for (let i = 1; i < baseItems.length; i++) {
        const item = baseItems[i];
        if (item.operation === 'Add') {
            baseModifiers += item.value;
        } else if (item.operation === 'Multiply') {
            // User inputs percentage (e.g. 8 for 8%), so we divide by 100
            baseModifiers += baseValue * (item.value / 100);
        }
    }

    // 3. BaseTotal
    const baseTotal = baseValue + baseModifiers;

    // 4. Sum 'Additional' modifiers
    const additionalItems = items.filter(i => i.type === 'Additional');
    let additionalModifiers = 0;

    for (const item of additionalItems) {
        if (item.operation === 'Add') {
            additionalModifiers += item.value;
        } else if (item.operation === 'Multiply') {
            // User inputs percentage (e.g. 8 for 8%), so we divide by 100
            additionalModifiers += baseTotal * (item.value / 100);
        }
    }

    // 5. FinalTotal
    const finalTotal = baseTotal + additionalModifiers;

    return {
        baseTotal,
        finalTotal
    };
};

/**
 * Calculates the total status value based on a list of status items.
 * 
 * Logic:
 * 1. Identify Base Value (first 'Base' item).
 * 2. Sum other 'Base' modifiers (Flat adds to sum, Percent adds BaseValue * (Value/100)).
 * 3. BaseTotal = BaseValue + BaseModifiers.
 * 4. Sum 'Additional' modifiers (Flat adds to sum, Percent adds totalBase * (Value/100)).
 * 5. FinalTotal = BaseTotal + AdditionalModifiers.
 */
export const calculateStatus = (items: StatusItem[]): CalculationResult => {
    // Filter enabled items (treat undefined as true)
    const enabledItems = items.filter(i => i.enabled !== false);

    // 1. Calculate In-Battle Total (All enabled items)
    const inBattleResult = performCalculation(enabledItems);

    // 2. Calculate Status Screen Total (Enabled items where isInBattle is false)
    // Note: The first base item (Base Value) usually has isInBattle=false, so it's included.
    const statusScreenItems = enabledItems.filter(i => i.isInBattle === false);
    const statusScreenResult = performCalculation(statusScreenItems);

    return {
        baseTotal: inBattleResult.baseTotal,
        finalTotal: inBattleResult.finalTotal,
        statusScreenFinal: statusScreenResult.finalTotal
    };
};
