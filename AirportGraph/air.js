// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 1000 - margin.left - margin.right,
  height =1000 - margin.top - margin.bottom;

let lines_data = null;
let us_airports_data = null;
let merged_flights = null;
let flight_info = null;

// append the svg object to the body of the page
var svg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const flightsFile = "merged_small.csv";
const airportFile = "us_large_airports.csv"
 
d3.csv(flightsFile, on_reading_data);

function on_reading_data(data) {
  flight_info = data;

  var max_origin_lat = d3.max(flight_info, function(d) {
    return parseFloat(d.origin_latitude);
  });
  var max_dest_lat = d3.max(flight_info, function(d) {
    return parseFloat(d.destination_latitude);
  });
  var min_origin_lat = d3.min(flight_info, function (d) {
    return parseFloat(d.origin_latitude);
  });
  var min_dest_lat = d3.max(flight_info, function (d) {
    return parseFloat(d.destination_latitude);
  });

  var max_origin_lon = d3.max(flight_info, function(d) { return parseFloat(d.origin_longitude); });
  var max_dest_lon   = d3.max(flight_info, function(d) { return parseFloat(d.destination_longitude); });
  var min_origin_lon = d3.min(flight_info, function (d) { return parseFloat(d.origin_longitude); });
  var min_dest_lon   = d3.max(flight_info, function (d) { return parseFloat(d.destination_longitude); });

  //Max lat
  if(max_origin_lat > max_dest_lat){
    max_lat = max_origin_lat
  }
  else{
    max_lat = max_dest_lat
  }
  //Min lat
  if(min_origin_lat < min_dest_lat){
    min_lat = min_origin_lat
  }
  else{
    min_lat = min_dest_lat
  }

  //Max lon
  if(max_origin_lon > max_dest_lon){
    max_lon = max_origin_lon
  }
  else{
    max_lon = max_dest_lon
  }
  //Min lon
  if(min_origin_lon<min_dest_lon){
    min_lon = min_origin_lon
  }
  else{
    min_lon = min_dest_lon
  }

  //Add X axis
  const x = d3.scaleLinear().domain([min_lon, max_lon]).range([width, 0]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  // Add Y axis
  const y = d3.scaleLinear().domain([min_lat, max_lat]).range([0, height]);
  svg.append("g").call(d3.axisLeft(y));

  for(let i = 0; i< flight_info.length; i++ ){
    //console.log(i)
    let x1 = flight_info[i]['origin_longitude']
    let y1 = (flight_info[i]['origin_latitude'])
    let x2 = flight_info[i]['origin_longitude']
    let y2 = (flight_info[i]['destination_latitude'])
    console.log(x1,y1,x2,y2)

    // svg.append('line')
    //   .attr('x1', x(x1))  
    //   .attr('y1', y(y1))
    //   .attr('x2', x(x2))
    //   .attr('y2', y(y2))
    //   .style("stroke-width", 1)
    //   .style("stroke","lightgreen")
  }
  d3.csv(airportFile, function(data){
    us_airports_data = data
    svg.append('g')
    .selectAll("dot")
    .data(us_airports_data)
    .enter()
    .append('circle')
      .attr("cy", function (d) { return y(d.latitude_deg); } )
      .attr("cx", function (d) { return x(d.longitude_deg); } )
      .attr("r", 2)
      .style("fill", "#69b3a2");
  });
}
//The point is supposed to be in wisconsin

  // for(let i = 0; i < us_airports_data.length; i ++){
  //   console.log(us_airports_data.length)
    // svg.append('circle')
    // .attr("cy", (us_airports_data[i]['longitude_deg']))
    // .attr("cx", (us_airports_data[i]['latitude_deg']))
    // .attr("r", 2)
    // .style("fill", "#69b3a2");
  //}
  // svg.append("g")
    // .selectAll("dot")
    // .data(us_airports_data)
    // .enter()
    // .append("circle")
    // .attr("cy", function (d) {
    //   return funX(d.latitude_deg);
    // })
    // .attr("cx", function (d) {
    //   return funY(d.longitude_deg);
    // })
    // .attr("r", 2)
    // .style("fill", "#69b3a2");
//}


    // svg
    //   .append("g")
    //   .selectAll("dot")
    //   .data(cities_data)
    //   .enter()
    //   .append("text")
    //   .attr("y", function (d) {
    //     return x(d.lat);
    //   })
    //   .attr("x", function (d) {
    //     return y(d.lon);
    //   })
    //   .text(function (d) {
    //     return d.City;
    //   })
    //   .attr("font-family", "sans-serif")
    //   .attr("font-size", "10px")
    //   .attr("fill", "red");

    //Print Lines
    // for(var i = 0; i < city.length; i+=2){
    //   let lineX1 = city[i]['lon'];
    //   let lineY1 = city[i]['lat'];
    //   let lineX2 = city[i+1]['lon'];
    //   let lineY2 = city[i+1]['lat']
    //   var lines = svg.append('line')
    //     .style("stroke","lightgreen" )
    //     .style("stroke-width", 3)
    //     // .attr('y2', x(lineY1))
    //     // .attr('x2', y(lineX1))
    //     // .attr('y1', x(lineY2))
    //     // .attr('x1', y(lineX2))
    //     update();
    // }

    // function update(city){
    //   for(var i = 0; i < city.length; i+=2){
    //     let lineX1 = city[i]['lon'];
    //     let lineY1 = city[i]['lat'];
    //     let lineX2 = city[i+1]['lon'];
    //     let lineY2 = city[i+1]['lat']
    //     var line = svg.append('line')
    //       .style("stroke-width", 3)
    //       .attr('y2', x(lineY1))
    //       .attr('x2', y(lineX1))
    //       .attr('y1', x(lineY1))
    //       .attr('x1', y(lineX1))
    //       .style("stroke","lightgreen" )

    //     //transition
    //     line.transition()
    //       .ease(d3.easeLinear)
    //       .duration(2000)
    //       .attr('y1', x(lineY2))
    //       .attr('x1', y(lineX2))
    //       .style('stroke', 'blue')
    //       .delay(1000*i)
    //   }  
    // }
    // update(city)
