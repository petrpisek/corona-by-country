import React, { memo, useEffect, useState } from "react";
import Map from "./Map"
import { Chart } from "./Chart";
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

    useEffect(async () => {
        async function f() {
            const d = await fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv")
                .then(res => res.text())
                .then(res => res.split("\n").map(x => CSVtoArray(x)));

            //setData(d);

            let  dates=[];
            overwrite([
                { code: 'BN', name: 'Brunei' },
                { "code": "IR", "name": "Iran" },
                { "code": "KP", "name": "Korea, South" },
                { "code": "VN", "name": "Vietnam" },
                { "code": "RU", "name": "Russia" },
                { "code": "MD", "name": "Moldova" },
                { "code": "BO", "name": "Bolivia" },
                { "code": "GB", "name": "United Kingdom" },
                { "code": "CG", "name": "Congo (Kinshasa)" },
                { "code": "TW", "name": "Taiwan*" },
            ]);

            const countryData = {};
            const countries = {};
            let world = null;
            let worldWithoutChina = null;
            d.forEach((element, i) => {
                if (!element)
                    return;

                if (i === 0) {
                    dates = element.slice(4);
                    return;;
                }

                var code = element[1].length === 2 ? element[1] : getCode(element[1]);

                if (!code)
                    return;

                countryData[code] = (countryData[code] || 0) + Number(element[element.length - 1]);

                var numbers = element.slice(4).map(x => Number(x));
                if(countries[code]) {
                    for(i = 0; i <countries[code].length; i++) {
                        countries[code][i] += Number(numbers[i]);
                    }
                } else {
                    countries[code] = [...numbers];
                }

                if(!world) {
                    world = [...numbers];
                }
                else {
                    for(i = 0; i <world.length; i++) {
                        world[i] += Number(numbers[i]);
                    }
                }

                if(code === "CN") {
                    return;
                }

                if(!worldWithoutChina) {
                    worldWithoutChina = [...numbers];
                }
                else {
                    for(i = 0; i <worldWithoutChina.length; i++) {
                        worldWithoutChina[i] += Number(numbers[i]);
                    }
                }
            });

            Object.keys(countryData).sort().forEach(key => {
                console.log(`${key}: ${countryData[key]}`)
            });

            setData({ dates: dates, totalData: countryData, countries: countries, world: world, worldWithoutChina:worldWithoutChina })
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