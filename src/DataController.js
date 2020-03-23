import React, { memo, useEffect, useState } from "react";
import Map from "./Map"
import { Chart } from "./Chart";
import axios from 'axios';
import format from "date-fns/format"

const { getCode, getName, getData, overwrite } = require("country-list");

overwrite([
    { "code": "KR", "name": "S. Korea" },
    { "code": "US", "name": "USA" },
    { "code": "GB", "name": "UK" },
    { "code": "AE", "name": "UAE" },
    { "code": "TW", "name": "Taiwan" },
    { "code": "FO", "name": "Faeroe Islands" },
    { "code": "PS", "name": "Palestine" },
    { "code": "VE", "name": "Venezuela" },
    { "code": "CI", "name": "Ivory Coast" },
    { "code": "CG", "name": "DRC" },
    { "code": "BL", "name": "St. Barth" },
    { "code": "MF", "name": "Saint Martin" },
    { "code": "VI", "name": "U.S. Virgin Islands" },
    { "code": "CF", "name": "CAR" },
    { "code": "VA", "name": "Vatican City" },
    { "code": "VC", "name": "St. Vincent Grenadines" },
    { "code": "TZ", "name": "Tanzania" },

    { "code": 'BN', "name": 'Brunei' },
    { "code": "IR", "name": "Iran" },
    { "code": "KR", "name": "Korea, South" },
    { "code": "VN", "name": "Vietnam" },
    { "code": "RU", "name": "Russia" },
    { "code": "MD", "name": "Moldova" },
    { "code": "BO", "name": "Bolivia" },
    { "code": "GB", "name": "United Kingdom" },
    { "code": "CG", "name": "Congo (Kinshasa)" },
    { "code": "TW", "name": "Taiwan*" },
]);

export const DataController = (props) => {

    const [data, setData] = useState(null);
    const [deathsData, setDeathsData] = useState(null);
    const [activeData, setActiveData] = useState(null);

    const [selected, setSelected] = useState([]);
    const [graphType, setGraphType] = useState("total");
    const [predictionPeriod, setPredictionPeriod] = useState(7);

    function CSVtoArray(text) {
        var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
        // Return NULL if input string is not well formed CSV string.
        if (!re_valid.test(text)) return null;
        var a = [];                     // Initialize array to receive values.
        text.replace(re_value, // "Walk" the string using replace with callback.
            function (m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });
        // Handle special case of empty last value.
        if (/,\s*$/.test(text)) a.push('');
        return a;
    };

    const parseWorldometersData = (data, dataType) => {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, 'text/html');
        var tableBody = htmlDoc.getElementById("main_table_countries_today").getElementsByTagName("tbody")[0];
        var rows = tableBody.getElementsByTagName("tr");
        var result = {};

        Array.from(rows).forEach(row => {
            const cells = row.cells;
            const country = cells[0].innerText.trim();
            const cases = Number(cells[dataType === "total" ? 1 : dataType === "active" ? 6 : 3].innerText.replace(",", ""));

            var code = getCode(country);
            if (code) {
                result[code] = cases;
            } else {
                //console.log(`\{"code" : "AA", "name": "${country}"\},`)
            }
        })

        return result;
    }

    const loadData = async dataType => {
        const historicalData = fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv")
            .then(res => res.text())
            .then(res => res.split("\n").map(x => CSVtoArray(x)))
            .catch(error => console.log('error', error));;

        const deathsData = fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv")
            .then(res => res.text())
            .then(res => res.split("\n").map(x => CSVtoArray(x)))
            .catch(error => console.log('error', error));;

        const recoveredData = fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv")
            .then(res => res.text())
            .then(res => res.split("\n").map(x => CSVtoArray(x)))
            .catch(error => console.log('error', error));;

        const worldometersData = axios.get("https://cors-anywhere.herokuapp.com/https://www.worldometers.info/coronavirus")
            .then(response => parseWorldometersData(response.data, dataType), error => console.log('error', error))
            .catch(error => console.log('error', error));

        //.then(res => res.text())
        //.then(res => parseWorldometersData(res))
        //setData(d);            

        const d = dataType === "total" ? await historicalData : await deathsData;
        var allCases, recoveredCases;
        if (dataType === "active") {
            allCases = await historicalData;
            recoveredCases = await recoveredData;
        }

        const currentData = await worldometersData;

        let dates = [];

        const countryData = {};
        const countries = {};
        let world = null;
        let worldWithoutChina = null;
        d.forEach((element, i) => {
            if (!element)
                return;

            if (i === 0) {
                dates = element.slice(4);
                if (currentData && new Date(dates[dates.length - 1]).getDate() != new Date().getDate())
                    dates.push(format(new Date(), "M/d/yy"));
                return;;
            }

            var code = element[1].length === 2 ? element[1] : getCode(element[1]);

            if (!code) {
                console.log(`Code not found for ${element[1]}`);
                return;
            }

            countryData[code] = (countryData[code] || 0) + dataType === "active"
                ? Number(allCases[i][element.length - 1]) - Number(element[element.length - 1]) - Number(recoveredCases[element.length - 1])
                : Number(element[element.length - 1]);

            var activeElement = dataType === "active" ? allCases[i].slice(4) : {};
            var recoveredElement = dataType === "active" ? recoveredCases[i].slice(4) : {};

            var numbers = element.slice(4).map((x, i) => dataType === "active" ? Number(activeElement[i]) - Number(x) - Number(recoveredElement[i]) : Number(x));

            if (countries[code]) {
                for (i = 0; i < countries[code].length; i++) {
                    countries[code][i] += Number(numbers[i]);
                }
            } else {
                countries[code] = [...numbers];
            }

            if (!world) {
                world = [...numbers];
            }
            else {
                for (i = 0; i < world.length; i++) {
                    world[i] += Number(numbers[i]);
                }
            }

            if (code === "CN") {
                return;
            }

            if (!worldWithoutChina) {
                worldWithoutChina = [...numbers];
            }
            else {
                for (i = 0; i < worldWithoutChina.length; i++) {
                    worldWithoutChina[i] += Number(numbers[i]);
                }
            }
        });

        if (currentData) {
            Object.keys(countries).forEach((code, i) => {
                countryData[code] = currentData[code];
                if (countries[code].length === dates.length) {
                    if (currentData[code])
                        countries[code][countries[code].length - 1] = currentData[code];
                } else {
                    if (currentData[code]) {
                        countries[code].push(currentData[code]);
                    } else {
                        countries[code].push(countries[code][countries[code].length - 1]);
                    }
                }
            });

            var currentTotal = Object.values(currentData).reduce((a, b) => a + b);

            if (world.length === dates.length) {
                world[world.length - 1] = currentTotal;
                worldWithoutChina[worldWithoutChina.length - 1] = currentTotal - currentData["CN"];
            } else {
                world.push(currentTotal);
                worldWithoutChina.push(currentTotal - currentData["CN"]);
            }

        }

        // Object.keys(countryData).sort().forEach(key => {
        //     console.log(`${key}: ${countryData[key]}`)
        // });

        return { dates: dates, totalData: countryData, countries: countries, world: world, worldWithoutChina: worldWithoutChina };
    }

    useEffect(() => {
        loadData("total").then(x => setData(x));
        loadData("deaths").then(x => setDeathsData(x));
        loadData("active").then(x => setActiveData(x));
    }, [])

    const handleSelect = s => {
        // let newSelected = {...selected};
        // newSelected[code] = !selected[code];

        setSelected(s);
    }

    useEffect(() => {
        loadData(graphType);
    }, []);
    const handlePredictionPeriodChange = e => {
        var value = Number(e.target.value);
        setPredictionPeriod(value);
    }

    return (
        <div>
            <div>
                <Map data={data} onSelect={handleSelect} />
            </div>
            <div className="params">
                <label>Graph values:&nbsp;
                <select value={graphType} onChange={e => setGraphType(e.target.value)}>
                        <option value="total">Total cases</option>
                        <option value="deaths">Deaths</option>
                        <option value="active">Active cases</option>
                    </select>
                </label>
                <span>&nbsp;&nbsp;&nbsp;</span>
                <label>Prediction:&nbsp;
                <select value={predictionPeriod} onChange={handlePredictionPeriodChange}>
                        {
                            [...Array(20).keys()].map(x => <option value={x}>{x}</option>)
                        }
                    </select>
                </label>
            </div>
            <div className="chart-container">
                <div className="chart-container2">
                <Chart data={graphType === "total" ? data : graphType === "active" ? activeData : deathsData} selected={selected} graphType={graphType} predictionPeriod={predictionPeriod} />
                </div>
            </div>
            <div className="disclaimer mt2">
                The prediction is only illustrative, to demonstrate the exponential growth of COVID19 disease.
                It can be taken as a good approximation for a few days outlook. For weeks, the error is too large.
                It's based on an exponential function built from last 10 samples. It does not take into account any actions taken to stop spreading,
                population limits, or other real world contraints.
            </div>
            <div className="disclaimer">
                Data sources: <a target="_blank" href="https://github.com/CSSEGISandData/2019-nCoV">GitHub</a>, <a target="_blank" href="https://www.worldometers.info/coronavirus/">https://www.worldometers.info/coronavirus/</a>
            </div>
            <div className="disclaimer">
                Changes<br/>
                2020-03-21: Historical growth factor (base of the exponential function) graph added<br/>
                2020-03-22: Prediction range added - b±0.02
            </div>
            <div className="disclaimer">
                Contact: <a href="mailto:pisek.petr@gmail.com">pisek.petr@gmail.com</a>
            </div>
        </div>
    )
}