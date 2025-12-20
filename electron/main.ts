import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// インストール/アンインストール時にWindows上でショートカットを作成/削除する処理
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

const DATA_FILE = 'hsr-relic-helper-data.json';

const createWindow = () => {
    // ブラウザウィンドウを作成
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false, // このフェーズでは簡素化のため
        },
    });

    // 本番環境ではアプリのindex.htmlを読み込む
    // 開発環境ではViteの開発サーバーURLを読み込む
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // メニューバーを完全に無効化（Altキーでも表示されないようにする）
        // 本番環境のみ適用
        mainWindow.setMenu(null);
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
};

// IPCハンドラー
ipcMain.handle('save-data', async (_, data: string) => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, DATA_FILE);
        await fs.writeFile(filePath, data, 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save data:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('load-data', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, DATA_FILE);
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return { success: true, data: null }; // ファイルがまだ存在しない
        }
        console.error('Failed to load data:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('export-data', async (_, data: string) => {
    const { filePath } = await dialog.showSaveDialog({
        title: '設定をエクスポート',
        defaultPath: 'hsr-relic-helper-backup.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
        try {
            await fs.writeFile(filePath, data, 'utf-8');
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
    return { success: false, canceled: true };
});

ipcMain.handle('import-data', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: '設定をインポート',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        try {
            const data = await fs.readFile(filePaths[0], 'utf-8');
            return { success: true, data };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
    return { success: false, canceled: true };
});

// 遺物データハンドラー
const RELIC_DATA_FILE = 'hsr-relic-helper-relics.json';

ipcMain.handle('save-relics', async (_, data: string) => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, RELIC_DATA_FILE);
        await fs.writeFile(filePath, data, 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save relic data:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('load-relics', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, RELIC_DATA_FILE);
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return { success: true, data: null }; // ファイルがまだ存在しない
        }
        console.error('Failed to load relic data:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('export-relics', async (_, data: string) => {
    const { filePath } = await dialog.showSaveDialog({
        title: '遺物データをエクスポート',
        defaultPath: 'hsr-relic-data.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
        try {
            await fs.writeFile(filePath, data, 'utf-8');
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
    return { success: false, canceled: true };
});

ipcMain.handle('import-relics', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: '遺物データをインポート',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        try {
            const data = await fs.readFile(filePaths[0], 'utf-8');
            return { success: true, data };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
    return { success: false, canceled: true };
});

// Electronの初期化が完了し、ブラウザウィンドウを作成する準備ができたときに呼び出されます。
app.on('ready', createWindow);

// macOSを除き、すべてのウィンドウが閉じられたときに終了します。
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
