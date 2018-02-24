const fs = require('fs');
const exec = require('child_process').exec;
const logger = require('./logger');
const db = require('./db');

const REFERENCE_DB = {
    NCBI: {
        index: 'ncbi-virus-kallisto-index-k31.idx',
        genome: 'ncbi-viruses-list.txt'
    },
    NCBI_EUKARYOTIC: {
        index: 'eukaryotic-virus-kallisto-index-k31.idx',
        genome: 'ncbi-viruses-list.txt'
    },
    NCBI_PHAGE: {
        index: 'phage-kallisto-index-k31.idx',
        genome: 'ncbi-viruses-list.txt'
    },
    JGI: {
        index: 'imgvr-virus-kallisto-index-k31.idx',
        genome: 'imgvr-viruses-list.txt'
    },
    GLOBAL_OCEAN_VIROME: {
        index: 'GOV_viral_contigs_EPI_MES.idx',
        genome: 'GOV_viral_contigs_EPI_MES_list.txt'
    }
};

function copyFile(read1, read2, pathname) {
    return new Promise((resolve, reject) => {
        exec(`
            mkdir /tmp/${pathname} &&
            mv ${read1} /tmp/${pathname}/read_1.fq &&
            mv ${read2} /tmp/${pathname}/read_2.fq &&
            scp -v -r /tmp/${pathname} ${process.env.ARC_USER}@newriver1.arc.vt.edu:`,
            (err) => _promiseHandler(err, resolve, reject)
        );
    });
}

function runJob(jobData) {
    let { _id, database } = jobData;
    let command = `ssh ${process.env.ARC_USER}@newriver1.arc.vt.edu "${_qsubCommand(_id, REFERENCE_DB[database])}"`;
    exec(command, (err, stdout) => {
        if (err)
            logger.log({ level: 'error', message: 'Failed to run ssh command to start qsub job', err, command });
        else
            db.jobs.update({ _id: db.ObjectId(_id) }, { $set: { qsub_id: stdout.trim() } });
    });
}

function retrieveOutput(jobId) {
    return new Promise((resolve, reject) => {
        exec(`scp ${process.env.ARC_USER}@newriver1.arc.vt.edu:${jobId}/output.tar.gz /tmp/output_${jobId}.tar.gz`,
            (err) => _promiseHandler(err, resolve, reject)
        );
    });
}

function _qsubCommand(jobId, database) {
    return `qsub -A cs4884s18 -q p100_dev_q -W group_list=newriver run_job.pbs -F \\"${_qsubArguments(jobId, database)}\\"`;
}

/**
 * The arguments that are returned in this function must match the arguments listed in `run_job.pbs`
 */
function _qsubArguments(jobId, { index, genome }) {
    let read1 = `${jobId}/read_1.fq`;
    let read2 = `${jobId}/read_2.fq`;
    let args = [ read1, read2, index, jobId, process.env.ARC_USER, genome ];
    return args.join(' ');
}

function _promiseHandler(err, resolve, reject, result) {
    if (err)
        reject(err);
    else
        resolve(result);
}

module.exports = {
    copyFile,
    runJob,
    retrieveOutput
};