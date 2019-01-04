/*
 * IMPORTANT TIP: use the prefix 'cm-' for HTML ids and classes for this graph, such as '.cm-chart'
 * 1. add choropleth map code into initialGraph function using selected Data
 * 2. test until the graph is displayed
 * 3. add dropdown and checkboxes for year and commodity in HTML and JS
 * 4. register event listeners to call initialGraph function with newly selected parameters (year, commodity)
 * 5. test until selections change the choropleth map accordingly
 * 6. style HTML elements using materialize classes (look at markup for bar chart)
 * 7. customize css in main.css
 */
let choroplethMap = function (flatData, topo, yearsSet, countriesSet, shortCommoditiesSet) {

  let margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = document.getElementsByClassName('container')[0].clientWidth - margin.left - margin.right,
    height = width / 2 - margin.top - margin.bottom;

  let svg = d3.select('.cm-chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
  // Map and projection
  let projection = d3.geoNaturalEarth1()
    .scale(width / 2 / Math.PI)
    .translate([width / 2, height / 2]);
  
  let path = d3.geoPath()
    .projection(projection);
  
  let tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
  
  // Data and color scale
  let mapData = d3.map();
  let colorScheme = d3.schemeReds[6];
  colorScheme.unshift("#eee")
  let colorScale = d3.scaleThreshold()
    .domain([0.01, 0.25, 0.5, 1, 2, 5])
    .range(colorScheme);
  
  let g = svg.append("g")
    .attr("class", "legendThreshold")
    .attr("transform", "translate(20,20)");
  g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .text("Total prices of selected commodities");
  let labels = ['0', '1-4', '5-9', '10-14', '15-19', '20-24', '> 25'];
  let legend = d3.legendColor()
    .labels(function (d) { return labels[d.i]; })
    .shapePadding(1)
    .scale(colorScale);
  
  svg.select(".legendThreshold")
    .call(legend);
  
  // Selected values for the chart; values get initialized to fill the chart
  let selectedPpp = true;
  let selectedYear = '2015';
  let selectedShortCommodity = 'Maize';

  // TODO add menus for year and commodity selection
  /*
   * add HTML code in chart.html
   * initialize menu variables with d3.select/d3.selectAll
   */
  
  //Chi: a function to initialize choropleth map
  //Designed to display all countries in the data, so skipping country selections
  let initialGraph = function (exchange, year, shortCommodities) {
    let selectedData = flatData.filter(
      (d) => +d.year === +year && shortCommodities.indexOf(d.shortCommodity) > -1
    );
    console.log(selectedData);
    //Chi: trying to get the sum of prices of all selected commodities from each country for easier map display
    for (var i = 0; i < selectedData.length; i++) {
      countryName = selectedData[i].country;
      if (mapData.has(countryName)) {
        meanPrice = mapData.get(countryName);
        newPrice = meanPrice + (exchange) ? selectedData[i].meanDollarPpp : selectedData[i].meanDollarEr;
        mapData.set(countryName, newPrice);
      } else {
        meanPrice = (exchange) ? selectedData[i].meanDollarPpp : selectedData[i].meanDollarEr;
        mapData.set(countryName, meanPrice);
      }
    }
    //For debug
    console.log(mapData);
    //Chi: drawing the map
    svg.append("g")
      .attr("class", "mCountries")
      .selectAll("path")
      .data(topo.features)
      .enter().append("path")
      .attr("fill", function (d){
        // Get the price data for this country
        var price = mapData.get(d.properties.name) || 0;
        // Set the color
        return colorScale(price);
      })
      .attr("d", path);
  };

  initialGraph(selectedPpp, selectedYear, selectedShortCommodity);

  // TODO when selected year or commodity changes, register an eventlistener
  // remember to delete all elements of the svg before calling initialGraph()
};