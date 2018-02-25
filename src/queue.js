const arc = require('./arc');
const logger = require('./logger');

function Queue() {
    this.array = [];
    this.arcCounter = 0;
    this.threshold = (process.env.NODE_ENV === 'production' ? arc.ARC_QUEUE.prod : arc.ARC_QUEUE.dev).threshold;
}

Queue.prototype.submit = function(jobData) {
    if (this.arcCounter < this.threshold) {
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