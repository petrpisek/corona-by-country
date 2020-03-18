import React, { memo, useEffect, useState } from "react";
import Map from "./Map"
import { Chart } from "./Chart";
import axios from 'axios';
import format from "date-fns/format"

const { getCode, getName, getData, overwrite } = require("country-list");

export const DataController = (props) => {

    const [data, setData] = useState(null);
    const [selected, setSelected] = useState([]);

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

    const parseWorldometersData = data => {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, 'text/html');
        var tableBody = htmlDoc.getElementById("main_table_countries_today").getElementsByTagName("tbody")[0];
        var rows = tableBody.getElementsByTagName("tr");
        var result = {};

        Array.from(rows).forEach(row => {
            const cells = row.cells;
            const country = cells[0].innerText.trim();
            const cases = Number(cells[1].innerText.replace(",", ""));

            var code = getCode(country);
            if (code) {
                result[code] = cases;
            } else {
                //console.log(`\{"code" : "AA", "name": "${country}"\},`)
            }
        })

        return result;
    }

    useEffect(async () => {
        async function f() {
            const historicalData = fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv")
                .then(res => res.text())
                .then(res => res.split("\n").map(x => CSVtoArray(x)))
                .catch(error => console.log('error', error));;

            const worldometersData = axios.get("https://cors-anywhere.herokuapp.com/https://www.worldometers.info/coronavirus")
                .then(response => parseWorldometersData(response.data), error => console.log('error', error))
                .catch(error => console.log('error', error));

            //.then(res => res.text())
            //.then(res => parseWorldometersData(res))
            //setData(d);

            overwrite([
                { "code": "KR", "name": "S. Korea" },
                {"code" : "US", "name": "USA"},
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

            const d = await historicalData;
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

                countryData[code] = (countryData[code] || 0) + Number(element[element.length - 1]);

                var numbers = element.slice(4).map(x => Number(x));

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

                var currentTotal = Object.values(currentData).reduce((a, b) => a+b);                

                if (world.length === dates.length) {
                    world[world.length -1] = currentTotal;
                    worldWithoutChina[worldWithoutChina.length -1] = currentTotal - currentData["CN"];
                } else {
                    world.push(currentTotal);
                    worldWithoutChina.push(currentTotal - currentData["CN"]);
                }
                
            }

            // Object.keys(countryData).sort().forEach(key => {
            //     console.log(`${key}: ${countryData[key]}`)
            // });

            setData({ dates: dates, totalData: countryData, countries: countries, world: world, worldWithoutChina: worldWithoutChina })
        }
        f();
    }, [])

    const handleSelect = s => {
        // let newSelected = {...selected};
        // newSelected[code] = !selected[code];

        setSelected(s);
    }
    return (
        <div>
            <div>
                <Map data={data} onSelect={handleSelect} />

            </div>
            <div>
                <Chart data={data} selected={selected} />
            </div>
        </div>
    )
}