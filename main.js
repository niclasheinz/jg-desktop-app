const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow; // Declare mainWindow variable

function createWindow() {
    // Check if the mainWindow already exists
    if (mainWindow) {
        mainWindow.focus(); // Focus on the existing window
        return; // Exit the function to prevent creating a new window
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

    mainWindow.loadURL('https://jublaglattbrugg.ch'); // Load the website

    // Create the menu
    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    // Handle window closed event
    mainWindow.on('closed', () => {
        mainWindow = null; // Dereference the window object
    });
}

const menuTemplate = () => [
    {
        label: 'File',
        submenu: [
            { label: 'Reload', click: () => mainWindow.reload() },
            { label: 'Force Reload', click: () => mainWindow.webContents.reloadIgnoringCache() },
            { label: 'Settings', click: openSettings },
            { label: 'Exit', role: 'quit' },
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
                label: 'Dokumentation',
                click: () => {
                    shell.openExternal('https://www.jublaglattbrugg.ch/desktop-wiki');
                },
            },
            {
                label: 'Fehler melden',
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
                label: 'Über',
                click: () => {
                    showAboutDialog();
                },
            },
        ],
    },
];

function openSettings() {
    // Check if settings window already exists
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
        title: 'Über',
        message: 'Jubla Glattbrugg Desktop App\nVersion 1.0.7\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

app.whenReady().then(createWindow);

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
