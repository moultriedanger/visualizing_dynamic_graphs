const svg  = d3.select("svg");
const width  = parseInt(svg.attr("width"));
const height = parseInt(svg.attr("height"));
const hypotenuse = Math.sqrt(width * width + height * height);

const urls={
    grid: "grid_locs.csv",
    flights: "flights.csv"
};
var airport_locs = {}

const scales = {
    // used to scale number of segments per line
    segments: d3.scaleLinear()
      //What value the 
      .domain([0, hypotenuse])
      .range([1, 10])
  };

d3.csv(urls.grid, function(layout) {
    aircircle = svg.append('circle')
    .attr('cx', layout.longitude)
    .attr('cy', layout.latitude)
    .attr('r', 3)
    .attr('fill', 'blue')
    .attr('id', layout.iata)

    airport_locs[layout.iata] = [layout.longitude,layout.latitude];
    //console.log(airport_locs[dest])
    d3.csv(urls.flights, drawFlights)
});

function drawFlights(lines){
    //get the origin and dest value in flights
    origin = lines['origin']
    dest = lines['destination'];
    
    //let bundle = generateSegments(urfs.flights, urls.grid);
    //console.log(airport_locs[origin],airport_locs[dest])
    svg.append('line')
        .attr('x1', airport_locs[origin][0])
        .attr('y1', airport_locs[origin][1])
        .attr('x2', airport_locs[dest][0])
        .attr('y2', airport_locs[dest][1])
        .style('stroke-width', 1)
        .style('stroke', 'green')
}

// function generateSegments(nodes, links) {
//     // generate separate graph for edge bundling
//     // nodes: all nodes including control nodes
//     // links: all individual segments (source to target)
//     // paths: all segments combined into single path for drawing
//     let bundle = {nodes: [], links: [], paths: []};
  
//     // make existing nodes fixed
//     bundle.nodes = nodes.map(function(d, i) {
//       d.fx = d.x;
//       d.fy = d.y;
//       return d;
//     });
  
//     links.forEach(function(d, i) {
//       // console.log(d);
//       // calculate the distance between the source and target
//       let length = distance(d.source, d.target);
  
//       // calculate total number of inner nodes for this link
//       let total = Math.round(scales.segments(length));
  
//       // create scales from source to target
//       let xscale = d3.scaleLinear()
//         .domain([0, total + 1]) // source, inner nodes, target
//         .range([d.source.x, d.target.x]);
  
//       let yscale = d3.scaleLinear()
//         .domain([0, total + 1])
//         .range([d.source.y, d.target.y]);
  
//       // initialize source node
//       let source = d.source;
//       let target = null;
  
//       // add all points to local path
//       let local = [source];
  
//       for (let j = 1; j <= total; j++) {
//         // calculate target node
//         target = {
//           x: xscale(j),
//           y: yscale(j)
//         };
  
//         local.push(target);
//         bundle.nodes.push(target);
  
//         bundle.links.push({
//           source: source,
//           target: target
//         });
  
//         source = target;
//       }
  
//       local.push(d.target);
  
//       // add last link to target node
//       bundle.links.push({
//         source: target,
//         target: d.target
//       });
  
//       bundle.paths.push(local);
//     });
  
//     return bundle;
// }