const urls = {
    map: "states-albers-10m.json",
    airports: "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/airports.csv",
    flights: "https://gist.githubusercontent.com/mbostock/7608400/raw/e5974d9bba45bc9ab272d98dd7427567aafd55bc/flights.csv"
  };
  
  const svg  = d3.select("svg");
  
  const width  = parseInt(svg.attr("width"));
  const height = parseInt(svg.attr("height"));
  const hypotenuse = Math.sqrt(width * width + height * height);
  
  const projection = d3.geoAlbers().scale(1280).translate([480, 300]);
  
  const scales = {
    airports: d3.scaleSqrt().range([4, 18]),
    segments: d3.scaleLinear().domain([0, hypotenuse]).range([1, 10])
  };
  
  const g = {
    basemap:  svg.select("g#basemap"),
    flights:  svg.select("g#flights"),
    airports: svg.select("g#airports"),
    voronoi:  svg.select("g#voronoi")
  };
  
  console.assert(g.basemap.size()  === 1);
  console.assert(g.flights.size()  === 1);
  console.assert(g.airports.size() === 1);
  console.assert(g.voronoi.size()  === 1);
  
  const tooltip = d3.select("text#tooltip");
  console.assert(tooltip.size() === 1);
  
  // TODO
  
  function processData(values) {
    console.assert(values.length === 2);
  
    let airports = values[0];
    let flights  = values[1];
  
    console.log("airports: " + airports.length);
    console.log(" flights: " + flights.length);
  
    // TODO
  
    console.log({airports: airports});
    console.log({flights: flights});
  }
  
  function drawMap(map) {
    map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);
  
    let land = topojson.merge(map, map.objects.states.geometries);
    let path = d3.geoPath();
  
    g.basemap.append("path")
      .datum(land)
      .attr("class", "land")
      .attr("d", path);
  
    // TODO
  }
  
  function drawAirports(airports) {
    const extent = d3.extent(airports, d => d.outgoing);
    scales.airports.domain(extent);
  
    g.airports.selectAll("circle.airport")
      .data(airports, d => d.iata)
      .enter()
      .append("circle")
      .attr("r",  d => scales.airports(d.outgoing))
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("class", "airport")
      .each(function(d) {
        // TODO
      });
  }
  
  function drawPolygons(airports) {
    const geojson = airports.map(function(airport) {
      return {
        type: "Feature",
        properties: airport,
        geometry: {
          type: "Point",
          coordinates: [airport.longitude, airport.latitude]
        }
      };
    });
  
    // TODO
  }
  
  function drawFlights(airports, flights) {
    let bundle = generateSegments(airports, flights);
  
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
      .each(function(d) {
        // TODO Fill in
      });
  
    // TODO Fill in
  }
  
  function generateSegments(nodes, links) {
    let bundle = {nodes: [], links: [], paths: []};
  
    bundle.nodes = nodes.map(function(d, i) {
      d.fx = d.x;
      d.fy = d.y;
      return d;
    });
  
    links.forEach(function(d, i) {
      let length = distance(d.source, d.target);
      let total = Math.round(scales.segments(length));
  
      let xscale = d3.scaleLinear()
        .domain([0, total + 1])
        .range([d.source.x, d.target.x]);
  
      let yscale = d3.scaleLinear()
        .domain([0, total + 1])
        .range([d.source.y, d.target.y]);
  
      let source = d.source;
      let target = null;
      let local = [source];
  
      for (let j = 1; j <= total; j++) {
        target = {x: xscale(j), y: yscale(j)};
        local.push(target);
        bundle.nodes.push(target);
        bundle.links.push({source: source, target: target});
        source = target;
      }
  
      local.push(d.target);
      bundle.links.push({source: target, target: d.target});
      bundle.paths.push(local);
    });
  
    return bundle;
  }
  
  function isContinental(state) {
    const id = parseInt(state.id);
    return id < 60 && id !== 2 && id !== 15;
  }
  
  function typeAirport(airport) {
    airport.longitude = parseFloat(airport.longitude);
    airport.latitude  = parseFloat(airport.latitude);
  
    const coords = projection([airport.longitude, airport.latitude]);
    airport.x = coords[0];
    airport.y = coords[1];
  
    airport.outgoing = 0;
    airport.incoming = 0;
    airport.flights = [];
  
    return airport;
  }
  
  function typeFlight(flight) {
    flight.count = parseInt(flight.count);
    return flight;
  }
  
  function distance(source, target) {
    const dx2 = Math.pow(target.x - source.x, 2);
    const dy2 = Math.pow(target.y - source.y, 2);
    return Math.sqrt(dx2 + dy2);
  }