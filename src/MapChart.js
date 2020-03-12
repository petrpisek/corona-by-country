import React, { memo, useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { LineChart, XAxis, Tooltip, CartesianGrid, Line } from "recharts";
const geoUrl =
    "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const rounded = num => {
    if (num > 1000000000) {
        return Math.round(num / 100000000) / 10 + "Bn";
    } else if (num > 1000000) {
        return Math.round(num / 100000) / 10 + "M";
    } else {
        return Math.round(num / 100) / 10 + "K";
    }
};

const MapChart = ({ setTooltipContent }) => {
    const [zoom, setZoom] = useState(1);
    const [selected, setSelected] = useState({});
    const [data, setData] = useState(null);

    function handleZoomIn() {
        if (zoom >= 4) return;
        setZoom(zoom * 2);
    }

    function handleZoomOut() {
        if (zoom <= 1) return;
        setZoom(zoom / 2);
    }

    function handleZoomEnd(position) {
        setZoom(position.zoom);
    }

    useEffect(async () => {
        async function f() {
            const d = await fetch("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv")
                .then(res => res.text())
                .then(res => res.split("\n").map(x => x.split(",")));

            setData(d);
        }
        f();
    }, [])

    return (
        <>
            <ComposableMap data-tip="" projectionConfig={{ scale: 200 }} className="map">
                <ZoomableGroup zoom={zoom} onZoomEnd={handleZoomEnd}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onMouseEnter={() => {
                                        const { NAME, POP_EST } = geo.properties;
                                        setTooltipContent(`${NAME} — ${rounded(POP_EST)}`);
                                    }}
                                    onMouseDown={() => {
                                        const s = JSON.parse(JSON.stringify(selected));
                                        if (s[geo.properties.ISO_A3])
                                            delete s[geo.properties.ISO_A3];
                                        else
                                            s[geo.properties.ISO_A3] = geo.properties;
                                        setSelected(s);
                                    }}
                                    onMouseLeave={() => {
                                        setTooltipContent("");
                                    }}
                                    style={{
                                        default: selected[geo.properties.ISO_A3] ? {
                                            fill: "#F30",
                                            outline: "#F00"
                                        } : {
                                                fill: "#000",
                                                outline: "none"
                                            },
                                        hover: {
                                            fill: "#F53",
                                            outline: "none"
                                        },
                                        pressed: {
                                            fill: "#E42",
                                            outline: "none"
                                        }
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <div className="controls">
                <button onClick={handleZoomIn}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button onClick={handleZoomOut}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
            <div>
                {
                    Object.keys(selected).map(x =>
                        <div>
                            <LineChart
                                width={400}
                                height={50}
                                data={data}
                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                            >
                                <XAxis dataKey="name" />
                                <Tooltip />
                                <CartesianGrid stroke="#f5f5f5" />
                                <Line type="monotone" dataKey="uv" stroke="#ff7300" yAxisId={0} />
                                <Line type="monotone" dataKey="pv" stroke="#387908" yAxisId={1} />
                            </LineChart>
                        </div>)
                }
            </div>
        </>
    );
};

export default memo(MapChart);
