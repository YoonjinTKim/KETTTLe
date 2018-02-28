const d3 = require('d3v4')
const d3dsv = require('d3-dsv')
const d3scale = require('d3-scale');
const d3axis = require('d3-axis');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const exec = require('child_process').exec;

function create(input, job_id) {
    return _uncompress(input, job_id)
        .then(_readFile)
        .then(_parse);
}

function _uncompress(compressed, job_id) {
    return new Promise((resolve, reject) => {
        exec(`tar -xvf ${compressed}`, (err, st1, st2) => {
            if (err) 
                return reject(err);
            resolve(`output_${job_id}.tsv`);
        });
    });
}

function _readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err)
                return reject(err);
            else
                return resolve(data);
        });
    });
}

function _parse(data) {
    return new Promise((resolve, reject) => {
        try {
            let dom = new JSDOM();
            let window = dom.window;
            let dombody = window.document.body;
            let body = d3.select(dombody);
            data = d3dsv.tsvParse(data);
            let maxHeight = data.length ? Number(data[0].EstimatedAbundance) : 250

            let svg = body
                .append('svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 5000)
                .attr('height', maxHeight)
                .attr('xmlns', 'http://www.w3.org/2000/svg');

            // set spacing variables
            var margin = { top: 20, right: 20, bottom: 100, left: 40 },
                width = +svg.attr('width') - margin.left - margin.right,
                height = +svg.attr('height') - margin.top - margin.bottom;

            var x = d3scale.scaleBand()
                .rangeRound([0, width])
                .padding(0.1)
                .domain(data.map((d) => d['#VirusIdentifier']));
            var y = d3scale.scaleLinear()
                .rangeRound([height, 0])
                .domain([0, maxHeight]);
            var dy = maxHeight - height;

            var g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            if (data.length <= 0) {
                g.append('text').attr('y', 50).attr('font-size', 20).text('There was no abundance data produced.');
                return resolve(body.html());
            }

            // add x axis
            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0,${height})`)
                .call(d3axis.axisBottom(x))
                .selectAll('text')  
                    .style('text-anchor', 'end')
                    .attr('dx', '-.8em')
                    .attr('dy', '.15em')
                    .attr('transform', 'rotate(-65)');
            // add y axis        
            g.append('g')
                .attr('class', 'axis axis--y')
                .call(d3axis.axisLeft(y))

            // add bars  
            g.selectAll('.bar')
                .data(data)
                .enter().append('rect')
                    .attr('class', 'bar')
                    .attr('x', (d) => x(d['#VirusIdentifier']))
                    .attr('y', (d) => maxHeight - d.EstimatedAbundance)
                    .attr('height', (d) => d.EstimatedAbundance - dy)
                    .attr('width', x.bandwidth())
                    .attr('fill', 'blue');

            // Controls the text labels at the top of each bar. Partially repeated in the resize() function below for responsiveness.
            g.selectAll('.text')        
                .data(data)
                .enter()
                .append('text')
                .attr('class','label')
                .attr('x', ((d) => x(d['#VirusIdentifier']) + x.bandwidth()/2))
                .attr('y', (d) => maxHeight - d.EstimatedAbundance + 2)
                .attr('dy', '.75em')
            .text((d) => d.EstimatedAbundance)
                .style('fill', 'white')
                .style('font-size', '15px')
                .style('font-weight', '400')
                .style('text-anchor', 'middle');    
            resolve(body.html());
        } catch(err) {
            reject(err);
        }
    });
}

module.exports = {
	create
};