/*jshint esversion : 9 */
//core modules
const os = require('os');
const path = require('path');

//Third party modules
const { ipcRenderer } = require("electron");
const timeConverter = require("wmi-datetime");
const ping = require("ping");
const prompt = require("electron-prompt");

//Internal modules
const ScanJob = require("./scanJob");
const Scanner = require("./scanner");
const db = require("./db");

//DOM elements
const tbHostName = document.getElementById("host-name");
const tbSearch = document.getElementById("search");
const computerList = document.getElementById("computer-list");
const btnScan = document.getElementById("scan");
const computerCount = document.getElementById("computer-count");
const jobList = document.getElementById("job-list");

//Helper for adding dataItems to DOM
const addComputerToDom = computer => {
  const newItem = document.createElement("div");
  newItem.classList.add("data-item");
  newItem.addEventListener("click", this.select);
  newItem.addEventListener("contextmenu", this.select);
  newItem.addEventListener("dblclick", this.open);

  //Fill our our dom item with data
  newItem.innerHTML = `<p class="name">${computer.name}</p>
        <p class="truncate">${computer.serial}</p>
        <p>${computer.user}</p>
        <p>Last Boot -- ${computer.bootTime}</p>`;
  computerList.appendChild(newItem);
};

//Adds a little "card" showing job name and status to the area below the computer list
const addScanJobToDom = computerName => {
  const newItem = document.createElement("div");
  newItem.classList.add("scan-job");
  //Remove this item from the DOM if it is double-clicked
  newItem.addEventListener("dblclick", newItem.remove);

  //Fill our our dom item with data
  newItem.innerHTML = `
        <h3>${computerName}</h3>
        <p class="scan-status">Scanning</p>`;
  jobList.appendChild(newItem);
  return new ScanJob(newItem);
};

//Helper to clear the computer list dom when needed
const clearComputerListDom = async () => {
  computerList.innerHTML = "";

  const allComputers = await db.getAll();

  //Make sure we got something back from the database
  if (allComputers) {
    allComputers.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    allComputers.forEach(computer => {
      addComputerToDom(computer);
    });
    computerCount.innerText = `${allComputers.length} computers in database`;
  }
};

const pingComputer = async computerName => {
  const pingResult = await ping.promise.probe(computerName);
  return pingResult.alive;
};

//Perform a computer scan
btnScan.addEventListener("click", async e => {
  //Get host name from input box
  const hostName = tbHostName.value;
  scanComputer(hostName);
});

//Search functionality
tbSearch.addEventListener("keyup", e => {
  Array.from(document.getElementsByClassName("data-item")).forEach(item => {
    let hasMatch = item.innerText
      .toLowerCase()
      .includes(tbSearch.value.toLowerCase());
    item.style.display = hasMatch ? "block" : "none";
  });
});

//Get Selected item index
exports.getSelectedItem = () => {
  const selectedItem = document.getElementsByClassName("data-item selected")[0];
  if (selectedItem) {
    let index = 0;
    let child = selectedItem;
    const name = selectedItem.getElementsByClassName("name")[0].innerText;
    while ((child = child.previousSibling) != null) index++;

    return {
      node: selectedItem,
      index,
      name: name.toLowerCase()
    };
  }
  return null;
};

//Select an item
exports.select = e => {
  // Get our currently selected item so we can remove the 'selected' class
  const currentSelected = this.getSelectedItem();
  //Be sure that one is selected first
  if (currentSelected) {
    currentSelected.node.classList.remove("selected");
  }
  //Add the 'selected' class to our target
  e.currentTarget.classList.add("selected");
};

//Open an item in a new window
exports.open = () => {
  const name = this.getSelectedItem().name;
  ipcRenderer.send("open", name);
};

//Handle Enter press in hostname box
tbHostName.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    btnScan.click();
  }
});

/*-------------------Global Window Functions---------------------------*/
window.remoteAssist = () => {
  const name = this.getSelectedItem().name;
  ipcRenderer.send("msra", name);
};

window.remoteDesktop = () => {
  const name = this.getSelectedItem().name;
  ipcRenderer.send("mstsc", name);
};

window.syncWithAd = async () => {
  const promptString = `Enter password for ${os.userInfo().username}`;
  const cssPath = path.join(__dirname, '../css/shared.css');
  const pw = await prompt({
    title: "Password required",
    label: promptString,
    height: 250,
    customStylesheet: cssPath,
    inputAttrs: {
      type: "password",
      required: true
    },
    type: "input"
  });

  if(pw === null){
    return;
  }

  this.syncJob = addScanJobToDom("AD Sync");
  ipcRenderer.send("ad-sync", pw);
  this.syncJob.setStatus("In progress.");
};

window.openEventViewer = () => {
  const name = this.getSelectedItem().name;
  ipcRenderer.send("event-vwr", name);
};

window.deleteSelected = () => {
  //Get the currently selected computer
  const selected = this.getSelectedItem();
  //Remove the selected item from DOM
  computerList.removeChild(selected.node);
  //Remove from our storage array
  db.remove(selected.name);
};

window.scanSelected = async () => {
  //Get the currently selected computer
  const name = this.getSelectedItem().name;
  scanComputer(name);
};

window.quickScan = async () => {
  //Get the currently selected computer
  const name = this.getSelectedItem().name;
  quickScanComputer(name);
};

window.quickScanComputer = async hostName => {
  const scanJob = addScanJobToDom(hostName);

  //Only scan the PC if it is online
  if (await pingComputer(hostName)) {
    const scanner = new Scanner(scanJob.setStatus);
    try {
      //Wait for ComputerSystem scan to complete
      scanJob.setStatus("Scanning System Info");
      const systemInfoItem = await scanner.queryComputerSystem(hostName);
      //Format the RAM to a readable number
      const formattedRam = Math.round(
        systemInfoItem.TotalPhysicalMemory / 1000000000
      );
      //Wait for OS scan to complete
      scanJob.setStatus("Scanning OS Info");
      const osInfo = await scanner.queryOs(hostName);
      //Processes
      scanJob.setStatus("Scanning Processes");
      const processes = await scanner.queryProcesses(hostName);
      //Query services
      scanJob.setStatus("Scanning Services");
      const services = await scanner.queryServices(hostName);

      const computerToUpdate = db.getOne(this.getSelectedItem().name);
      computerToUpdate.ram = formattedRam;
      computerToUpdate.bootTime = timeConverter
        .getDateFromWMIDate(osInfo.LastBootUpTime)
        .toLocaleString();
      computerToUpdate.services = services;
      computerToUpdate.processes = processes;

      db.add(computerToUpdate);

      //Clear the scan job from the DOM
      scanJob.remove();
    } catch (error) {
      scanJob.setStatus(error, true);
    }
  } else {
    scanJob.setStatus("OFFLINE!", true);
  }
};

window.scanComputer = async hostName => {
  const scanJob = addScanJobToDom(hostName);

  //Only scan the PC if it is online
  if (await pingComputer(hostName)) {
    const scanner = new Scanner(scanJob.setStatus);

    try {
      scanJob.setStatus("Scanning BIOS");
      //Wait for BIOS scan to complete
      const biosItem = await scanner.queryBios(hostName);

      //Wait for ComputerSystem scan to complete
      scanJob.setStatus("Scanning ComputerSystem");
      const systemInfoItem = await scanner.queryComputerSystem(hostName);
      //Format the RAM to a readable number
      const formattedRam = Math.round(
        systemInfoItem.TotalPhysicalMemory / 1000000000
      );

      //Wait for OS scan to complete
      scanJob.setStatus("Scanning OS");
      const osInfo = await scanner.queryOs(hostName);

      //Get environment vars
      scanJob.setStatus("Scanning env vars");
      const environmentVariables = await scanner.queryEnvironment(hostName);

      //Installed apps
      scanJob.setStatus("Scanning Apps");
      const apps = await scanner.queryInstalledApps(hostName);
      if (apps) {
        apps.sort((a, b) => {
          return a.Name.localeCompare(b.Name);
        });
      }

      //Network Adapters
      scanJob.setStatus("Scanning Network Adapters");
      const adapters = await scanner.queryNetworkAdapters(hostName);

      //Processes
      scanJob.setStatus("Scanning Processes");
      const processes = await scanner.queryProcesses(hostName);

      //User Profiles
      scanJob.setStatus("Scanning Profiles");
      const profiles = await scanner.queryUserProfiles(hostName);

      let lastLogin, formattedProfiles;
      if (profiles) {
        formattedProfiles = profiles.map(item => {
          const parts = item.LocalPath.split("\\");

          if (item.LastUseTime) {
            lastLogin = timeConverter
              .getDateFromWMIDate(item.LastUseTime)
              .toLocaleString();
          } else {
            lastLogin = "NA";
          }

          return {
            localPath: item.LocalPath,
            lastLogin,
            userName: parts[parts.length - 1]
          };
        });
      }

      //Startup commands
      scanJob.setStatus("Scanning Startup Commands");
      const startupCommands = await scanner.queryStartupCommands(hostName);

      //Processors
      scanJob.setStatus("Scanning Processor");
      const processor = await scanner.queryProcessor(hostName);

      //Query fileshares
      scanJob.setStatus("Scanning File Shares");
      const shares = await scanner.queryShares(hostName);

      //Query services
      scanJob.setStatus("Scanning Services");
      const services = await scanner.queryServices(hostName);

      //Disks
      scanJob.setStatus("Scanning Disks");
      const disks = await scanner.queryDisks(hostName);
      let formattedDisks;
      if (disks) {
        //Format disk space into something readable
        formattedDisks = disks.map(disk => {
          const free = Math.round(disk.FreeSpace / 1000000000);
          const size = Math.round(disk.Size / 1000000000);
          return {
            name: disk.Name,
            description: disk.Description,
            size,
            free
          };
        });
      }

      //Scan hotfixes
      scanJob.setStatus("Scanning Hotfixes");
      const hotfixes = await scanner.queryHotfix(hostName);

      //Scan printers
      scanJob.setStatus("Scanning Printers");
      const printers = await scanner.queryPrinters(hostName);

      //Create an object for storage in localstorage
      scanJob.setStatus("Saving to database");
      const itemForStorage = {
        name: hostName.toLowerCase(),
        serial: biosItem.SerialNumber,
        model: systemInfoItem.Model,
        ram: formattedRam,
        OS: {
          build: osInfo.BuildNumber,
          version: osInfo.Version
        },
        printers,
        apps,
        environmentVariables,
        adapters,
        processes,
        startupCommands,
        processor,
        shares,
        services,
        disks: formattedDisks,
        hotfixes,
        userProfiles: formattedProfiles,
        user: systemInfoItem.UserName || "NOBODY",
        installDate: timeConverter
          .getDateFromWMIDate(osInfo.InstallDate)
          .toLocaleString(),
        bootTime: timeConverter
          .getDateFromWMIDate(osInfo.LastBootUpTime)
          .toLocaleString(),
        lastScan: new Date().toLocaleString()
      };

      db.add(itemForStorage);

      //Clear the scan job from the DOM
      scanJob.remove();

      //Refresh the list of computers
      clearComputerListDom();
    } catch (error) {
      scanJob.setStatus(error, true);
    }
  } else {
    scanJob.setStatus("OFFLINE!", true);
  }
};

/* ********************Messages from main*********************/
ipcRenderer.on("ad-sync", (event, data) => {
  data.forEach(computer => {
    db.add(computer, false);
  });
  clearComputerListDom();
  this.syncJob.setStatus("Done");
});

clearComputerListDom();
