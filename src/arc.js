var fs = require('fs');
var scp = require('scp2');

module.exports = {
    copyFile: (filepath) => {
        return new Promise((resolve, reject) => {
            scp.scp(filepath, {
                host: 'newriver1.arc.vt.edu',
                username: '', // TODO: determine user account
                privateKey: '', // TODO: add path to private key
                path: '' // TODO: determine path for storing file
            }, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
};