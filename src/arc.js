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

const ARC_QUEUE = {
    prod: {
        name: 'normal_q',
        threshold: 6
    },
    dev: {
        name: 'dev_q',
        threshold: 1
    }
};

const sshUrl = `${process.env.ARC_USER}@newriver1.arc.vt.edu`;
const queue = process.env.NODE_ENV === 'production' ? ARC_QUEUE.prod : ARC_QUEUE.dev;

function copyFile(read1, read2, pathname) {
    return new Promise((resolve, reject) => {
        exec(`
            mkdir /tmp/${pathname} &&
            mv ${read1} /tmp/${pathname}/read_1.fq &&
            mv ${read2} /tmp/${pathname}/read_2.fq &&
            scp -v -r /tmp/${pathname} ${sshUrl}:/work/newriver/${process.env.ARC_USER} &&
            rm /tmp/${pathname}/read_1.fq /tmp/${pathname}/read_2.fq &&
            rm -r /tmp/${pathname}`,
            (err) => _promiseHandler(err, resolve, reject)
        );
    });
}

function runJob(jobData) {
    return new Promise((resolve, reject) => {
        // Sanity check.
        if (!jobData) return resolve(false);
        let { _id, database, read_count } = jobData;
        if (!REFERENCE_DB[database]) {
            logger.log({ level: 'error', message: 'Reference database not found' });
            return resolve(false);
        }
        let command;
        if (read_count === 1 || read_count === 2) {
            command = `ssh ${sshUrl} "${_qsubCommand(_id, REFERENCE_DB[database], read_count)}"`;
        } else {
            logger.log({ level: 'error', message: 'Job data has invalid read count' });
            return resolve(false);
        }
        exec(command, (err, stdout, stderr) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to run ssh command to start qsub job', err, stdout, stderr });
                reject(err);
            } else {
                db.jobs.update({ _id: db.ObjectId(_id) }, { $set: {
                    qsub_id: stdout.trim(),
                    status: 'submitted'
                }});
                resolve(true);
            }
        });
    });
}

function retrieveOutput(jobId) {
    let output = `/tmp/output_${jobId}.tar.gz`;
    return new Promise((resolve, reject) => {
        exec(`scp ${sshUrl}:/work/newriver/${process.env.ARC_USER}/${jobId}/output.tar.gz ${output}`,
            (err) => _promiseHandler(err, resolve, reject, output)
        );
    });
}

function retrieveAbundance(jobId) {
    let output = `/tmp/abundance_${jobId}.tar.gz`;
    return new Promise((resolve, reject) => {
        exec(`scp ${sshUrl}:/work/newriver/${process.env.ARC_USER}/${jobId}/abundance.tar.gz ${output}`,
            (err) => _promiseHandler(err, resolve, reject, output)
        );
    });
}

function getJobCount() {
    return new Promise((resolve, reject) => {
        exec(`ssh ${sshUrl} "qstat | grep ${process.env.ARC_USER} | wc -l"`,
            (err, stdout, stderr) => {
                if (err) return reject(err);

                let count = 0;
                try {
                    count = Number(stdout);
                } catch(e) {
                    return reject(e);
                }

                resolve(count);
            }
        );
    });
}

function findAndRunJob() {
    return new Promise((resolve, reject) => {
        db.jobs.findOne({ status: 'waiting' }, (err, job) => {
            if (err || !job) {
                if (err) {
                    logger.log({ level: 'error', message: 'Failed to find job to be run after a different job finished', err });
                    return reject(err);
                }
                return resolve();
            }
            resolve(job);
        })
    });
}

function runOrWait(count, jobData) {
    if (count < queue.threshold) {
        if (jobData)
            return runJob(jobData)
        else
            return findAndRunJob().then(runJob)
    }
}

function remove(path) {
    exec(`rm ${path}`);
}

function _qsubCommand(jobId, database, count) {
    let name = queue.name;
    return `qsub -A cs4884s18 -q ${name} -W group_list=newriver run_job_${count}.pbs -F \\"${_qsubArguments(jobId, database, count)}\\"`;
}

/**
 * The arguments that are returned in this function must match the arguments listed in `run_job.pbs`
 */
function _qsubArguments(jobId, { index, genome }, count) {
    let read1 = `${jobId}/read_1.fq`;
    let read2 = `${jobId}/read_2.fq`;
    let reads = [ read1 ];
    if (count === 2) reads.push(read2);
    let args = [ ...reads, index, jobId, process.env.ARC_USER, genome ];
    return args.join(' ');
}

function _promiseHandler(err, resolve, reject, result) {
    if (err)
        reject(err);
    else
        resolve(result);
}

module.exports = {
    REFERENCE_DB,
    ARC_QUEUE,
    copyFile,
    runJob,
    retrieveOutput,
    retrieveAbundance,
    getJobCount,
    runOrWait,
    remove
};