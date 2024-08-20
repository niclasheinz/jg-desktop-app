const { app, BrowserWindow, Menu, shell, dialog, Notification } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

let mainWindow; // Declare mainWindow variable

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'app/assets/icons/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadURL('https://jublaglattbrugg.ch'); // Load the website

    // Create the menu
    const menu = Menu.buildFromTemplate(menuTemplate());
    Menu.setApplicationMenu(menu);

    // Check for updates
    checkForUpdates();
}

const menuTemplate = () => [
    {
        label: 'File',
        submenu: [
            { label: 'Reload', click: () => mainWindow.reload() }, // Reload the current page
            { label: 'Force Reload', click: () => mainWindow.webContents.reloadIgnoringCache() }, // Force reload the current page
            { label: 'Settings', click: openSettings }, // Add settings menu item
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
                    shell.openExternal('https://gitlab.com/niclasheinz/jg-desktop-app/-/wikis/home');
                },
            },
            {
                label: 'Fehler melden',
                click: () => {
                    shell.openExternal('https://gitlab.com/niclasheinz/jg-desktop-app/-/issues');
                },
            },
            {
                label: 'Support',
                click: () => {
                    shell.openExternal('https://gitlab.com/niclasheinz/jg-desktop-app/-/wikis/support');
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
        message: 'Jubla Glattbrugg Desktop App\nVersion ' + app.getVersion() + '\nThe official Jubla Glattbrugg Desktop App.',
        buttons: ['OK'],
    });
}

async function checkForUpdates() {
    const currentVersion = app.getVersion();
    const lastChecked = getLastCheckedDate();
    const now = new Date();

    // Überprüfen, ob eine Woche vergangen ist
    if (now - lastChecked > 7 * 24 * 60 * 60 * 1000) {
        try {
            const response = await fetch('https://gitlab.com/api/v4/projects/60761284/releases');
            const releases = await response.json();
            const latestVersion = releases[0].tag_name; // oder wie auch immer die Version strukturiert ist

            if (currentVersion !== latestVersion) {
                showNotification(`Neue Version verfügbar: ${latestVersion}`);
            }

            // Datum der letzten Überprüfung aktualisieren
            setLastCheckedDate(now);
        } catch (error) {
            console.error('Fehler beim Überprüfen auf Updates:', error);
        }
    }
}

function showNotification(message) {
    new Notification({ title: 'Update verfügbar', body: message }).show();
}

function getLastCheckedDate() {
    try {
        return new Date(fs.readFileSync(path.join(app.getPath('userData'), 'lastChecked.txt'), 'utf8'));
    } catch (error) {
        return new Date(0); // Wenn die Datei nicht existiert, als nie überprüft betrachten
    }
}

function setLastCheckedDate(date) {
    fs.writeFileSync(path.join(app.getPath('userData'), 'lastChecked.txt'), date.toString());
}

app.whenReady().then(createWindow);

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
