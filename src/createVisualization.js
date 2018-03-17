const d3 = require('d3v4')
const d3dsv = require('d3-dsv')
const d3scale = require('d3-scale');
const d3axis = require('d3-axis');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const exec = require('child_process').exec;

const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'];

function create(input, job_id) {
    return _uncompress(input, job_id)
        .then(readFile)
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

function readFile(file) {
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
            data = d3dsv.tsvParse(data)
            let maxHeight = data.length ? Number(data[0].EstimatedAbundance) : 250;
            let maxWidth = data.length || 500;

            let margin = { top: 20, right: 20, bottom: 250, left: 75 };
            let svg = body
                .append('svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', (maxWidth * 50) + margin.left)
                .attr('height', 600 + margin.bottom)
                .attr('xmlns', 'http://www.w3.org/2000/svg');

            // set spacing variables
            var width = +svg.attr('width') - margin.left - margin.right;
            var height = +svg.attr('height') - margin.top - margin.bottom;

            var x = d3scale.scaleBand()
                .rangeRound([0, width])
                .padding(0.1)
                .domain(data.map((d) => d['#VirusIdentifier']));
            var y = d3scale.scaleLog()
                .domain([1, maxHeight])
                .rangeRound([height, 0]);

            var g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            if (data.length <= 0) {
                g.append('text')
                    .attr('y', 50)
                    .attr('x', 375)
                    .attr('font-size', 20)
                    .text('There is no abundance data');
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
                    .attr('y', (d) => y(d.EstimatedAbundance))
                    .attr('height', (d) => height - y(d.EstimatedAbundance))
                    .attr('width', x.bandwidth())
                    .attr('fill', 'blue');

            // Controls the text labels at the top of each bar. Partially repeated in the resize() function below for responsiveness.
            g.selectAll('.text')        
                .data(data)
                .enter()
                .append('text')
                .attr('class','label')
                .attr('x', ((d) => x(d['#VirusIdentifier']) + x.bandwidth()/2))
                .attr('y', (d) => y(d.EstimatedAbundance) + 4)
                .attr('dy', '.75em')
            .text((d) => parseInt(d.EstimatedAbundance))
                .style('fill', 'white')
                .style('font-size', '12px')
                .style('font-weight', '400')
                .style('text-anchor', 'middle');    
            resolve(body.html());
        } catch(err) {
            reject(err);
        }
    });
}

function compare(arr, jobIds) {
    return new Promise((resolve, reject) => {
        try {
            let dom = new JSDOM();
            let window = dom.window;
            let dombody = window.document.body;
            let body = d3.select(dombody);
            let data = arr.map((f) => d3dsv.tsvParse(f));
            let maxXValue = 0;
            let maxYValue = 0;
            let minYValue = Number.MAX_SAFE_INTEGER;

            // Add the x value to each data point (it is represented by its index in the list).
            data.forEach((list) => {
                list.forEach((element, index) => {
                    element.x = index + 1; 
                    minYValue = Math.min(minYValue, element.EstimatedAbundance);
                    maxYValue = Math.max(maxYValue, element.EstimatedAbundance);
                });
                maxXValue = Math.max(maxXValue, list.length);
            });

            let margin = { top: 20, right: 20, bottom: 50, left: 50 };
            let width = 600 - margin.left - margin.right;
            let height = 600 - margin.top - margin.bottom;
            let svg = body
                .append('svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('xmlns', 'http://www.w3.org/2000/svg');

            let y = d3scale.scaleLog()
                .range([height, 0])
                .domain([minYValue, maxYValue]);

            let x = d3scale.scaleLinear()
                .range([0, width])
                .domain([1, maxXValue])

            let g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Add all the lines to the plot.
            data.forEach((list, index) => {
                let valueline = d3.line()
                    .x((d) => x(d.x))
                    .y((d) => y(Number(d.EstimatedAbundance)));
                g.append('path')
                    .data([list])
                    .attr('fill', 'none')
                    .attr('stroke', colors[index])
                    .attr('class', 'line')
                    .attr('d', valueline);
            });

            g.append('g')
                .attr('class', 'axis axis--y')
                .call(d3axis.axisLeft(y))

            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0,${height})`)
                .call(d3axis.axisBottom(x).ticks(Math.ceil(maxXValue / 10)))

            // Add the legend.
            let legend = g.append('g')
                .attr('class', 'legend')
                .attr('transform', 'translate(375,20)')

            let legendRow = legend.selectAll('g').data(jobIds)
                .enter()
                .append('g')
                    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            legendRow.append('text')
                    .attr('x', 10)
                    .style('font-size', '12px')
                    .attr('y', 5)
                    .text((d) => d)
            legendRow.append('path')
                    .attr('d', d3.symbol().type(d3.symbolCircle))
                    .attr('fill', (d, i) => colors[i])


            resolve(body.html());
        } catch(err) {
            reject(err);
        }
    });
}

module.exports = {
	create,
    readFile,
    compare
};