const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const configPath = path.join(__dirname, 'config.json');
let settings = { alwaysOpenInApp: false, enableProtocol: true }; // Default settings

// Function to read config
function readConfig() {
    if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath);
        return JSON.parse(configData);
    }
    return settings; // Return default settings if config file doesn't exist
}

// Function to write config
function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
}

// Load settings from config file
settings = readConfig();

// Function to create the main application window
function createWindow(url = 'https://jublaglattbrugg.ch') {
    if (mainWindow) {
        mainWindow.focus();
        loadUrlInWindow(mainWindow, url);
        return;
    }

    // Create the BrowserWindow
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'build/icons/icon-512x512.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js') // Use preload script for IPC
        },
    });

    // Load the allowed URL
    loadUrlInWindow(mainWindow, url);

    // Create the menu
    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    // Handle window closed event
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

    // Show loader until the page is ready
    window.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(loaderHtml)}`, { baseURLForDataURL: '' });

    // Check if the URL is allowed and show confirmation dialog if it is a specific URL pattern
    if (isAllowedUrl(url)) {
        if (settings.alwaysOpenInApp && /^https:\/\/jublaglattbrugg\.ch\/.*$/.test(url)) {
            dialog.showMessageBox(window, {
                type: 'question',
                buttons: ['Cancel', 'Open'],
                title: 'Confirm Navigation',
                message: `Are you sure you want to navigate to ${url}?`
            }).then((result) => {
                if (result.response === 1) { // 1 corresponds to 'Open'
                    window.loadURL(url);
                } else {
                    window.loadURL('about:blank'); // Load a blank page if cancelled
                }
            });
        } else {
            window.loadURL(url);
        }
    } else {
        dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
    }
}

// Check if the URL is allowed
function isAllowedUrl(url) {
    const allowedDomains = ['jublaglattbrugg.ch'];
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname);
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
                label: 'Hereinzoomen',
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
            preload: path.join(__dirname, 'preload.js') // Use preload script for IPC
        },
    });
    settingsWindow.loadFile(path.join(__dirname, 'app/settings/settings.html'));
}

function showAboutDialog() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.10\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

// Ensure single instance of the app
app.requestSingleInstanceLock();

app.whenReady().then(() => {
    // Read the config to determine settings
    settings = readConfig();

    // Load initial URL
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
    writeConfig(settings); // Save settings to config file
});
