const d3 = require('d3v4')
const d3dsv = require('d3-dsv')
const d3scale = require('d3-scale');
const d3axis = require('d3-axis');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const exec = require('child_process').exec;

// Shades of colors in groups of 3
const colors = [ '#3182bd','#6baed6','#9ecae1','#e6550d','#fd8d3c','#fdae6b','#31a354','#74c476','#a1d99b','#636363','#969696','#393b79','#5254a3','#6b6ecf','#637939','#8ca252','#b5cf6b','#8c6d31','#bd9e39','#e7ba52','#843c39','#ad494a','#d6616b','#756bb1','#9e9ac8','#7b4173','#a55194','#ce6dbd', '#000000' ]
const TOP_N_SAMPLES = 20;
const IDENTIFIER = '#VirusIdentifier';
const NAME = 'VirusName';

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
            data = d3dsv.tsvParse(data).slice(0, TOP_N_SAMPLES);
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

function compare(arr, jobs) {
    return new Promise((resolve, reject) => {
        try {
            let dom = new JSDOM();
            let window = dom.window;
            let dombody = window.document.body;
            let body = d3.select(dombody);
            let data = arr.map((f) => d3dsv.tsvParse(f));

            let viruses = {};
            let result = [];
            let jobNames = [];
            let indexedVirusNames = {};
            jobs.forEach((job) => jobNames.push(job.name));

            function getVirusName(virus) {
                return virus[ virus[NAME] === 'N/A' ? IDENTIFIER : NAME ];
            }

            data.forEach((list, index) => {
                let total = 0;
                result.push({ name: jobNames[index] });
                list = list.slice(0, TOP_N_SAMPLES);
                list.forEach((element) => {
                    viruses[getVirusName(element)] = 0;
                    total += Number(element.EstimatedAbundance);
                });
                list.forEach((element) => {
                    let name = getVirusName(element);
                    result[index][name] = Number(element.EstimatedAbundance) / total;
                    viruses[name] += result[index][name]
                });
            });

            // Sort virus names and only include top N values.
            let virusNames = Object.keys(viruses)
                .sort((a, b) => viruses[b] - viruses[a])
                .slice(0, TOP_N_SAMPLES);

            virusNames = ['Other'].concat(virusNames);

            // Index the virus names for quick lookup.
            virusNames.forEach((v) => indexedVirusNames[v] = 1);

            // Add 'other' bar stack to all bars.
            // This is because we trim the data to the top N samples which
            // causes a lot of missing areas in each bar (due to imperfect sampling).

            data.forEach((list, index) => {
                let topNSum = 0;
                list.forEach((element) => {
                    let name = getVirusName(element);
                    if (indexedVirusNames[name]) {
                        topNSum += (result[index][name] || 0);
                    }
                });

                result[index]['Other'] = 1 - topNSum;
            });

            data = result;

            let margin = { top: 20, right: 400, bottom: 50, left: 50 };
            let width = 1250 - margin.left - margin.right;
            let height = 700 - margin.top - margin.bottom;
            let svg = body
                .append('svg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('xmlns', 'http://www.w3.org/2000/svg');

            let x = d3.scaleBand()
                .rangeRound([0, width])
                .padding(0.4)
                .align(0.3)
                .domain(jobNames);

            let y = d3.scaleLinear()
                .rangeRound([height, 0])
                .domain([0, 1])
                .nice();

            let z = d3.scaleOrdinal(colors).domain(virusNames);
            let stack = d3.stack();

            let g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

             g.selectAll('.serie')
                .data(stack.keys(virusNames)(data))
                .enter().append('g')
                .attr('class', 'serie')
                .attr('fill', (d) => z(d.key))
                .selectAll('rect')
                .data((d) => d)
                .enter().append('rect')
                .attr('x', (d) => x(d.data.name))
                .attr('y', (d) => isNaN(d[1]) ? 0 : y(d[1]))
                .attr('height', (d) => isNaN(d[0]) || isNaN(d[1]) ? 0 : y(d[0]) - y(d[1]))
                .attr('width', x.bandwidth());


            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x));

            g.append('g')
                .attr('class', 'axis axis--y')
                .call(d3.axisLeft(y).ticks(10, 's').tickFormat(d3.format('.0%')))
                .append('text')
                .attr('x', 2)
                .attr('y', y(y.ticks(10).pop()))
                .attr('dy', '0.35em')
                .attr('text-anchor', 'start')
                .attr('fill', '#000')

            var legend = g.selectAll('.legend')
                .data(virusNames)
                .enter().append('g')
                .attr('class', 'legend')
                .attr('transform', (d, i) => `translate(0,${i * 20})`)
                .style('font', '6px sans-serif !important');

            legend.append('rect')
                .attr('x', width + 18)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', z);

            legend.append('text')
                .attr('x', width + 44)
                .attr('y', 9)
                .attr('dy', '.35em')
                .attr('text-anchor', 'start')
                .style('font', '6px sans-serif !important')
                .text((d) => d);


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