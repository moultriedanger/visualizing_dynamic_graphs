import us from './states-albers-10m (1).json' assert { type: "json" };
import data from './us_large_airports (1).json' assert {type: 'json'};
import routes from './merged_small.json' assert {type: 'json'};

const flightsFile = "merged_small.csv";

//console.log(routes)

const width = 975;
const height = 610;

const projection = d3.geoAlbersUsa().scale(1300).translate([width/2, height/2]);

const path = d3.geoPath();
const svg = d3
    .create('svg')
    .attr('height', height)
    .attr('width', width);

//console.log();

const statesBackground = svg
    .append('path')
    .attr('fill', '#ddd')
    .attr('d', path(topojson.feature(us, us.objects.nation)));

const statesBorders = svg
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', '#fff')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

const largeAirports = svg
    .selectAll('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'middle')
    .data(data)
    .join('g');

const group = largeAirports.append('g')
    .attr('transform', ({longitude_deg, latitude_deg})=> `translate(${projection([longitude_deg, latitude_deg]).join(",")})`)

group.append('circle')
    .attr('r', 3)
    .attr('fill', 'red')

d3.csv(flightsFile, on_reading_data);

let flight_info = null;

function on_reading_data(datas){
    flight_info = datas

    // console.log(flight_info)

    // for(let i = 0; i< flight_info.length; i++ ){
        // console.log(i)
        let x1 = flight_info['origin_longitude']
        let y1 = (flight_info['origin_latitude'])
        let x2 = flight_info['destination_longitude']
        let y2 = (flight_info['destination_latitude'])
        // console.log(x1,y1,x2,y2)

        let new_origin = projection([x1, y1]);
        let new_dest = projection([x2, y2]);
        //console.log(translate(new_origin));
        console.log(new_dest);

        svg.append('line')
            .attr('x1', new_origin[0])  
            .attr('y1', new_origin[1])
            .attr('x2', new_dest[0])
            .attr('y2', new_dest[1])
            .style("stroke-width", 20)

}
    

document.body.appendChild(svg.node())