import React, { memo, useEffect, useState } from "react";
import { VectorMap } from "react-jvectormap"

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

    const handleClick = (e, countryCode) => {
        console.log(countryCode);
    };

    const mapData = {
        CN: 100000,
        IN: 9900,
        SA: 86,
        EG: 70,
        SE: 0,
        FI: 0,
        FR: 0,
        US: 20
    };

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
        <div>
            <VectorMap
                map={"world_mill"}
                backgroundColor="transparent" //change it to ocean blue: #0077be
                zoomOnScroll={false}
                containerStyle={{
                    width: "100%",
                    height: "520px"
                }}
                onRegionClick={handleClick} //gets the country code
                containerClassName="map"
                regionStyle={{
                    initial: {
                        fill: "#e4e4e4",
                        "fill-opacity": 0.9,
                        stroke: "none",
                        "stroke-width": 0,
                        "stroke-opacity": 0
                    },
                    hover: {
                        "fill-opacity": 0.8,
                        cursor: "pointer"
                    },
                    selected: {
                        fill: "#2938bc" //color for the clicked country
                    },
                    selectedHover: {}
                }}
                regionsSelectable={true}
                series={{
                    regions: [
                        {
                            values: mapData, //this is your data
                            scale: ["#146804", "#ff0000"], //your color game's here
                            normalizeFunction: "polynomial"
                        }
                    ]
                }}
            />
            {/* <div>
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
            </div> */}
        </div>
    );
};

export default memo(MapChart);
