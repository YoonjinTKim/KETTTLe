var fs = require('fs');
var exec = require('child_process').exec;

module.exports = {
    copyFile: (read1, read2, pathname) => {
        return new Promise((resolve, reject) => {
            exec(`
                mkdir /tmp/${pathname} &&
                mv ${read1} /tmp/${pathname}/read_1.fq &&
                mv ${read2} /tmp/${pathname}/read_2.fq &&
                scp -v -r /tmp/${pathname} vincentl@newriver1.arc.vt.edu:
                `, (err, stdout, stdin) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
};