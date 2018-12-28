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
let choroplethMap = function (flatData, yearsSet, countriesSet, shortCommoditiesSet) {

  let margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = document.getElementsByClassName('container')[0].clientWidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  let svg = d3.select('.cm-chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  let tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Selected values for the chart; values get initialized to fill the chart
  let selectedPpp = true;
  let selectedYear = '2015';
  let selectedShortCommodity = 'Wheat flour';

  // TODO add menus for year and commodity selection
  /*
   * add HTML code in chart.html
   * initialize menu variables with d3.select/d3.selectAll
   */

  // Function to create the initial graph
  let initialGraph = function (exchange, year, shortCommodities) {

    // Filter the data according to the chosen values
    let selectedData = flatData.filter(
      (d) => +d.year === +year && shortCommodities.indexOf(d.shortCommodity) > -1
    );
    console.log(selectedData);

    // TODO put chart code here
    // TODO use selectedData for the map
    // best look at tutorials on the internet
  };

  initialGraph(selectedPpp, selectedYear, selectedShortCommodity);

  // TODO when selected year or commodity changes, register an eventlistener
  // remember to delete all elements of the svg before calling initialGraph()
};