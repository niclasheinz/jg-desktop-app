const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow(url) {
    // Check if the main window already exists
    if (mainWindow) {
        mainWindow.focus();
        return;
    }

    // Create a new BrowserWindow instance
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'build/icons/icon-512x512.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadURL(url); // Load the passed URL

    // Create the menu
    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    // Handle window closed event
    mainWindow.on('closed', () => {
        mainWindow = null; // Dereference the window object
    });
}

// Register the custom URL protocol
app.setAsDefaultProtocolClient('jgdesktop');

app.on('open-url', (event, url) => {
    event.preventDefault();
    createWindow(url); // Open the window with the URL
});

app.whenReady().then(() => {
    // Check if the app was opened with a URL
    if (process.argv.length >= 2) {
        createWindow(process.argv[1]); // The first argument is the URL
    } else {
        createWindow('https://jublaglattbrugg.ch'); // Default URL
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit(); // Quit the app if not on macOS
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow('https://jublaglattbrugg.ch'); // Default URL
    }
});

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
                click: () => {
                    mainWindow.webContents.setZoomLevel(0); // Reset to default zoom level
                },
            },
        ],
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Documentation',
                click: () => {
                    shell.openExternal('https://www.jublaglattbrugg.ch/desktop-wiki');
                },
            },
            {
                label: 'Report a Bug',
                click: () => {
                    shell.openExternal('https://www.jublaglattbrugg.ch/desktop-bug');
                },
            },
            {
                label: 'Support',
                click: () => {
                    shell.openExternal('https://www.jublaglattbrugg.ch/desktop-support');
                },
            },
            {
                label: 'About',
                click: () => {
                    showAboutDialog();
                },
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

    settingsWindow.loadFile(path.join(__dirname, 'app/settings/settings.html')); // Load the settings modal
}

function showAboutDialog() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.8\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}
