let multiSetBarChart = function (flatData, yearsSet, countriesSet, shortCommoditiesSet) {

  let margin = {top: 20, right: 160, bottom: 30, left: 30},
    width = document.getElementsByClassName('container')[0].clientWidth - margin.left - margin.right,
    height = width / 2 - margin.top - margin.bottom;

  let svgBar = d3.select('.msbc-chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  let tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);


  let x0 = d3.scaleBand() // X-axis for country names
    .rangeRound([0, width])
    .paddingInner(0.1);

  let x1 = d3.scaleBand() // X-axis for commodities
    .padding(0.05);

  let y = d3.scaleLinear() // Y-axis for prices
    .rangeRound([height, 0]);

  let z = d3.scaleOrdinal() // Colors for the bars
  //  .range(["#ffc107", "#f44336", "#00bcd4", "#e91e63", "#ff9800", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "##009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ff5722", "#795548", "#607d8b"]);
    .range(['#4db6ac', '#ba68c8', '#d32f2f', '#009688', '#9c27b0', '#b71c1c', '#b2dfdb', '#e1bee7', '#f44336']);
  //  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  // Selected values for the chart; values get initialized to fill the chart
  let selectedPpp = true;
  let selectedYear = '2015';
  let selectedCountries = ['Armenia', 'Ethiopia', 'Pakistan', 'Rwanda', 'Turkey'];
  let selectedShortCommodities = ['Wheat flour', 'Rice', 'Milk', 'Sugar'];

  let exchangeMenu = d3.selectAll("input[name='msbc-exchangeGroup']");  // Radio buttons for selecting the exchange rate
  let yearMenu = d3.select('#msbc-yearDropdown');                      // Dropdown for selecting the year
  let countriesList = d3.select('#msbc-countriesList');                // List of checkboxes for selecting the countries
  let shortCommoditiesList = d3.select('#msbc-commoditiesList');       // List of checkboxes for selecting the commodities

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

  // Checkbox list for country selection
  countriesList
    .selectAll('input')
    .data(countriesSet)
    .enter()
    .append('label')
    .attr('for', (country) => country)
    .attr('class', 'col s3')
    .append('input')
    .attr('type', 'checkbox')
    .attr('class', 'msbc-checkboxCountry')
    .attr('name', (country) => country)
    .attr('id', (country) => country)
    .attr('value', (country) => country);
  countriesList
    .selectAll('label')
    .append('span')
    .text((country) =>
      country
      + ' ('
      + getCountryItemsCountDependingOnYear(flatData, selectedYear, country)
      + ' | '
      + getCountryItemsCountDependingOnYearAndShortCommodities(flatData, selectedYear, selectedShortCommodities, country)
      + ')');
  countriesList
    .selectAll('input')
    .filter((country) => selectedCountries.indexOf(country) > -1)
    .attr('checked', true);

  // Checkbox list for commodity selection
  shortCommoditiesList
    .selectAll('input')
    .data(shortCommoditiesSet)
    .enter()
    .append('label')
    .attr('for', (commodity) => 'msbc-' + commodity)
    .attr('class', 'col s3')
    .append('input')
    .attr('type', 'checkbox')
    .attr('class', 'msbc-checkboxCommodity')
    .attr('name', (commodity) => 'msbc-' + commodity)
    .attr('id', (commodity) => 'msbc-' + commodity)
    .attr('value', (commodity) => 'msbc-' + commodity);
  shortCommoditiesList
    .selectAll('label')
    .append('span')
    .text((commodity) =>
      commodity
      + ' ('
      + getShortCommodityItemsCountDependingOnYear(flatData, selectedYear, commodity)
      + ' | '
      + getShortCommodityItemsCountDependingOnYearAndCountries(flatData, selectedYear, selectedCountries, commodity)
      + ')'
    );
  shortCommoditiesList
    .selectAll('input')
    .filter((commodity) => selectedShortCommodities.indexOf(commodity) > -1)
    .attr('checked', true);

  // Function to create the initial graph
  let initialGraph = function (exchange, year, countries, shortCommodities) {

    // Filter the data according to the chosen values
    let selectedData = flatData.filter(
      (d) => +d.year === +year && countries.indexOf(d.country) > -1 && shortCommodities.indexOf(d.shortCommodity) > -1
    );

    console.log(selectedData);

    x0.domain(countries);
    x1.domain(shortCommodities).rangeRound([0, x0.bandwidth()]);

    // Calculate the price maximum for upper limit on the y-axis
    let maxPrice = d3.max(selectedData, (d) => (exchange) ? d.meanDollarPpp : d.meanDollarEr);
    y.domain([0, maxPrice]);

    // Initialize graph
    let prices = svgBar.selectAll(".price")
      .data(selectedData)
      .enter().append("g")
      .attr("class", "price")
      .attr("transform", (d) => "translate(" + x0(d.country) + ",0)");

    // Map the data to fill the correct bars
    let bars = prices
      .selectAll(".rect")
      .data((d) => shortCommodities.map((key) => {
        let meanDollar = (exchange) ? d.meanDollarPpp : d.meanDollarEr;
        return {
          key: key,
          value: (key === d.shortCommodity) ? meanDollar : 0,
          unit: d.unit,
          currency: d.currency,
          meanOriginal: d.meanOriginal,
          unitOriginal: d.unitOriginal
        };
      }))
      .enter().append("rect");

    bars
      .attr("x", (d) => x1(d.key))
      .attr("y", (d) => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => z(d.key))
      .on('mouseover', function (d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);

        tooltip.html(
          '<div>' + d.key + '</div>' +
          '<div>mean: $' + d.value + ' / ' + d.unit + '</div>' +
          '<div>original mean: ' + d.currency + ' ' + d.meanOriginal + ' / ' + d.unitOriginal + '</div>'
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

    // Create the x-axis
    svgBar.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x0))
      .attr("font-size", 14)
    ;

    // Create y-axis
    svgBar.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
      .attr("font-size", 14)
      .append("text")
      .attr("x", 5)
      .attr("y", y(y.ticks().pop()) - 10)
      .attr("dy", "0.32em")
      .attr("text-anchor", "start")
      .attr("font-size", 14)
      .text(" Price in USD");

    let legend = svgBar.append("g")
      .attr("font-size", 14)
      .attr("text-anchor", "end")
      .selectAll(".legend")
      .data(shortCommodities.slice().reverse())
      .enter().append("g")
      .attr("transform", (d, i) => "translate(95," + i * 20 + ")")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text((d) => d);
  };

  initialGraph(selectedPpp, selectedYear, selectedCountries, selectedShortCommodities);

  let updateSelections = function () {
    countriesList
      .selectAll('span')
      .text((country) =>
        country
        + ' ('
        + getCountryItemsCountDependingOnYear(flatData, selectedYear, country)
        + ' | '
        + getCountryItemsCountDependingOnYearAndShortCommodities(flatData, selectedYear, selectedShortCommodities, country)
        + ')');

    shortCommoditiesList
      .selectAll('span')
      .text((commodity) =>
        commodity
        + ' ('
        + getShortCommodityItemsCountDependingOnYear(flatData, selectedYear, commodity)
        + ' | '
        + getShortCommodityItemsCountDependingOnYearAndCountries(flatData, selectedYear, selectedCountries, commodity)
        + ')'
      );
  };

  // Register event listeners on the radio buttons, dropdown menu, and checkboxes to redraw the graph when the selection has changes
  exchangeMenu.on('change', function () {
    let sExchange = d3.select("input[name='msbc-exchangeGroup']:checked");
    selectedPpp = (sExchange.attr('id') === 'msbc-pppRadio');

    svgBar.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedCountries, selectedShortCommodities);
  });

  yearMenu.on('change', function () {
    // Find which year was selected from the dropdown
    selectedYear = d3.select(this)
      .select("select")
      .property("value");

    updateSelections();
    svgBar.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedCountries, selectedShortCommodities);
  });

  countriesList.on('change', function () {
    selectedCountries = [];

    let sCountries = d3.selectAll("input.msbc-checkboxCountry:checked");
    sCountries.each((country) => selectedCountries.push(country));

    updateSelections();
    svgBar.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedCountries, selectedShortCommodities);
  });

  shortCommoditiesList.on('change', function () {
    selectedShortCommodities = [];

    let sCommodities = d3.selectAll("input.msbc-checkboxCommodity:checked");
    sCommodities.each((commodity) => selectedShortCommodities.push(commodity));

    updateSelections();
    svgBar.selectAll('*').remove();
    initialGraph(selectedPpp, selectedYear, selectedCountries, selectedShortCommodities);
  });

};