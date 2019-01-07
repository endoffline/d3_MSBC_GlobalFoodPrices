
// 2. Use the margin convention practice
  var margin = {top: 20, right: 20, bottom: 30, left: 30},
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
    .range([0, width-20]); // output
  
  let yScale = d3.scaleLinear()
    //.domain([0, 1]) // input
    .range([height, 0]); // output

let selectedValues = d3.select('#lg-selectedValues');

let updateSelectedValuesHTML = function(country, commodity) {
  selectedValues.html(country + ', ' + commodity);
};

let initLineGraph = function (flatData, yearsSet, exchange, year, country, shortCommodity) {
  svgLine.selectAll('*').remove();
  console.log(exchange + year + country + shortCommodity);
  // Filter the data according to the chosen values
  let selectedData = flatData.filter(
    (d) => d.year !== 2018 && d.country === country && d.shortCommodity == shortCommodity
  );
  console.log(selectedData);
  console.log(yearsSet);
// 7. d3's line generator
  xScale.domain(d3.extent(selectedData, (d) => d.year));
  let maxPrice = d3.max(selectedData, (d) => (exchange) ? d.meanDollarPpp : d.meanDollarEr);
  yScale.domain([0, maxPrice]);
  
  let line = d3.line()
    .x(function (d, i) {
      return xScale(d.year);
    }) // set the x values for the line generator
    .y(function (d) {
      return yScale((exchange) ? d.meanDollarPpp : d.meanDollarEr);
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

// 9. Append the path, bind the data, and call the line generator
  svgLine.append("path")
    .datum(selectedData) // 10. Binds data to the line
    .attr("class", "line") // Assign a class for styling
    .attr("d", line); // 11. Calls the line generator

  
// 12. Appends a circle for each datapoint
  svgLine.selectAll(".dot")
    .data(selectedData)
    .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function (d, i) {
      return xScale(d.year)
    })
    .attr("cy", function (d) {
      return yScale((exchange) ? d.meanDollarPpp : d.meanDollarEr)
    })
    .attr("r", 5)
    .on('mouseover', function (d) {
      tooltip.transition()
        .duration(200)
        .style('opacity', .9);
    
      tooltip.html(
        '<div>year:' + d.year + '</div>' +
        '<div>mean: $' + ((exchange) ? d.meanDollarPpp : d.meanDollarEr) + ' / ' + d.unit + '</div>' +
        '<div>original: ' + d.currency + ' ' + d.meanOriginal + ' / ' + d.unitOriginal + '</div>'
      )
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', (d3.event.pageY - 30) + 'px')
    })
    .on('mouseout', function () {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    })
  ;
  
  updateSelectedValuesHTML(country, shortCommodity);
};