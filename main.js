const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow;

// Create a window or focus on the existing one
function createWindow(url = 'https://jublaglattbrugg.ch') {
    // Check if the mainWindow already exists
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.loadURL(url);
        return;
    }

    // Create a new BrowserWindow
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'build/icons/icon-512x512.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Check if the URL is allowed
    if (isAllowedUrl(url)) {
        mainWindow.loadURL(url);
    } else {
        dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
    }

    // Create the menu
    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    // Handle window closed event
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Allowed domain check
function isAllowedUrl(url) {
    const allowedDomains = ['jublaglattbrugg.ch'];
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname);
}

// Build the menu template
const menuTemplate = () => [
    {
        label: 'File',
        submenu: [
            { label: 'Reload Page', click: () => mainWindow.reload() },
            { label: 'Force Reload', click: () => mainWindow.webContents.reloadIgnoringCache() },
            { label: 'Settings', click: openSettings },
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
            {
                label: 'Zoom In',
                click: () => {
                    const currentZoomLevel = mainWindow.webContents.getZoomLevel();
                    mainWindow.webContents.setZoomLevel(currentZoomLevel + 1);
                },
            },
            {
                label: 'Zoom Out',
                click: () => {
                    const currentZoomLevel = mainWindow.webContents.getZoomLevel();
                    mainWindow.webContents.setZoomLevel(currentZoomLevel - 1);
                },
            },
            {
                label: 'Reset Zoom',
                click: () => mainWindow.webContents.setZoomLevel(0),
            },
        ],
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Documentation',
                click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-wiki'),
            },
            {
                label: 'Report Issue',
                click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-bug'),
            },
            {
                label: 'Support',
                click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-support'),
            },
            {
                label: 'About',
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

function showAboutDialog() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.10\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

app.whenReady().then(() => {
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

// Handle deep linking if app is already running
app.on('second-instance', (event, argv) => {
    const urlFromArgs = argv.find(arg => arg.startsWith('jgdesktop://'));
    const urlToLoad = urlFromArgs ? urlFromArgs.replace('jgdesktop://', 'https://') : 'https://jublaglattbrugg.ch';

    if (mainWindow) {
        if (isAllowedUrl(urlToLoad)) {
            mainWindow.loadURL(urlToLoad);
        } else {
            dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
        }
        mainWindow.focus();
    } else {
        createWindow(urlToLoad);
    }
});
