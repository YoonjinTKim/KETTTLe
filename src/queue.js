const arc = require('./arc');
const logger = require('./logger');

const ARC_JOB_THRESHOLD = 5;

function Queue() {
    this.array = [];
    this.arcCounter = 0;
}

Queue.prototype.submit = function(jobData) {
    if (this.arcCounter < ARC_JOB_THRESHOLD) {
        this.arcCounter ++;
        arc.runJob(jobData);
    } else {
        this.array.push(jobData);
    }
}

Queue.prototype.runNext = function() {
    if (this.arcCounter <= 0) {
        logger.log({ level: 'error', message: 'Invalid job has been completed' });
        return;
    }

    this.arcCounter --;

    if (this.array.length > 0) {
        this.arcCounter ++;
        arc.runJob(this.array.shift());
    }
}

module.exports = Queue;