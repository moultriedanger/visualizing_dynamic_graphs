
const urls = {
  airports: "grid_locs.csv",
  flights:  "flights.csv", 
  walks:    "walks.csv"
};

const svg                 = d3.select("svg");
const width               = parseInt(svg.attr("width"));
const height              = parseInt(svg.attr("height"));
const hypotenuse          = Math.sqrt(width * width + height * height);

// used to scale airport bubbles
const node_size_min       = 1;          // 4
const node_size_max       = 2.5;        // 18

// used to scale number of segments per line
const min_segments_domain = 0;
const max_segments_domain = hypotenuse; 
const min_segments_range  = 3;          // 20
const max_segments_range  = 10;         // 30

// settle at a layout faster
const alpha_decay         = 0.1;

// nearby nodes attract each other
const force_charge_many   = 0;         // 10
const force_distance_max  = 0;              // scales.airports.range()[1] * 2
// edges want to be as short as possible
// prevents too much stretching
const force_link_strength = 1;          // 0.7, 0.001
const force_link_distance = 0;             // 100

const scales = {
  // used to scale airport bubbles
  // airports: d3.scaleSqrt()
  airports: d3.scalePow().exponent(0.9)
    .range([node_size_min, node_size_max]),
  // used to scale number of segments per line
  segments: d3.scaleLinear()
    .domain([min_segments_domain, max_segments_domain])
    .range( [min_segments_range,  max_segments_range]) 
  
};

const stroke_width   = function(d, i){ return 5;    };  //flights[i].count**(-0.5/10**10) ;
const stroke_opacity = function(d, i){ return 0.1; };
const node_radius    = function(d, i){ return scales.airports(d.outgoing/100000)}

// have these already created for easier drawing
const g = {
  flights:  svg.select("g#flights"),
  airports: svg.select("g#airports") 
};
// load the airport and flight data together
const promises = [
  d3.csv(urls.airports, typeAirport),
  d3.csv(urls.flights,  typeFlight),
  d3.csv(urls.walks,    typeWalk),
];
Promise.all(promises).then(processData);

function distance(source, target) {
  const dx2 = Math.pow(target.x - source.x, 2);
  const dy2 = Math.pow(target.y - source.y, 2);
  return Math.sqrt(dx2 + dy2);
}

// see airports.csv
function typeAirport(airport) {
  airport.y = parseFloat(airport.longitude);
  airport.x = parseFloat(airport.latitude);
  airport.outgoing = 0;  // eventually tracks number of outgoing flights
  airport.incoming = 0;  // eventually tracks number of incoming flights
  airport.flights = [];  // eventually tracks outgoing flights
  return airport;
}

// see flights.csv
// convert count to number
function typeFlight(flight) {
  flight.count = parseInt(flight.count);
  return flight;
}

function typeWalk(walk){
    walk.length = 0
    for(var i = 0; i < 12; i++){
        if(walk[i] != ""){
            walk.length += 1;
        }
    }
    // walk.length = length;
    return walk;
}

// process airport and flight data
function processData(values) {

  let airports = values[0];
  let flights  = values[1];
  let walks    = values[2];

  // convert airports array (pre filter) into map for fast lookup
  let iata = new Map(airports.map(node => [node.iata, node]));

  // calculate incoming and outgoing degree based on flights
  // flights are given by airport iata code (not index)
  flights.forEach(function(link) {
    
    link.source = iata.get(link.origin);
    link.target = iata.get(link.destination);

    link.source.outgoing += link.count;
    link.target.incoming += link.count;
  });

  drawAirports(airports);
  drawWalks(airports, flights, walks, iata);
}   

function drawAirports(airports) {

  // draw airport bubbles
  g.airports.selectAll("circle.airport")
    .data(airports, d => d.iata)
    .enter()
    .append("circle")
    .attr("r", node_radius)
    .attr("cx", d => d.x) // calculated on load
    .attr("cy", d => d.y) // calculated on load
    .attr("class", "airport")
    .style("fill", function(d) { return d.color; })
    .each(function(d) {
      // adds the circle object to our airport
      // makes it fast to select airports on hover
      d.bubble = this;
    })
    .on("mouseover", function(d) {
      d.flights.forEach(x => { x.style['stroke-opacity'] = 1; });
    })
    .on("mouseout", function(d) {
      d.flights.forEach(x => {  x.style['stroke-opacity'] = stroke_opacity(x); });
    })
}

function drawWalks(airports, flights, walks, iata) {

    let bundle = {nodes: [], links: [], paths: []};
    
    bundle.nodes = airports.map(function(d, i) {
        if (d.iata.split("_")[1] == "1" || 
            d.iata.split("_")[1] == "12"){
          // if (d.iata.split("_")[1] == "1" || d.iata.split("_")[1] == "13"){
          d.fx = d.x;
          d.fy = d.y;
        }
        else{
          d.x = d.x;
          d.y = d.y;  
        }
        return d;
    });

    bundle.links = flights.map(function(d, i) {
        return {
            'source': d.source, // iata.get(d.origin),
            'target': d.target // iata.get(d.destination)
        };
    });

    bundle.paths = walks.map(function(d, i) {
        new_walk = [];
        for(let i = 0; i < d.length; i++) {
            new_walk.push(iata.get(d[i]));
        }
        return new_walk;
    });

    console.log(bundle);

    // https://github.com/d3/d3-shape#curveBundle
    let line = d3.line()
        .curve(d3.curveBundle)
        .x(airport => airport.x)
        .y(airport => airport.y);

    let links = g.flights.selectAll("path.flight")
        .data(bundle.paths)
        .enter()
        .append("path")
        .attr("d", line)
        .attr("class", "flight")
        .style("stroke", function(d) { 
            if (d[0].cluster == d[d.length-1].cluster) {
                return d[0].color; 
            } else { 
                return "black"; 
            }
        })
        .style("stroke-width", stroke_width)
        .style("stroke-opacity", stroke_opacity)
        .each(function(d, i) {
            // adds the path object to our source airport
            // makes it fast to select outgoing paths
            // d[0].flights.push(this);
            // console.log(d[i]);
            d[0].flights.push(this);
        })
        .on("mouseover", function(d) { this.style['stroke-opacity'] = 1;   })
        .on("mouseout", function(d)  { this.style['stroke-opacity'] = stroke_opacity(d); });

    // https://github.com/d3/d3-force
    let layout = d3.forceSimulation()
        // settle at a layout faster
        .alphaDecay(alpha_decay)
        // nearby nodes attract each other
        .force("charge", d3.forceManyBody()
            .strength(force_charge_many)
            .distanceMax(force_distance_max)
        )
        // edges want to be as short as possible
        // prevents too much stretching
        .force("link", d3.forceLink()
            .strength(force_link_strength)
            .distance(force_link_distance)
        )
        .on("tick", function(d) { links.attr("d", line); })
        .on("end", function(d)  { console.log("layout complete"); });

    layout.nodes(bundle.nodes).force("link").links(bundle.links);

    console.log(bundle);

    // bundle.paths.forEach(function(d, i) {
    //   let last = d[d.length-1];
    //   console.log("last");
    //   last.fx = last.x;
    //   last.fy = last.y;
    // });
}
