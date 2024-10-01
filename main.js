const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow;

// Function to create the main application window
function createWindow(url = 'https://jublaglattbrugg.ch') {
    // If the window exists, focus and load the new URL
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
        },
    });

    // Load the allowed URL and display loader
    if (isAllowedUrl(url)) {
        loadUrlInWindow(mainWindow, url);
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
          //  {
          //      label: 'Dokumentation',
          //      click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-wiki'),
          //  },
            {
                label: 'Fehler melden',
                click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-bug'),
            },
            //{
            //    label: 'Support',
            //    click: () => shell.openExternal('https://www.jublaglattbrugg.ch/desktop-support'),
            //},
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
        if (isAllowedUrl(urlToLoad)) {
            loadUrlInWindow(mainWindow, urlToLoad);
        } else {
            dialog.showErrorBox('Invalid URL', 'This URL is not allowed.');
        }
        mainWindow.focus();
    } else {
        createWindow(urlToLoad);
    }
});
