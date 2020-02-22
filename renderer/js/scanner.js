/*jshint esversion : 9 */
const wmi = require('node-wmi');

class WwmiScanner {
    constructor(errorDisplay) {
        this.errorDisplay = errorDisplay;
    }

    scan(options) {
        return new Promise((resolve, reject) => {
            wmi.Query(options, function (err, systemInfo) {
                //There was a problem
                if (err) reject(err);

                //All good
                resolve(systemInfo);
            });
        });
    }

    //Perform a WIN32_BIOS query
    async queryBios(hostName) {
        const options = {
            class: "WIN32_BIOS",
            properties: ['SerialNumber', "Caption", "Description", "Manufacturer"],
            host: hostName
        };

        const bios = await this.scan(options);
        return bios[0];
    }

    //Perform Win32_ComputerSystem query
    async queryComputerSystem(hostName) {
        const options = {
            class: "WIN32_ComputerSystem",
            properties: ['Model', "TotalPhysicalMemory", "UserName"],
            host: hostName
        };

        const computerInfo = await this.scan(options);
        return computerInfo[0];
    }

    //Perform Win32_OperatingSystem query
    async queryOs(hostName) {
        const options = {
            class: "Win32_OperatingSystem",
            properties: ['InstallDate', "LastBootUpTime", "BuildNumber", 'Version'],
            host: hostName
        };

        const osInfo = await this.scan(options);
        return osInfo[0];
    }

    //Perform Win32_Environment query
    async queryEnvironment(hostName) {
        const options = {
            class: "Win32_Environment",
            properties: ['Name', "Status", "VariableValue", "UserName"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Environment query
    async queryInstalledApps(hostName) {
        const options = {
            class: "Win32_InstalledWin32Program",
            properties: ['Name', "Vendor", "Version"],
            host: hostName
        };

        try {
            return await this.scan(options);
        } catch (error) {
            console.log(error);
        }
    }

    //Perform Win32_NetworkAdapter query
    async queryNetworkAdapters(hostName) {
        const options = {
            class: "Win32_NetworkAdapter",
            properties: ['Name', "Description", "AdapterType", "NetConnectionStatus", "MACAddress"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Process query
    async  queryProcesses(hostName) {
        const options = {
            class: "Win32_Process",
            properties: ['Name', "ProcessId", "WorkingSetSize"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_NetworkAdapter query
    async  queryUserProfiles(hostName) {
        const options = {
            class: "Win32_UserProfile",
            properties: ['LocalPath', "LastUseTime"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_NetworkAdapter query
    async queryStartupCommands(hostName) {
        const options = {
            class: "Win32_StartupCommand",
            properties: ['Caption', "Command", "Location", "User"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Share query
    async  queryShares(hostName) {
        const options = {
            class: "Win32_Share",
            properties: ['Caption', "Name", "Path"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Service query
    async queryServices(hostName) {
        const options = {
            class: "Win32_Service",
            properties: ['Name', "Caption", "StartMode", "State", "Description"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_LogicalDisk query
    async  queryDisks(hostName) {
        const options = {
            class: "Win32_LogicalDisk",
            properties: ['Name', "Description", "FreeSpace", "Size"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Service query
    async queryHotfix(hostName) {
        const options = {
            class: "Win32_QuickFixEngineering",
            properties: ['HotFixID', "InstalledOn", "Caption", "Description"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_Printer query
    async  queryPrinters(hostName) {
        const options = {
            class: "Win32_Printer",
            properties: ['Caption', "PortName", "DriverName"],
            host: hostName
        };

        return await this.scan(options);
    }

    //Perform Win32_NetworkAdapter query
    async queryProcessor(hostName) {
        const options = {
            class: "Win32_Processor",
            properties: ['Name', "AddressWidth", "Description", "LoadPercentage"],
            host: hostName
        };

        const processor = await this.scan(options);
        return processor[0];
    }

}//End class


module.exports = WwmiScanner;