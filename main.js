const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// Function to create the main application window
function createWindow(url = 'https://jublaglattbrugg.ch') {
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

    if (isAllowedUrl(url)) {
        loadUrlInWindow(mainWindow, url);
    } else {
        dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
    }

    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Load URL with a loader while waiting
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
        if (isAllowedUrl(url)) {
            window.loadURL(url);
        }
    });
}

// Check if the URL is allowed
function isAllowedUrl(url) {
    const allowedDomains = ['jublaglattbrugg.ch'];
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname);
}

// Menu template definition
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

// Open settings window
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

// Show about dialog
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
    const urlFromArgs = process.argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : 'https://jublaglattbrugg.ch';
    createWindow(urlToLoad);
    
    // Check for updates after creating the window
    autoUpdater.checkForUpdatesAndNotify();
});

// Prevent multiple instances
app.requestSingleInstanceLock();

// Handle second instance
app.on('second-instance', (event, argv) => {
    const urlFromArgs = argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : 'https://jublaglattbrugg.ch';

    // If the main window is already open, replace the session with the new URL
    if (mainWindow) {
        if (isAllowedUrl(urlToLoad)) {
            loadUrlInWindow(mainWindow, urlToLoad);
        } else {
            dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
        }
        mainWindow.focus();
    }
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

// Auto-updater events
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new update is available. Downloading now...'
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new update has been downloaded. The app will now restart to apply the update.',
        buttons: ['Restart']
    }).then(() => {
        autoUpdater.quitAndInstall();
    });
});
