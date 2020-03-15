import React, { memo, useEffect, useState } from "react";

import CanvasJSReact from './lib/canvasjs.react';
import "./lib/jquery-jvectormap.css"
const {getName } = require("country-list");

//var CanvasJSReact = require('./canvasjs.react');
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

export const Chart = ({ data, selected }) => {
    if(!data || !data.dates)
        return null;
    const buildData = (selectedCountry) => {
        if(!data.countries[selectedCountry])
            return null;
        const result = data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.countries[selectedCountry][i]) }));
        return result;
    }

    let graph = {};
    let counter = 0;
    
    if (!selected || !Object.keys(selected) || !Object.keys(selected).find(x => selected[x])) {        
        graph=[{
            type: "line",
            dataPoints: data.dates.map((date, i) => ({ x: new Date(date), y: Number(data.world[i]) }))
        }]
    }
    else {
        counter = Object.keys(selected).filter(x => selected[x]).length;

        graph = Object.keys(selected).filter(x => selected[x]).map(selectedCountry => ({
            type: "line",
            dataPoints: buildData(selectedCountry)
        }))
    }

    const options = {
        title: {
            text: counter ? `${Object.keys(selected).filter(x => selected[x]).map(x => getName(x)).join(", ")}` : "World"
        },
        data: graph
     }



    return (
        <CanvasJSChart options={options}
        /* onRef = {ref => this.chart = ref} */
        />
    );
}