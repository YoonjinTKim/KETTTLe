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
                `, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
            });
        });
    },

    runJob: (jobId) => {
        exec(`ssh vincentl@newriver1.arc.vt.edu "${qsubCommand()}"`, (err, stdout) => {
            console.log(stdout)
        });
    }
};

function qsubCommand(jobId) {
    return `qsub -A cs4884s18 -q p100_dev_q -W group_list=newriver run_job.pbs -F \\"${qsubArguments(jobId)}\\"`;
}

function qsubArguments(jobId) {
    return `$HOME/${jobId}/read_1.fq $HOME/${jobId}/read_2.fq $HOME/FastViromeExplorer/test/testset-kallisto-index.idx ${jobId}`;
}