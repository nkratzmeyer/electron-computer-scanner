/* jshint  esversion : 9 */
const { remote, shell } = require('electron');

//Menu template
const template = [
    {
        label: 'File',
        submenu: [{
            label: 'Sync With AD',
            click: window.syncWithAd
        }, {
            label: 'Scan Selected',
            click: window.scanSelected
        },
        {
            label: 'Delete Selected',
            click: window.deleteSelected,
            accelerator: 'Delete'
        }]
    }
];

//build the menu
const menu = remote.Menu.buildFromTemplate(template);

//Set as main
remote.Menu.setApplicationMenu(menu);


const contextMenu = remote.Menu.buildFromTemplate(
    [{
        label: 'Scan',
        click: window.scanSelected
    }, {
        label: 'Quick Scan',
        click: window.quickScan
    }, {
        label: 'Remote Assist',
        click: window.remoteAssist
    }, {
        label: 'Remote Desktop',
        click: window.remoteDesktop
    }, {
        label: 'Delete Selected',
        click: window.deleteSelected,
        accelerator: 'Delete'
    }, {
        label : 'Event Viewer',
        click : window.openEventViewer
    }]
);

window.addEventListener('contextmenu', e => {
    contextMenu.popup();
}, false);