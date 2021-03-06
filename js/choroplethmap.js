/*
 * Tutorial: http://bl.ocks.org/palewire/d2906de347a160f38bc0b7ca57721328
 *
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

  let svgMap = d3.select('.cm-chart')
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

  let selectedValues = d3.select('#cm-selectedValues');
  // Data and color scale
  let mapData = d3.map();
  let colorScheme = d3.schemeReds[9];
  //let colorScheme = ['#b2dfdb', '#4db6ac', '#009688', '#e1bee7', '#ba68c8', '#9c27b0', '#f44336', '#d32f2f', '#b71c1c'];
  colorScheme.unshift('#eee');
  let colorScale = d3.scaleThreshold()
    .domain([0.01, 0.25, 0.5, 1, 2, 5, 10, 20, 50])
    .range(colorScheme);
  
  let g = svgMap.append('g')
    .attr('class', 'legendThreshold')
    .attr('transform', 'translate(20,20)');
  g.append('text')
    .attr('class', 'caption')
    .attr('x', 0)
    .attr('y', -6)
    .text('Mean prices of selected commodity in USD');
  let labels = [
    '\u00A0\u00A00.00',
    '\u00A0\u00A00.01 - \u00A0\u00A00.24',
    '\u00A0\u00A00.25 - \u00A0\u00A00.49',
    '\u00A0\u00A00.50 - \u00A0\u00A00.99',
    '\u00A0\u00A01.00 - \u00A0\u00A01.99',
    '\u00A0\u00A02.00 - \u00A0\u00A04.99',
    '\u00A0\u00A05.00 - \u00A0\u00A09.99',
    '10.00 - 19.99',
    '20.00 - 49.99',
    '>= 50.00'
  ];
  let legend = d3.legendColor()
    .labels(function (d) { return labels[d.i]; })
    .shapePadding(1)
    .scale(colorScale);

  svgMap.select('.legendThreshold')
    .call(legend);

  // Selected values for the chart; values get initialized to fill the chart
  let selectedPpp = true;
  let selectedYear = '2015';
  let selectedShortCommodity = 'Rice';

  let exchangeMenu = d3.selectAll("input[name='cm-exchangeGroup']");  // Radio buttons for selecting the exchange rate
  let yearMenu = d3.select('#cm-yearDropdown');                       // Dropdown for selecting the year
  let yearSlider = d3.select('#cm-yearSlider');                       // Range slider for selecting the year
  let shortCommoditiesList = d3.select('#cm-commoditiesList');        // List of radiobuttons for selecting the commodities

  // Dropdown menu for year selection
  yearMenu
    .append('select')
    .selectAll('option')
    .data(yearsSet.slice().reverse())
    .enter()
    .append('option')
    .attr('value', (year) => year)
    .text((year) => year + ' (' + getYearItemsCount(flatData, year) + ')');
  yearMenu
    .append('label')
    .text('Select year:');
  yearMenu
    .selectAll('option')
    .filter((year) => +selectedYear === +year)
    .attr('selected', true);
  
  yearSlider
    .attr('min', yearsSet[0])
    .attr('max', yearsSet[yearsSet.length-1])
    .attr('value', selectedYear);
  
  // list for commodity selection
  shortCommoditiesList
    .selectAll('input')
    .data(shortCommoditiesSet)
    .enter()
    .append('label')
    .attr('for', (commodity) => 'cm-' + commodity)
    .attr('class', 'col s3')
    .append('input')
    .attr('type', 'radio')
    .attr('class', 'cm-radioCommodity')
    .attr('name', 'cm-radioCommodity')
    .attr('id', (commodity) => 'cm-' + commodity)
    .attr('value', (commodity) => commodity);
  shortCommoditiesList
    .selectAll('label')
    .append('span')
    .text((commodity) =>
      commodity
      + ' ('
      + getShortCommodityItemsCountDependingOnYear(flatData, selectedYear, commodity)
      + ')'
    );
  shortCommoditiesList
    .selectAll('input')
    .filter((commodity) => selectedShortCommodity === commodity)
    .attr('checked', true);
  
  let updateSelections = function () {
    shortCommoditiesList
      .selectAll('span')
      .text((commodity) =>
        commodity
        + ' ('
        + getShortCommodityItemsCountDependingOnYear(flatData, selectedYear, commodity)
        + ')'
      );
  };
  
  let updateSelectedValuesHTML = function() {
    selectedValues.html(selectedYear + ', ' + selectedShortCommodity);
  };
  
  //Chi: a function to initialize choropleth map
  //Designed to display all countries in the data, so skipping country selections
  let initialGraph = function (exchange, year, shortCommodity) {
    
    let selectedData = flatData.filter(
      (d) => +d.year === +year && d.shortCommodity === shortCommodity
    );
    console.log(selectedData);
    mapData = d3.map();
    //Chi: trying to get the sum of prices of all selected commodities from each country for easier map display
    for (var i = 0; i < selectedData.length; i++) {
      let countryName = selectedData[i].country;
      let meanPrice = (exchange) ? selectedData[i].meanDollarPpp : selectedData[i].meanDollarEr;
      mapData.set(countryName, meanPrice);
    }
    
    //Chi: drawing the map
    svgMap.append('g')
      .attr('class', 'mCountries')
      .selectAll('path')
      .data(topo.features)
      .enter().append('path')
      .attr('fill', function (d){
        // Get the price data for this country
        let price = mapData.get(d.properties.name) || 0;
        // Set the color
        return colorScale(price);
      })
      .attr('stroke', '#455a64')
      .attr('stroke-width', '1')
      .attr('d', path)
      .attr('id', (d) => 'cm-path-' + d.properties.name)
      .on('mouseover', function (d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
    
        tooltip.html(
          '<div>' + d.properties.name + '</div>' +
          '<div>' + ((mapData.get(d.properties.name)) ? '$' + mapData.get(d.properties.name) : 'no data') + '</div>'
        )
          .style('left', (d3.event.pageX + 10) + 'px')
          .style('top', (d3.event.pageY - 30) + 'px');
        
        if ((mapData.get(d.properties.name))) {
          d3.select(this)
            .attr('stroke', '#ffd54f')
            .attr('stroke-width', '3');
        }
      })
      .on('mouseout', function () {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
        
        d3.select(this)
          .attr('stroke', '#455a64')
          .attr('stroke-width', '1');
        
      })
      .on('click', function(d) {
        let selectedCountry = d3.select(this).property('id').slice(8);
        if (mapData.get(d.properties.name)) {
          initLineGraph(flatData, yearsSet, selectedPpp, selectedYear, selectedCountry, selectedShortCommodity);
        }
      });
  
    updateSelectedValuesHTML();
  };
  
  initialGraph(selectedPpp, selectedYear, selectedShortCommodity);
  initLineGraph(flatData, yearsSet, selectedPpp, selectedYear, 'Nigeria', selectedShortCommodity);
  
  // Register event listeners on the radio buttons, dropdown menu, and checkboxes to redraw the graph when the selection has changes
  exchangeMenu.on('change', function () {
    let sExchange = d3.select("input[name='cm-exchangeGroup']:checked");
    selectedPpp = (sExchange.attr('id') === 'cm-pppRadio');

    initialGraph(selectedPpp, selectedYear, selectedShortCommodity);
  });

  yearMenu.on('change', function () {
    // Find which year was selected from the dropdown
    selectedYear = d3.select(this)
      .select('select')
      .property('value');

    updateSelections();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodity);
  });
  
  yearSlider.on('input', function () {
    // Find which year was selected from the dropdown
    selectedYear = d3.select(this)
      .property('value');
    
    updateSelections();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodity);
  });

  shortCommoditiesList.on('change', function () {
    // Find which commodity was selected from the radio buttons
    selectedShortCommodity = d3.selectAll('input.cm-radioCommodity:checked').property('value');
    console.log(selectedShortCommodity);
    updateSelections();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodity);
  });
};
