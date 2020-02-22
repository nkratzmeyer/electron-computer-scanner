/*jshint esversion : 9 */
const AD = require('activedirectory2').promiseWrapper;

class ActiveDirectorySync {
    constructor(username, password, url, baseDN){
        this. config = {
            url,
            baseDN,
            username,
            password
        };
    }
    
    async getComputers () {
        try {
            const ad = new AD(this.config);
        
            const query = 'objectCategory=computer';

            const computers = await ad.find(query);
    
            const computersForReturn = computers.other.map(item => {
                return {
                    name: item.cn.toLowerCase(),
                    description: item.description
                };
            });
            return computersForReturn;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = ActiveDirectorySync;
