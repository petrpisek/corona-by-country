import React, { memo, useEffect, useState } from "react";
import { format } from "date-fns/format"
import CanvasJSReact from './lib/canvasjs.react';
import "./lib/jquery-jvectormap.css"

const { getName } = require("country-list");

//var CanvasJSReact = require('./canvasjs.react');
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

const Colors = [
    "#000000",
    "#0000ff",
    "#a52a2a",
    "#00ffff",
    "#00008b",
    "#008b8b",
    "#a9a9a9",
    "#006400",
    "#bdb76b",
    "#8b008b",
    "#556b2f",
    "#ff8c00",
    "#9932cc",
    "#8b0000",
    "#e9967a",
    "#9400d3"
];


Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function expCurveFit(d) {
    var sum_x2 = 0, sum_lny = 0, sum_x = 0, sum_xlny = 0, n = d.length;
    for (var i = 0; i < d.length; i++) {
        var x = i + 1;
        var y = d[i].y;
        sum_x2 += x * x;
        sum_lny += Math.log(y);
        sum_x += x;
        sum_xlny += x * Math.log(y);
    }
    var a = ((sum_lny * sum_x2) - (sum_x * sum_xlny)) / ((n * sum_x2) - sum_x * sum_x);
    var b = ((n * sum_xlny) - (sum_x * sum_lny)) / ((n * sum_x2) - sum_x * sum_x);
    return { a: Math.exp(a), b: Math.exp(b) };
}

export const Chart = ({ data, selected, predictionPeriod }) => {

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
    const expSamples = 4;
    if (!selected || !selected.length) {
        graph = [{
            type: "line",
            color: Colors[0],
            dataPoints: data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.world[i]) })),
            axisYType: "secondary",
        },
        {
            type: "line",
            color: Colors[1],
            dataPoints: data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.worldWithoutChina[i]) })),
            axisYType: "secondary",
        }]

        var dataPoints = graph[0].dataPoints;

        var regressionPoints = dataPoints.slice(Math.max(dataPoints.length - expSamples, 0));

        var expCurve = expCurveFit(regressionPoints);

        var prediction = [];
        var start = dataPoints.length - 1;
        for (var i = start; i < dataPoints.length + predictionPeriod; i++) {
            prediction.push({ x: dataPoints[0].x.addDays(i), y: Math.round(expCurve.a * Math.pow(expCurve.b, i - start + regressionPoints.length)) });
        }

        if (predictionPeriod)
            graph.push({
                axisYIndex: 1,
                type: "line",
                lineDashType: "dash",
                color: Colors[0]+"A0",
                dataPoints: prediction,
                showInLegend: true,
                legendText: "World with China",
                axisYType: "secondary",
            });

        curves.world = expCurve;

        dataPoints = graph[1].dataPoints;

        regressionPoints = dataPoints.slice(Math.max(dataPoints.length - expSamples, 0));

        expCurve = expCurveFit(regressionPoints);
        curves.worldWithoutChina = expCurve;
        prediction = [];
        start = dataPoints.length - 1;
        for (var i = start; i < dataPoints.length + predictionPeriod; i++) {
            prediction.push({ x: dataPoints[0].x.addDays(i), y: Math.round(expCurve.a * Math.pow(expCurve.b, i - start + regressionPoints.length)) });
        }

        if (predictionPeriod)
            graph.push({
                axisYIndex: 1,
                type: "line",
                lineDashType: "dash",
                color: Colors[1]+"A0",
                dataPoints: prediction,
                showInLegend: true,
                legendText: "World without China",
                axisYType: "secondary",
            });
    }
    else {
        counter = selected.length;

        graph = [];
        curves = {};
        selected.forEach((selectedCountry, countryIndex) => {
            const dataPoints = buildData(selectedCountry);
            if (!dataPoints || !dataPoints.length)
                return;

            const regressionPoints = dataPoints.slice(Math.max(dataPoints.length - expSamples - 1, 0), -1);

            const expCurve = curves[selectedCountry] = dataPoints && dataPoints.length ? expCurveFit(regressionPoints) : { a: 0, b: 0 };
            curves[selectedCountry] = expCurve.b;

            const color = Colors[countryIndex % Colors.length];

            graph.push({
                axisYIndex: 1,
                type: "line",
                color: color,
                showInLegend: true,
                legendText: selectedCountry,
                dataPoints: dataPoints,
                country: selectedCountry,
                axisYType: "secondary",
            });            

            if (predictionPeriod) {
                const prediction = [];
                const predictionLow = [];
                const predictionHigh = [];
                const start = dataPoints.length - 1;
                for (var i = start; i < dataPoints.length + predictionPeriod; i++) {
                    predictionLow.push({ x: dataPoints[0].x.addDays(i), y: Math.round(expCurve.a * Math.pow(expCurve.b+0.02, i - start + regressionPoints.length + 1)) });
                    prediction.push({ x: dataPoints[0].x.addDays(i), y: Math.round(expCurve.a * Math.pow(expCurve.b, i - start + regressionPoints.length + 1)) });
                    predictionHigh.push({ x: dataPoints[0].x.addDays(i), y: Math.round(expCurve.a * Math.pow(expCurve.b-0.02, i - start + regressionPoints.length + 1)) });
                }

                graph.push({
                    axisYIndex: 1,
                    type: "line",
                    lineDashType: "dash",
                    color: color+"A0",
                    dataPoints: prediction,
                    country: selectedCountry,
                    axisYType: "secondary",
                });
                graph.push({
                    axisYIndex: 1,
                    type: "line",
                    lineDashType: "dash",
                    color: color+"50",
                    lineThickness: 1,
                    dataPoints: predictionLow,
                    country: selectedCountry,
                    axisYType: "secondary",
                });
                graph.push({
                    axisYIndex: 1,
                    type: "line",
                    lineDashType: "dash",
                    lineThickness: 1,
                    color: color+"50",
                    dataPoints: predictionHigh,
                    country: selectedCountry,
                    axisYType: "secondary",
                });
            }

            const bData = [...Array(dataPoints.length-expSamples)].map((x, i) => ({x: dataPoints[i+expSamples].x, y: +expCurveFit(dataPoints.slice(i, i+expSamples)).b.toFixed(2)}));
            graph.push({
                type: "line",                
                lineDashType: "shortDot",
                markerType: "none",
                lineThickness: 1,
                color: color,
                dataPoints: bData,
                country: selectedCountry,
                axisYIndex: 0,                
            });
        });
    }

    function nFormatter(num) {
        if (num >= 1000000000) {
           return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        }
        if (num >= 1000000) {
           return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
           return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num;
   }

    const options = {
        title: {
            fontSize: 20,
            text: counter
                ? `${selected.map(x => `${getName(x)}${curves[x] ? " - b=" + curves[x].toFixed(2) + "±0.02" : ""}`).join(", ")}`
                : `World, without China b=${curves.worldWithoutChina.b.toFixed(2)}, with China b=${curves.world.b.toFixed(2)}`
        },
        data: graph,
        zoomEnabled: true,
        responsive: true,
        height: height,
        axisY2:[
            {
                labelFormatter: e => nFormatter(e.value),
                title: "Cases",
                axisYType: "secondary",
            }],
            axisY:[{            
                title: "Growth factor",
                
            }
        ]
    }



    return (
        <CanvasJSChart options={options}
        /* onRef = {ref => this.chart = ref} */
        />
    );
}