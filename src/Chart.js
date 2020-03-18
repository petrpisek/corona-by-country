import React, { memo, useEffect, useState } from "react";
import { format } from "date-fns/format"
import CanvasJSReact from './lib/canvasjs.react';
import "./lib/jquery-jvectormap.css"

const { getName } = require("country-list");

//var CanvasJSReact = require('./canvasjs.react');
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

function expCurveFit(d) {
    var sum_x2 = 0, sum_lny = 0, sum_x = 0, sum_xlny = 0, n = d.length;
    for (var i = 0; i < d.length; i++) {
        var x = i;
        var y = d[i].y;
        sum_x2 += x * x;
        sum_lny += Math.log(y);
        sum_x += x;
        sum_xlny += x * Math.log(y);
    }
    var a = ((sum_lny * sum_x2) - (sum_x * sum_xlny)) / ((n * sum_x2) - sum_x * sum_x);
    var b = ((n * sum_xlny) - (sum_x * sum_lny)) / ((n * sum_x2) - sum_x * sum_x);
    return Math.exp(b);
}

export const Chart = ({ data, selected }) => {

    const [height, setHeight] = useState(400);

    React.useEffect(() => {
        function handleResize() {
            setHeight(Math.min(400, window.innerHeight / 2));
        }

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    if (!data || !data.dates)
        return null;
    
    const buildData = (selectedCountry) => {
        if (!data.countries[selectedCountry])
            return null;

        const nonZeroI = data.countries[selectedCountry].lastIndexOf(0) + 1;

        const result = data.dates.slice(nonZeroI).map((date, i) => ({ x: new Date(date), y: Number(data.countries[selectedCountry][i + nonZeroI]) }));
        return result;
    }

    let graph = {};
    let counter = 0;
    let curves = {};
    if (!selected || !selected.length) {
        graph = [{
            type: "line",
            dataPoints: data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.world[i]) }))
        },
        {
            type: "line",
            dataPoints: data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.worldWithoutChina[i]) }))
        }]
    }
    else {
        counter = selected.length;

        graph = selected.map(selectedCountry => ({
            type: "line",
            dataPoints: buildData(selectedCountry),
            country: selectedCountry,
        }))

        graph.forEach(x => curves[x.country] = x.dataPoints && x.dataPoints.length ? expCurveFit(x.dataPoints.slice(Math.max(x.dataPoints.length - 10, 0))) : 0);
    }

    const options = {
        title: {
            text: counter ? `${selected.map(x => `${getName(x)} - b=${curves[x].toFixed(2)}`).join(", ")}` : "World (with and without China)"
        },
        data: graph,
        zoomEnabled: true,
        responsive: true,
        height: height
    }



    return (
        <CanvasJSChart options={options}
        /* onRef = {ref => this.chart = ref} */
        />
    );
}