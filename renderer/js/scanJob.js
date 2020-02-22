/* jshint esversion : 9 */
class ScanJob {
    constructor(domElement){
        this.domElement = domElement;
    }

    setStatus(statusText, errorStatus = false){
        this.domElement.getElementsByClassName('scan-status')[0].innerText = statusText;
        if(errorStatus){
            this.domElement.classList.add('error');
        }
    }

    remove(){
        this.domElement.remove();
    }
}

module.exports = ScanJob;