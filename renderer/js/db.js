/*jshint esversion: 9 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ computers: [] })
    .write()

exports.getAll = () => {
    const computers = db.get('computers').value();
    return computers;
};

exports.getOne = name => {
    const computer = db.get('computers').find({ name }).value();
    return computer;
};

//Return true if computer already exists in db, otherwise return false
exports.add = (computer, updateExisting = true) => {

    // //See if this computer is already in our array
    const found = db.get('computers').find({ name: computer.name }).value();

    // console.log(`${computer.name} found = ${found}`);
    if (found) {
        if (updateExisting) {
            //Update the PC in database
            db.get('computers')
                .find({ name: computer.name })
                .assign(computer)
                .write();
        }
        return true;
    } else {
        // console.log(`Adding ${computer.name} to database`);
        //Add the PC to the database
        db.get('computers')
            .push(computer)
            .write();
        return false;
    }
};

exports.remove = name => {
    db.get('computers')
        .remove({ name })
        .write();
};