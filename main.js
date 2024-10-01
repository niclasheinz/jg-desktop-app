const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settings;
const configPath = path.join(__dirname, 'config.json');

function ensureConfigFile() {
    const defaultConfigData = { enableProtocol: true };
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfigData, null, 4));
    }
    const configFile = fs.readFileSync(configPath);
    settings = JSON.parse(configFile);
}

function createWindow(url) {
    if (mainWindow) {
        mainWindow.focus();
        loadUrlInWindow(mainWindow, url);
        return;
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'build/icons/icon-512x512.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    loadUrlInWindow(mainWindow, 'https://jublaglattbrugg.ch');

    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    autoUpdater.checkForUpdatesAndNotify();
}

// Load a URL with a loader
function loadUrlInWindow(window, url) {
    const loaderHtml = `
        <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; }
            .loader { border: 16px solid #f3f3f3; border-top: 16px solid #3498db; border-radius: 50%; width: 120px; height: 120px; animation: spin 2s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <div class="loader"></div>
    `;

    window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(loaderHtml)}`, { baseURLForDataURL: '' });

    window.webContents.once('did-finish-load', () => {
        window.loadURL(url);
    });
}

const menuTemplate = () => [
    {
        label: 'File',
        submenu: [
            { label: 'Reload Page', click: () => mainWindow.reload() },
            { label: 'Force Reload', click: () => mainWindow.webContents.reloadIgnoringCache() },
            { label: 'Close', role: 'quit' },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
        ],
    },
    {
        label: 'View',
        submenu: [
            { label: 'Zoom In', click: () => adjustZoom(1) },
            { label: 'Zoom Out', click: () => adjustZoom(-1) },
            { label: 'Reset Zoom', click: () => mainWindow.webContents.setZoomLevel(0) },
        ],
    },
    {
        label: 'Help',
        submenu: [
            { label: 'Report Issue', click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-bug') },
            { label: 'About', click: () => showAboutDialog() },
        ],
    },
];

function adjustZoom(amount) {
    const currentZoomLevel = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(currentZoomLevel + amount);
}

function showAboutDialog() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.15\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

// Auto-update event listeners
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. It will be downloaded in the background.',
        buttons: ['OK']
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update is downloaded. It will be installed now.',
        buttons: ['OK']
    }).then(() => {
        autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    dialog.showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: 'There was an error while checking for updates: ' + error.message,
        buttons: ['OK'],
    });
});

app.whenReady().then(() => {
    ensureConfigFile();
    createWindow('https://jublaglattbrugg.ch');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.setAsDefaultProtocolClient('jgdesktop');

app.on('second-instance', (event, argv) => {
    const urlFromArgs = argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : null;

    if (mainWindow) {
        if (urlToLoad) {
            loadUrlInWindow(mainWindow, urlToLoad);
        }
        mainWindow.focus();
    } else {
        createWindow(urlToLoad || 'https://jublaglattbrugg.ch');
    }
});

ipcMain.handle('get-settings', () => settings);

ipcMain.on('save-settings', (event, newSettings) => {
    settings = newSettings;
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 4));
});
