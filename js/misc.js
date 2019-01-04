/*
 * Miscellaneous functions used by multiple graphs
 */

function getYearItemsCount(flatData, year) {
  return flatData.filter((d) => +d.year === +year).length;
}

function getCountryItemsCountDependingOnYear(flatData, year, country) {
  return flatData.filter((d) => +d.year === +year && d.country === country && d.purchasingPowerParity).length;
}

function getCountryItemsCountDependingOnYearAndShortCommodities(flatData, year, shortCommodities, country) {
  return flatData.filter((d) => +d.year === +year && shortCommodities.indexOf(d.shortCommodity) > -1 && d.country === country && d.purchasingPowerParity).length;
}

function getShortCommodityItemsCountDependingOnYear(flatData, year, shortCommodity) {
  return flatData.filter((d) => +d.year === +year && d.shortCommodity === shortCommodity && d.purchasingPowerParity).length;
}

function getShortCommodityItemsCountDependingOnYearAndCountries(flatData, year, countries, shortCommodity) {
  return flatData.filter((d) => +d.year === +year && countries.indexOf(d.country) > -1 && d.shortCommodity === shortCommodity && d.purchasingPowerParity).length;
}