const fs = require('fs')
const d3 = require('d3')
const jsdom = require('jsdom/lib/old-api')

let svgCoord = {x:0, y:0}
let txtDimensions = {x:0, y:50, fontsize:50}
let dimensions = {w: 5000, h: 600}

// invoke jsdom
jsdom.env(
  {
    html: '',
    done: function (error, window) {
        if (error) {
			console.log(error);
        }
        // grab the jsdom body with d3
        let body = d3.select(window.document.body);
		//append the svg container
	    var svg = body.append('svg')
			.attr('x', svgCoord.x)
			.attr('y', svgCoord.y)
			.attr('width', dimensions.w)
			.attr('height', dimensions.h)
			.attr('xmlns', 'http://www.w3.org/2000/svg');
		//set spacing variables
		var margin = {top: 20, right: 20, bottom: 100, left: 40},
			width = +svg.attr("width") - margin.left - margin.right,
			height = +svg.attr("height") - margin.top - margin.bottom;
		
		var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
			y = d3.scaleLinear().rangeRound([height, 0]);

		var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		//testData needs to be the path to the input tsv file
		d3.tsv("/testData.tsv", 
			function(d) {
				d.EstimatedAbundance = +d.EstimatedAbundance;
				return d;
			}, 
			function(error, data) {
				if (error) throw error;
			x.domain(data.map(function(d) { return d["#VirusIdentifier"]; }));
			y.domain([0, d3.max(data, function(d) { return d.EstimatedAbundance; })]);
			//If the data file is empty tell the user
			if (data.length <= 0) {
				var p = g.append("text").attr("y", txtDimensions.y).attr("font-size", txtDimensions.fontsize).text("There was no abundance data produced.");
				fs.writeFileSync('output.svg', body.html());
				return;
			}
			//add x axis
			g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
				.selectAll("text")	
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
					.attr("transform", "rotate(-65)");
			//add y axis		
			g.append("g")
				.attr("class", "axis axis--y")
				.call(d3.axisLeft(y).ticks(10))
			.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", "0.71em")
				.attr("text-anchor", "end")
				.text("Abundance");
			//add bars	
			g.selectAll(".bar")
				.data(data)
				.enter().append("rect")
					.attr("class", "bar")
					.attr("x", function(d) { return x(d["#VirusIdentifier"]); })
					.attr("y", function(d) { return y(d.EstimatedAbundance); })
					.attr("height", function(d) { return height - y(d.EstimatedAbundance); })
					.attr("width", x.bandwidth())
					.attr("fill", "blue");

			// Controls the text labels at the top of each bar. Partially repeated in the resize() function below for responsiveness.
			g.selectAll(".text")  		
				.data(data)
				.enter()
				.append("text")
				.attr("class","label")
				.attr("x", (function(d) {return x(d["#VirusIdentifier"]) + x.bandwidth()/2; }  ))
				.attr("y", function(d) { return y(d.EstimatedAbundance) + 1; })
				.attr("dy", ".75em")
				.text(function(d) { return d.EstimatedAbundance; })
				.style("fill", "white")
				.style("font", "15px")
				.style("font-weight", "400")
				.style("text-anchor", "middle");    
			// finished - write out svg to file
			fs.writeFileSync('output.svg', body.html());
		});
    }
  })