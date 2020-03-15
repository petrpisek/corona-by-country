import React, { useState, useEffect } from "react";
import { VectorMap } from "react-jvectormap";

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


const Map = ({ data, onSelect }) => {

    const [totalData, setTotalData] = useState([]);

    const handleClick = (e, countryCode) => {
        onSelect(countryCode);
        console.log(e)
    };

    const handleSelect = (e, code, isSelected, selectedRegions) => {
        onSelect(selectedRegions);
        console.log(e)
    };

    useEffect(() => {
        data && data.totalData && setTotalData(data.totalData);
    }, [data]);

    return (
        <div>
            <VectorMap
                map={"world_mill"}
                backgroundColor="transparent" //change it to ocean blue: #0077be
                zoomOnScroll={true}
                containerStyle={{
                    width: "100%",
                    height: "520px"
                }}
                onRegionSelected={handleSelect} //gets the country code            
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
                            values: totalData, //this is your data
                            scale: ["#146804", "#ff0000"], //your color game's here
                            normalizeFunction: "polynomial"
                        }
                    ]
                }}
            />
        </div>
    );
}; export default Map;