const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settings;

// Define the path for config.json
const configPath = path.join(__dirname, 'config.json');

// Function to ensure the config.json file exists
function ensureConfigFile() {
    // Default config data
    const defaultConfigData = {
        alwaysOpenInApp: false,  // Default value
        enableProtocol: true      // Default value
    };

    // Check if config.json exists, if not create it
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfigData, null, 4));
    }

    // Read settings from the config file
    const configFile = fs.readFileSync(configPath);
    settings = JSON.parse(configFile);
}

// Function to create the main application window
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

    if (settings.alwaysOpenInApp) {
        loadUrlInWindow(mainWindow, 'https://jublaglattbrugg.ch');
    } else {
        loadUrlInWindow(mainWindow, url);
    }

    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Function to load a URL into the window with a loader
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

// Menu template
const menuTemplate = () => [
    {
        label: 'Datei',
        submenu: [
            { label: 'Reload Page', click: () => mainWindow.reload() },
            { label: 'Force Reload', click: () => mainWindow.webContents.reloadIgnoringCache() },
            { label: 'Settings', click: openSettings },
            { label: 'Close', role: 'quit' },
        ],
    },
    {
        label: 'Bearbeiten',
        submenu: [
            { role: 'Rückgängig' },
            { role: 'Wiederherstellen' },
            { type: 'separator' },
            { role: 'Ausschneiden' },
            { role: 'Kopieren' },
            { role: 'Einfügen' },
        ],
    },
    {
        label: 'Ansicht',
        submenu: [
            {
                label: 'Hereinzoom',
                click: () => {
                    const currentZoomLevel = mainWindow.webContents.getZoomLevel();
                    mainWindow.webContents.setZoomLevel(currentZoomLevel + 1);
                },
            },
            {
                label: 'Hinauszoomen',
                click: () => {
                    const currentZoomLevel = mainWindow.webContents.getZoomLevel();
                    mainWindow.webContents.setZoomLevel(currentZoomLevel - 1);
                },
            },
            {
                label: 'Zoom zurücksetzen',
                click: () => mainWindow.webContents.setZoomLevel(0),
            },
        ],
    },
    {
        label: 'Hilfe',
        submenu: [
            {
                label: 'Fehler melden',
                click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-bug'),
            },
            {
                label: 'Über',
                click: () => showAboutDialog(),
            },
        ],
    },
];

function openSettings() {
    const settingsWindow = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    settingsWindow.loadFile(path.join(__dirname, 'app/settings/settings.html'));
}

// Show About dialog
function showAboutDialog() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.10\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

// Ensure single instance of the app
app.whenReady().then(() => {
    ensureConfigFile(); // Ensure the config file is present
    const urlFromArgs = process.argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : 'https://jublaglattbrugg.ch';
    createWindow(urlToLoad);
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

// Handle deep linking when app is already running
app.on('second-instance', (event, argv) => {
    const urlFromArgs = argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : 'https://jublaglattbrugg.ch';

    if (mainWindow) {
        loadUrlInWindow(mainWindow, urlToLoad);
        mainWindow.focus();
    } else {
        createWindow(urlToLoad);
    }
});

// IPC handlers for settings
ipcMain.handle('get-settings', () => settings);

ipcMain.on('save-settings', (event, newSettings) => {
    settings = newSettings;
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 4)); // Save settings to config file
});
