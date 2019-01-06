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

  // Data and color scale
  let mapData = d3.map();
  let colorScheme = d3.schemeReds[6];
  colorScheme.unshift("#eee")
  let colorScale = d3.scaleThreshold()
    .domain([0.01, 0.25, 0.5, 1, 2, 5])
    .range(colorScheme);

  // TODO fix legend
  let g = svgMap.append("g")
    .attr("class", "legendThreshold")
    .attr("transform", "translate(20,20)");
  g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .text("Total prices of selected commodities");
  let labels = ['0', '0.01-0.24', '0.25-0.49', '0.5-0.99', '1-1.99', '2-4.99', '> 4.9'];
  let legend = d3.legendColor()
    .labels(function (d) { return labels[d.i]; })
    .shapePadding(1)
    .scale(colorScale);

  svgMap.select(".legendThreshold")
    .call(legend);

  // Selected values for the chart; values get initialized to fill the chart
  let selectedPpp = true;
  let selectedYear = '2015';
  let selectedShortCommodities = ['Maize'];

  let exchangeMenu = d3.selectAll("input[name='cm-exchangeGroup']");  // Radio buttons for selecting the exchange rate
  let yearMenu = d3.select('#cm-yearDropdown');                      // Dropdown for selecting the year
  let yearSlider = d3.select('#cm-yearSlider');
  let shortCommoditiesList = d3.select('#cm-commoditiesList');       // List of checkboxes for selecting the commodities

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

  // TODO change to radio buttons
  // Checkbox list for commodity selection
  shortCommoditiesList
    .selectAll('input')
    .data(shortCommoditiesSet)
    .enter()
    .append('label')
    .attr('for', (commodity) => 'cm-' + commodity)
    .attr('class', 'col s3')
    .append('input')
    .attr('type', 'checkbox')
    .attr('class', 'cm-checkboxCommodity')
    .attr('name', (commodity) => 'cm-' + commodity)
    .attr('id', (commodity) => 'cm-' + commodity)
    .attr('value', (commodity) => 'cm-' + commodity);
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
    .filter((commodity) => selectedShortCommodities.indexOf(commodity) > -1)
    .attr('checked', true);

  //Chi: a function to initialize choropleth map
  //Designed to display all countries in the data, so skipping country selections
  let initialGraph = function (exchange, year, shortCommodities) {
    let selectedData = flatData.filter(
      (d) => +d.year === +year && shortCommodities.indexOf(d.shortCommodity) > -1
    );
    console.log(selectedData);
    mapData = d3.map();
    //Chi: trying to get the sum of prices of all selected commodities from each country for easier map display
    for (var i = 0; i < selectedData.length; i++) {
      countryName = selectedData[i].country;
      if (mapData.has(countryName)) {
        meanPrice = mapData.get(countryName);
        if (exchange) {
          newPrice = meanPrice + selectedData[i].meanDollarPpp;
        } else {
          newPrice = meanPrice + selectedData[i].meanDollarEr;
        }
        //newPrice = meanPrice + (exchange) ? selectedData[i].meanDollarPpp : selectedData[i].meanDollarEr;
        mapData.set(countryName, newPrice);
      } else {
        meanPrice = (exchange) ? selectedData[i].meanDollarPpp : selectedData[i].meanDollarEr;
        mapData.set(countryName, meanPrice);
      }
    }
    //For debug
    console.log(mapData);
    console.log(topo);
    console.log('test');
    //Chi: drawing the map
    svgMap.append("g")
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
      .attr("d", path)
      .on('mouseover', function (d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
    
        tooltip.html(
          '<div>' + d.properties.name + '</div>' +
          '<div>' + ((mapData.get(d.properties.name)) ? '$' + mapData.get(d.properties.name) : 'no data') + '</div>'
        )
          .style('left', (d3.event.pageX + 10) + 'px')
          .style('top', (d3.event.pageY - 30) + 'px')
      })
      .on('mouseout', function () {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  };

  initialGraph(selectedPpp, selectedYear, selectedShortCommodities);

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

  // Register event listeners on the radio buttons, dropdown menu, and checkboxes to redraw the graph when the selection has changes
  exchangeMenu.on('change', function () {
    let sExchange = d3.select("input[name='cm-exchangeGroup']:checked");
    selectedPpp = (sExchange.attr('id') === 'cm-pppRadio');

    //svgMap.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodities);
  });

  yearMenu.on('change', function () {
    // Find which year was selected from the dropdown
    selectedYear = d3.select(this)
      .select("select")
      .property("value");

    updateSelections();
    //svgMap.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodities);
  });
  
  yearSlider.on('input', function () {
    // Find which year was selected from the dropdown
    selectedYear = d3.select(this)
      .property("value");
    
    updateSelections();
    //svgMap.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodities);
  });

  shortCommoditiesList.on('change', function () {
    selectedShortCommodities = [];

    let sCommodities = d3.selectAll("input.cm-checkboxCommodity:checked");
    sCommodities.each((commodity) => selectedShortCommodities.push(commodity));

    updateSelections();
    //svgMap.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedShortCommodities);
  });
};
