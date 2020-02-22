/*jshint esversion :  9 */
const { ipcRenderer } = require('electron');

//Internal modules
const db = require('./db');

//DOM elements
const header = document.getElementById('computer-details');
const printers = document.getElementById('printers');
const apps = document.getElementById('apps');
const env = document.getElementById('environment-vars');
const networkAdapters = document.getElementById('network-adapters');
const processes = document.getElementById('processes');
const userProfiles = document.getElementById('user-profiles');
const startupCommands = document.getElementById('startup-commands');
const processor = document.getElementById('processor');
const shares = document.getElementById('shares');
const services = document.getElementById('services');
const disks = document.getElementById('disks');
const hotfixes = document.getElementById('hotfixes');

//Filter input boxes
const filterApps = document.getElementById('filter-apps');

//Reference to our computer object
let computer;

ipcRenderer.on('data', (e, name) => {
    computer = db.getOne(name);

    const title = document.createElement('h1');
    title.classList.add('name');
    title.innerText = computer.name;
    header.appendChild(title);

    const newItem = document.createElement('div');

    //Fill our our dom item with data
    newItem.innerHTML = `
       <div class="info-item">
            <div>Serial</div>
            <div>${computer.serial}</div>
       </div>
        <div class="info-item">
            <div>Model</div>
            <div>${computer.model}</div>
        </div>
        <div class="info-item">
            <div>RAM</div>
            <div>${computer.ram}GB</div>
        </div>
        <div class="info-item">
            <div>User</div>
            <div>${computer.user}</div>
        </div>
        <div class="info-item">
            <div>OS Build</div>
            <div>${computer.OS ? computer.OS.build : undefined}</div>
        </div>
        <div class="info-item">
            <div>OS Version</div>
            <div>${computer.OS ? computer.OS.version : undefined}</div>
        </div>
        <div class="info-item">
            <div>Install Date</div>
            <div>${computer.installDate}</div>
        </div>
        <div class="info-item">
            <div>Last Boot</div>
            <div>${computer.bootTime}</div>
        </div>
        <div class="info-item">
            <div>Last Scan</div>
            <div>${computer.lastScan}</div>
        </div>`;


    header.appendChild(newItem);

    if (computer.printers) {
        let printerRow;
        computer.printers.forEach(printer => {
            printerRow = document.createElement('tr');
            printerRow.innerHTML = `<td>${printer.Caption}</td>
            <td>${printer.PortName}</td>
            <td>${printer.DriverName}</td>`;
            printers.appendChild(printerRow);
        });
    }

    if (computer.apps) {
        let appRow;
        computer.apps.forEach(app => {
            appRow = document.createElement('tr');
            appRow.classList.add('app-row');
            appRow.innerHTML = `<td>${app.Name}</td>
            <td>${app.Vendor}</td>
            <td>${app.Version}</td>`;
            apps.appendChild(appRow);
        });
    }

    if (computer.environmentVariables) {
        let envRow;
        computer.environmentVariables.forEach(variable => {
            envRow = document.createElement('tr');
            envRow.innerHTML = `<td>${variable.Name}</td>
            <td>${variable.VariableValue}</td>
            <td>${variable.UserName}</td>
            <td>${variable.Status}</td>`;
            env.appendChild(envRow);
        });
    }

    if (computer.adapters) {
        let adapterRow;
        computer.adapters.forEach(adapter => {
            adapterRow = document.createElement('tr');
            adapterRow.innerHTML = `<td>${adapter.Name}</td>
            <td>${adapter.Description}</td>
            <td>${adapter.AdapterType}</td>
            <td>${adapter.NetConnectionStatus}</td>
            <td>${adapter.MACAddress}</td>`;
            networkAdapters.appendChild(adapterRow);
        });
    }

    if (computer.processes) {
        let processRow;
        computer.processes.forEach(proc => {
            processRow = document.createElement('tr');
            processRow.innerHTML = `<td>${proc.Name}</td>
            <td>${proc.ProcessId}</td>
            <td>${proc.WorkingSetSize}</td>`;
            processes.appendChild(processRow);
        });
    }

    if (computer.userProfiles) {
        let profileRow;
        computer.userProfiles.forEach(prof => {
            profileRow = document.createElement('tr');
            profileRow.innerHTML = `<td>${prof.userName}</td>
            <td>${prof.localPath}</td>
            <td>${prof.lastLogin}</td>`;
            userProfiles.appendChild(profileRow);
        });
    }

    if (computer.startupCommands) {
        let startupRow;
        computer.startupCommands.forEach(command => {
            startupRow = document.createElement('tr');
            startupRow.innerHTML = `<td>${command.Caption}</td>
            <td>${command.Command}</td>
            <td>${command.Location}</td>
            <td>${command.User}</td>`;
            startupCommands.appendChild(startupRow);
        });
    }

    if (computer.processor) {
        const processorRow = document.createElement('tr');
        const proc = computer.processor;
        processorRow.innerHTML = `<td>${proc.Name}</td>
        <td>${proc.Description}</td>
        <td>${proc.AddressWidth}</td>
        <td>${proc.LoadPercentage}</td>`;
        processor.appendChild(processorRow);
    }

    if (computer.shares) {
        let shareRow;
        computer.shares.forEach(share => {
            shareRow = document.createElement('tr');
            shareRow.innerHTML = `<td>${share.Caption}</td>
            <td>${share.Name}</td>
            <td>${share.Path}</td>`;
            shares.appendChild(shareRow);
        });
    }

    if (computer.services) {
        let serviceRow;
        computer.services.forEach(service => {
            serviceRow = document.createElement('tr');
            serviceRow.innerHTML = `<td>${service.Caption}</td>
            <td>${service.Name}</td>
            <td>${service.StartMode}</td>
            <td>${service.State}</td>
            <td>${service.Description}</td>`;
            services.appendChild(serviceRow);
        });
    }

    if (computer.disks) {
        let diskRow, percentFree, freeTag;
        computer.disks.forEach(disk => {
            percentFree = Math.round((disk.free / disk.size) * 100);
            if(percentFree < 10){
              freeTag = `<td class="warn">${percentFree}%</td>`;
            } else {
                freeTag = `<td>${percentFree}%</td>`;
            }

            diskRow = document.createElement('tr');
            diskRow.innerHTML = `<td>${disk.name}</td>
            <td>${disk.description}</td>
            <td>${disk.free} GB</td>
            <td>${disk.size} GB</td>
            ${freeTag}`;
            disks.appendChild(diskRow);
        });
    }

    if (computer.hotfixes) {
        let fixRow;
        computer.hotfixes.forEach(hf => {
            fixRow = document.createElement('tr');
            fixRow.innerHTML = `<td><a href="${hf.Caption}" target="_blank">${hf.Caption}</a></td>
            <td>${hf.Description}</td>
            <td>${hf.HotFixID}</td>
            <td>${hf.InstalledOn}</td>`;
            hotfixes.appendChild(fixRow);
        });
    }
    
});

document.getElementById('remote-assist').addEventListener('click', e => {
    ipcRenderer.send('msra', computer.name);
});

document.getElementById('remote-desktop').addEventListener('click', e => {
    ipcRenderer.send('mstsc', computer.name);
});


/* Filter functionality */
filterApps.addEventListener('keyup', e => {
    Array.from(document.getElementsByClassName('app-row')).forEach(item => {
        let hasMatch = item.innerText.toLowerCase().includes(filterApps.value.toLowerCase());
        item.style.display = hasMatch ? 'table-row' : 'none';
    });
});