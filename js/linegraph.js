/*
 * Tutorials:
 * https://bl.ocks.org/anonymous/4d3c3b9b2e69d8f62333933c6f6e28e1
 * https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0
 * https://blockbuilder.org/abrahamdu/65e36be64d281e3429b1fe238adabd25
 */
// 2. Use the margin convention practice
let margin = {top: 20, right: 200, bottom: 30, left: 30},
  width = document.getElementsByClassName('container')[0].clientWidth - margin.left - margin.right,
  height = width / 2 - margin.top - margin.bottom;

// 1. Add the SVG to the page and employ #2
let svgLine = d3.select('.lg-chart')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

let tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

let xScale = d3.scaleLinear()
  //.domain([0, n - 1]) // input
  .range([0, width]); // output

let yScale = d3.scaleLinear()
  //.domain([0, 1]) // input
  .range([height, 0]); // output

let color = d3.scaleOrdinal().range(['#ffc107', '#f44336']);
let selectedValues = d3.select('#lg-selectedValues');

let updateSelectedValuesHTML = function(country, commodity) {
  selectedValues.html(country + ', ' + commodity);
};

let initLineGraph = function (flatData, yearsSet, exchange, year, country, shortCommodity) {
  svgLine.selectAll('*').remove();
  console.log(exchange + year + country + shortCommodity);
  // Filter the data according to the chosen values
  let selectedData = flatData.filter(
    (d) => d.year !== 2018 && d.country === country && d.shortCommodity === shortCommodity
  );
  
  let transformedData =
    [
      {
        id: 'Purchasing Power Parity',
        values: selectedData.map(
          (d) => {
            return {
              year: d.year,
              mean: d.meanDollarPpp,
              meanOriginal: d.meanOriginal,
              unit: d.unit,
              unitOriginal: d.unitOriginal,
              currency: d.currency
            };
          }
        )
      },
      {
        id: 'Local Currency Unit',
        values: selectedData.map(
          (d) => {
            return {
              year: d.year,
              mean: d.meanDollarEr,
              meanOriginal: d.meanOriginal,
              unit: d.unit,
              unitOriginal: d.unitOriginal,
              currency: d.currency
            };
          }
        )
      }
    ];
  console.log(transformedData);
  console.log(selectedData);
  console.log(yearsSet);
// 7. d3's line generator
  xScale.domain(d3.extent(selectedData, (d) => d.year));
  //let maxPrice = d3.max(selectedData, (d) => (exchange) ? d.meanDollarPpp : d.meanDollarEr);
  let maxPrice = d3.max(transformedData, (d) => d3.max(d.values, (dd) => dd.mean));
  yScale.domain([0, maxPrice]);
  
  color.domain(transformedData.map((d) => d.id));
  
  let line = d3.line()
    .x(function (d, i) {
      return xScale(d.year);
    }) // set the x values for the line generator
    .y(function (d) {
      return yScale(d.mean);
    }) // set the y values for the line generator
    .curve(d3.curveMonotoneX) // apply smoothing to the line
  
// 3. Call the x axis in a group tag
  svgLine.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

// 4. Call the y axis in a group tag
  svgLine.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("x", 5)
    .attr("y", yScale(yScale.ticks().pop()) - 10)
    .attr("dy", "0.32em")
    .attr("text-anchor", "start")
    .attr("font-size", 14)
    .text(" Price in USD");


  let lines = svgLine
    .append('g')
    .attr('class', 'lines');
  
  lines.selectAll('.line-group')
    .data(transformedData)
    .enter()
    .append('g')
    .attr('class', 'line-group')
    .append("path")
    .attr("class", "line") // Assign a class for styling
    .attr("d", (d) => line(d.values)) // 11. Calls the line generator
    .style("stroke", (d, i) => color(i));
    
  lines.selectAll('.line-group')
    .append("text")
    .datum((d) => { return {id: d.id, value: d.values[0]} })
    .attr("transform", function(d) { return "translate(" + xScale(d.value.year) + "," + yScale(d.value.mean) + ")"; })
    .attr("x", 10)
    .attr("dy", "0.35em")
    .style("font", "14px")
    .text(function(d) { return d.id; });
  
// 12. Appends a circle for each datapoint
  svgLine.selectAll(".circle-group")
    .data(transformedData)
    .enter()
    .append('g')
    .style('fill', (d, i) => color(i))
    .selectAll('.circle')
    .data((d) => d.values)
    .enter()
    .append('g') // Uses the enter().append() method
    .attr("class", "circle") // Assign a class for styling
    .append('circle')
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.mean))
    .attr("r", 4)
    .on('mouseover', function (d) {
      tooltip.transition()
        .duration(200)
        .style('opacity', .9);
    
      tooltip.html(
        '<div>year: ' + d.year + '</div>' +
        '<div>mean: $' + d.mean + ' / ' + d.unit + '</div>' +
        '<div>original: ' + d.currency + ' ' + d.meanOriginal + ' / ' + d.unitOriginal + '</div>'
      )
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', (d3.event.pageY - 30) + 'px');
  
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 6);
    })
    .on('mouseout', function () {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
  
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 4);
    })
  ;
  
  updateSelectedValuesHTML(country, shortCommodity);
};