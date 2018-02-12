var fs = require('fs');
var exec = require('child_process').exec;

module.exports = {
    copyFile: (read1, read2) => {
        return new Promise((resolve, reject) => {
            exec(`scp ${read1} ${read2} vincentl@newriver1.arc.vt.edu:`, (err, stdout, stdin) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
};