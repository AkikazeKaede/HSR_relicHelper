export interface ElectronAPI {
    saveData: (data: string) => Promise<{ success: boolean; error?: string }>;
    loadData: () => Promise<{ success: boolean; data?: string | null; error?: string }>;
    exportData: (data: string) => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
    importData: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>;
    saveRelics: (data: string) => Promise<{ success: boolean; error?: string }>;
    loadRelics: () => Promise<{ success: boolean; data?: string | null; error?: string }>;
    exportRelics: (data: string) => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
    importRelics: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
