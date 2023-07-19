const urls = {
  airports: "grid_locs.csv",
  flights: "flights.csv"
};
const svg        = d3.select("svg");
const width      = parseInt(svg.attr("width"));
const height     = parseInt(svg.attr("height"));
const hypotenuse = Math.sqrt(width * width + height * height);
const HYPERPARAMS = {
  // used to scale airport bubbles
  "AIRPORTS_SCALE_MIN":         1,   // 4
  "AIRPORTS_SCALE_MAX":         2.5, // 18
  // used to scale number of segments per line
  "SEGMENTS_SCALE_DOMAIN_MIN":  0, 
  "SEGMENTS_SCALE_DOMAIN_MAX":  hypotenuse,
  "SEGMENTS_SCALE_RANGE_MIN":   4,  // 20
  "SEGMENTS_SCALE_RANGE_MAX":   6, // 30
  // settle at a layout faster
  "ALPHA_DECAY":                0.1, 
  // nearby nodes attract each other
  "FORCE_CHARGE_MANY_BODY":     0, // 10
  // edges want to be as short as possible
  // prevents too much stretching
  "FORCE_LINK_STRENGTH":        2, // 0.7
  "FORCE_LINK_DISTANCE":        0,
}
const scales = {
  // used to scale airport bubbles
  airports: d3.scaleSqrt()
    .range([HYPERPARAMS.AIRPORTS_SCALE_MIN, HYPERPARAMS.AIRPORTS_SCALE_MAX]),
  // used to scale number of segments per line
  segments: d3.scaleLinear()
    .domain([HYPERPARAMS.SEGMENTS_SCALE_DOMAIN_MIN, HYPERPARAMS.SEGMENTS_SCALE_DOMAIN_MAX])
    .range([HYPERPARAMS.SEGMENTS_SCALE_RANGE_MIN, HYPERPARAMS.SEGMENTS_SCALE_RANGE_MAX]) };
// have these already created for easier drawing
const g = {
  basemap:  svg.select("g#basemap"),
  flights:  svg.select("g#flights"),
  airports: svg.select("g#airports"),
  voronoi:  svg.select("g#voronoi") };
// load the airport and flight data together
const promises = [
  d3.csv(urls.airports, typeAirport),
  d3.csv(urls.flights,  typeFlight)
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

// process airport and flight data
function processData(values) {

  let airports = values[0];
  let flights  = values[1];

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
  drawFlights(airports, flights);
}

function drawAirports(airports) {

  // draw airport bubbles
  g.airports.selectAll("circle.airport")
    .data(airports, d => d.iata)
    .enter()
    .append("circle")
    .attr("r",  d => scales.airports(d.outgoing/100000))
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
      d.flights.forEach(x => {  x.style['stroke-opacity'] = 0.8; });
    })
}

function drawFlights(airports, flights) {
  // break each flight between airports into multiple segments
  let bundle = generateSegments(airports, flights);

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
      if (d[0].cluster == d[d.length-1].cluster) { return d[0].color; } else { return "black"; }
    })
    .style("stroke-width", function(d, i){
      return flights[i].count**(-0.5/10**10) ;
    })
    .each(function(d) {
      // adds the path object to our source airport
      // makes it fast to select outgoing paths
      d[0].flights.push(this);
    })
    .on("mouseover", function(d) { this.style['stroke-opacity'] = 1;   })
    .on("mouseout", function(d)  { this.style['stroke-opacity'] = 0.1; });

  // https://github.com/d3/d3-force
  let layout = d3.forceSimulation()
    // settle at a layout faster
    .alphaDecay(HYPERPARAMS.ALPHA_DECAY)
    // nearby nodes attract each other
    .force("charge", d3.forceManyBody()
      .strength(HYPERPARAMS.FORCE_CHARGE_MANY_BODY)
      .distanceMax(scales.airports.range()[1] * 2)
    )
    // edges want to be as short as possible
    // prevents too much stretching
    .force("link", d3.forceLink()
      .strength(HYPERPARAMS.FORCE_LINK_STRENGTH)
      .distance(HYPERPARAMS.FORCE_LINK_DISTANCE)
    )
    .on("tick", function(d) { links.attr("d", line); })
    .on("end", function(d)  { console.log("layout complete"); });

  layout.nodes(bundle.nodes).force("link").links(bundle.links);
}

// Turns a single edge into several segments that can
// be used for simple edge bundling.
function generateSegments(nodes, links) {
  // generate separate graph for edge bundling
  // nodes: all nodes including control nodes
  // links: all individual segments (source to target)
  // paths: all segments combined into single path for drawing
  let bundle = {nodes: [], links: [], paths: []};
  // make existing nodes fixed
  bundle.nodes = nodes.map(function(d, i) {
    d.fx = d.x;
    d.fy = d.y;
    return d;
  });
  links.forEach(function(d, i) {
    // calculate the distance between the source and target
    let length = distance(d.source, d.target);
    // calculate total number of inner nodes for this link
    let total = 5;// Math.round(scales.segments(length));
    // create scales from source to target
    let xscale = d3.scaleLinear()
      .domain([0, total + 1]) // source, inner nodes, target
      .range([d.source.x, d.target.x]);
    let yscale = d3.scaleLinear()
      .domain([0, total + 1])
      .range([d.source.y, d.target.y]);
    // initialize source node
    let source = d.source;
    let target = null;
    // add all points to local path
    let local = [source];
    for (let j = 1; j <= total; j++) {
      // calculate target node
      target = { x: xscale(j), y: yscale(j) };
      local.push(target);
      bundle.nodes.push(target);
      bundle.links.push({
        source: source,
        target: target
      });
      source = target;
    }
    local.push(d.target);
    // add last link to target node
    bundle.links.push({
      source: target,
      target: d.target
    });
    bundle.paths.push(local);
  });
  console.log(bundle);
  return bundle;
}