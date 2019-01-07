/*
 * This project visualizes the global food prices database in:
 * - a multi-set bar chart for direct price comparisons of few countries and commodites,
 * - a choropleth map which displays prices for one commodity globally and
 * - a line graph for visualising price development.
 *
 * It was created by Chiwoong Hwang and Stefan Höller for the course Information Visualisation.
 *
 * reading data: http://learnjsdata.com/read_data.html
 * Nesting tutorials:
 * http://learnjsdata.com/group_data.html
 * http://bl.ocks.org/hubgit/raw/9133448/
 * https://bl.ocks.org/ProQuestionAsker/8382f70af7f4a7355827c6dc4ee8817d
 * https://amber.rbind.io/blog/2017/05/02/d3nest/
 *
 * Data sources:
 * Global Food Prices Database: https://data.humdata.org/dataset/4fdcd4dc-5c2f-43af-a1e4-93c9b6539a27
 * Exchange Rates: https://data.worldbank.org/indicator/PA.NUS.FCRF?end=2017&start=1992
 * Purchasing power parity: https://data.worldbank.org/indicator/PA.NUS.PPP
 * Geo data for choropleth map: https://enjalot.github.io/wwsd/data/world/world-110m.geojson
 *
 * Frameworks:
 * D3v4: https://d3js.org/
 * Materialize: https://materializecss.com/
 */

function initMaterializeCSS() {
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Tabs.init(document.querySelector('#msbc-tabs'));
  M.Tabs.init(document.querySelector('#cm-tabs'));
}

window.onload = function () {
  /*
   * Read all data from multiple CSV files;
   * wfpvam_foodprices.csv lists all prices for countries by commodities and years
   * wb_purchasing_power_parity.csv contains the conversion value from every countries currency to USD considering their economies
   * wb_exchange_rates.csv contains the exchange rate from every countries currency to USD
   * rename every attribute to have easy memorable names; also convert them to the right type;
   *
   */
  d3.queue()
    .defer(
      d3.csv,
      'data/wfpvam_foodprices.csv',
      function (data) {
        return {
          country: data.adm0_name,
          province: data.adm1_name,
          city: data.mkt_name,
          commodity: data.cm_name,
          // In the CSV the commodities are stored with qualities in their names,
          // therefore making it difficult to process meaningfully.
          // 'Rice (low quality) - Retail' and 'Rice (high quality) - Retail' become both just 'Rice'
          shortCommodity: data.cm_name.split(/[.:;?!\-~,`"&|()<>{}\[\]\r\n/\\]+/)[0].trim(),
          currency: data.cur_name,
          marketType: data.pt_name,
          unit: data.um_name,
          year: +data.mp_year,
          month: +data.mp_month,
          price: +data.mp_price
        }
      }
    )
    .defer(
      d3.csv,
      'data/wb_purchasing_power_parity.csv'
    )
    .defer(
      d3.csv,
      'data/wb_exchange_rates.csv'
    )
    .defer(d3.json, 'data/world-110m.geojson')
    .await(function (error, fpData, pppData, erData, topo) {
      if (error) throw error;

      // Reassign the columns with space in them to use them later as property for easier access
      pppData.forEach(function (d) {
        d.country = d['Country Name'];
        d.countryCode = d['Country Code'];
        d.indicator = d['Indicator Name'];
        d.indicatorCode = d['Indicator Code'];
      });

      erData.forEach(function (d) {
        d.country = d['Country Name'];
        d.countryCode = d['Country Code'];
        d.indicator = d['Indicator Name'];
        d.indicatorCode = d['Indicator Code'];
      });

      // Nest the data by year, country and commodity to calculate the mean prices,
      // thus ignoring monthly an regional prices
      let nestedData = d3.nest()
        .key((d) => d.year + '.' + d.country + '.' + d.shortCommodity)
        .sortKeys(d3.descending)
        .rollup(function (v) {

          // To calculate a fair mean value it is necessary to convert units like tons,
          // pounds or 3.5 kg to just 1 kg
          let mean = d3.mean(v, (d) => {
            let u = d.unit.split(' ');
            let unit = d.unit;
            let price = d.price;
            if (u.length > 1 && !isNaN(+u[0])) {
              let factor = +u[0];
              unit = u[1];
              price = price / factor;
            }

            if (['mt'].indexOf(unit.toLowerCase()) > -1) {
              price = price * 0.001;
            } else if (['ml', 'g'].indexOf(unit.toLowerCase()) > -1) {
              price = price * 1000;
            } else if (['pounds', 'pound'].indexOf(unit.toLowerCase()) > -1) {
              price = price * 2.2046;
            }
            // dozen, cubic meter, gallon, marmite are not converted yet
            return price;
          });

          let unitParts = v[0].unit.split(' ');
          let unit = '';
          if (unitParts.length > 1 && !isNaN(+unitParts[0])) {
            for (let i = 1; i < unitParts.length; i++) {
              unit += unitParts[i];
              if (i === unitParts.length - 1)
                unit += ' ';
            }
          } else {
            unit = unitParts[0];
          }

          // Get the purchasing power parity value for the country and year
          let ppps = pppData.filter((d) => d.country === v[0].country).map((d) => d[v[0].year]);
          let ppp = (ppps.length && ppps[0] && parseFloat(ppps[0])) ? (parseFloat(ppps[0])) : null;

          // Get the exchange rate for the country and year
          let rates = erData.filter((d) => d.country === v[0].country).map((d) => d[v[0].year]);
          let rate = (rates.length && rates[0] && parseFloat(rates[0])) ? (parseFloat(rates[0])) : null;

          // Build an entry
          return {
            country: v[0].country,
            commodity: v[0].commodity,
            shortCommodity: v[0].shortCommodity,
            currency: v[0].currency,
            marketType: v[0].marketType,
            unitOriginal: v[0].unit,
            unit: unit,
            year: v[0].year,
            count: v.length,
            meanOriginal: +d3.mean(v, (d) => d.price).toFixed(2),
            mean: +mean.toFixed(2),
            purchasingPowerParity: (rate) ? +rate.toFixed(2) : null,
            meanDollarPpp: (ppp) ? +(mean / ppp).toFixed(2) : 0,
            exchangeRate: (rate) ? +rate.toFixed(2) : null,
            meanDollarEr: (rate) ? +(mean / rate).toFixed(2) : 0
          }
        })
        .entries(fpData);

      // Flatten the nested data for easier processing
      let flatData = nestedData.map((d) => d.value);
      console.log(flatData);

      let unitsSet = [...(new Set(flatData.map(({unit}) => unit)))].sort();

      // Get every year contained in the CSV to fill the dropdown
      let yearsSet = [...(new Set(flatData.map(({year}) => year)))].sort();

      // Get every country contained in the CSV to fill the checklist
      let countriesSet = [...(new Set(flatData.map(({country}) => country)))].sort();

      // Get every commodity contained in the CSV to fill the checklist
      let shortCommoditiesSet = [...(new Set(flatData.map(({shortCommodity}) => shortCommodity)))].sort();

      multiSetBarChart(flatData, yearsSet, countriesSet, shortCommoditiesSet);

      choroplethMap(flatData, topo, yearsSet, countriesSet, shortCommoditiesSet);

      initMaterializeCSS();
    });
};