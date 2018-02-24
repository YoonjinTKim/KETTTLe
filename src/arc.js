var fs = require('fs');
var exec = require('child_process').exec;

module.exports = {
    copyFile: (read1, read2, pathname) => {
        return new Promise((resolve, reject) => {
            exec(`
                mkdir /tmp/${pathname} &&
                mv ${read1} /tmp/${pathname}/read_1.fq &&
                mv ${read2} /tmp/${pathname}/read_2.fq &&
                scp -v -r /tmp/${pathname} ${process.env.ARC_USER}@newriver1.arc.vt.edu:`,
                (err) => promiseHandler(err, resolve, reject)
            );
        });
    },

    runJob: (jobId) => {
        exec(`ssh ${process.env.ARC_USER}@newriver1.arc.vt.edu "${qsubCommand(jobId)}"`, (err, stdout) => {
            console.log(stdout)
        });
    },

    retrieveOutput: (jobId) => {
        return new Promise((resolve, reject) => {
            // TODO: copy actual job specific output
            exec(`scp ${process.env.ARC_USER}@newriver1.arc.vt.edu:${jobId}/output.tar.gz /tmp/output_${jobId}.tar.gz`,
                (err) => promiseHandler(err, resolve, reject)
            );
        });
    }
};

function qsubCommand(jobId) {
    return `qsub -A cs4884s18 -q p100_dev_q -W group_list=newriver run_job.pbs -F \\"${qsubArguments(jobId)}\\"`;
}

function qsubArguments(jobId) {
    return `${jobId}/read_1.fq ${jobId}/read_2.fq FastViromeExplorer/test/testset-kallisto-index.idx ${jobId} ${process.env.ARC_USER}`;
}

function promiseHandler(err, resolve, reject, result) {
    if (err)
        reject(err);
    else
        resolve(result);
}