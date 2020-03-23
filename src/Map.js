import React, { useState, useEffect } from "react";
import { VectorMap } from "react-jvectormap";

const Map = ({ data, onSelect }) => {

    const [totalData, setTotalData] = useState([]);

    const handleClick = (e, countryCode) => {
        onSelect(countryCode);

    };

    const handleSelect = (e, code, isSelected, selectedRegions) => {
        onSelect(selectedRegions);

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
                zoomMax={100}
                containerClassName="map"
                containerStyle={{
                    
                    height: "520px",
                    
                }}
                onRegionSelected={handleSelect} //gets the country code            
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