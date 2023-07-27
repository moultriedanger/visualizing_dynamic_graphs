const svg  = d3.select("svg");
const width  = window.innerWidth;//parseInt(svg.attr("width"));
const height = window.innerHeight//parseInt(svg.attr("height"));

const hypotenuse = Math.sqrt(width * width + height * height);
const projection = d3.geoAlbers().scale(1280).translate([480, 300]); //1280, 480, 300

//Aplha decay slider function
var alphaDecay = document.getElementById("alpha_decay_slider");
var alphaOutput = document.getElementById("alphaOutput")
alphaOutput.innerHTML = alphaDecay.value;
alphaDecay.oninput = function(){
  alphaOutput.innerHTML = this.value
}

//Force charge slider fucntion
var forceCharge = document.getElementById("force_charge_slider");
var forceOutput = document.getElementById("chargeOutput")
forceOutput.innerHTML = forceCharge.value;
forceCharge.oninput = function(){
  forceOutput.innerHTML = this.value
}

//Force link slider function
var forceLink = document.getElementById("force_link_slider");
var linkOutput = document.getElementById("linkOutput");
linkOutput.innerHTML = forceLink.value;
forceLink.oninput = function(){
    linkOutput.innerHTML = this.value
}

document.getElementById('applyButton').addEventListener('click', function(){
  
  d3.selectAll("path").remove();
  d3.selectAll("circle").remove();
  
  var alphaDecay = document.getElementById("alpha_decay_slider").value;
  var forceCharge = document.getElementById("force_charge_slider").value;
  var forceLink = document.getElementById("force_link_slider").value;
  var strokeWidth = document.getElementById("stroke_width_slider").value;
    
  //console.log(alphaDecay, forceCharge, forceLink, strokeWidth, strokeOpacity, circleRadius);
  // load the airport and flight data together
  const promises = [
    d3.csv(urls.airports, typeAirport),
    d3.csv(urls.flights, typeFlight)
  ];

  Promise.all(promises).then(processData);
})

const g = {    //basemap:  svg.select("g#basemap"),
    flights:  svg.select("g#flights"),
    airports: svg.select("g#airports"),
    airportText: svg.select("g#airportText"),
    voronoi:  svg.select("g#voronoi"),
    months: svg.select('g#months')
  };
const tooltip = d3.select("text#tooltip");

const urls={
    airports: "grid_locs.csv",
    flights: "flights.csv"
};
var airport_locs = {}

  const scales = {
    // used to scale airport bubbles
    airports: d3.scaleSqrt()
        .range([4, 18]),

    // used to scale number of segments per line
    segments: d3.scaleLinear()
        //The hyponenuse is the longest possible line
        .domain([0, hypotenuse/2])
        .range([1, 5]) //Each line has 1-10 segments?
    };
  
  // load the airport and flight data together
  const promises = [
    d3.csv(urls.airports, typeAirport),
    d3.csv(urls.flights, typeFlight)
  ];

  Promise.all(promises).then(processData);

  function processData(values) {
    console.assert(values.length === 2);
    
    let airports = values[0];
    let flights  = values[1];
  
    console.log("airports: " + airports.length);
    console.log(" flights: " + flights.length);
  
    // convert airports array (pre filter) into map for fast lookup
    let iata = new Map(airports.map(node => [node.iata, node]));
  
    // // calculate incoming and outgoing degree based on flights
    // // flights are given by airport iata code (not index)
    flights.forEach(function(link, i) {
      link.source = iata.get(link.origin);
      link.target = iata.get(link.destination);
      
      link.source.outgoing += 1;//link.count;
      link.target.incoming += 1;//link.count;
      link.count = flights[i].count;
      //console.log(link.target.incoming);
    });
    var circleRadius = document.getElementById('circle_radius_slider').value;
    // done filtering airports can draw
    drawNames(airports);
    //Draws the airports and adds event listeners
    drawAirports(airports,circleRadius);
    drawMonths(airports);
    drawPolygons(airports);
  
    //filter out flights that are not between airports we have leftover
    old = flights.length;
    //flights = flights.filter(link => iata.has(link.source.iata) && iata.has(link.target.iata));
    console.log(" removed: " + (old - flights.length) + " flights");
  
    var alphaDecay = document.getElementById("alpha_decay_slider").value;
    var forceCharge = document.getElementById("force_charge_slider").value;
    var forceLink = document.getElementById("force_link_slider").value;
    var strokeWidth = document.getElementById('stroke_width_slider').value;
    var strokeOpacity = document.getElementById('stroke_opacity_slider').value;
  
    // done filtering flights can draw
    drawFlights(airports, flights, alphaDecay, forceCharge, forceLink, strokeWidth, strokeOpacity);
    // console.log({airports: airports});
    
    // console.log({flights: flights});
  }

  function drawAirports(airports,circleRadius) {
    // adjust scale
    // const extent = d3.extent(airports, d => d.outgoing);
    // scales.airports.domain(extent);
    // draw airport bubbles
    g.airports.selectAll("circle.airport")
      .data(airports, d => d.iata)
      .enter()
      .append("circle")
      .attr("r",  d => scales.airports(d.outgoing/circleRadius))
      .attr("cx", function(d,i){
        return d.x; //30*(i%13);
      })
       // calculated on load
      .attr("cy", d => d.y) // calculated on load
      .attr("class", "airport")
      .style('fill', function(d){return d.color})
      .on("mouseover", function(d){
        //console.log(d.flights);
        for(let i = 0; i < d.flights.length; i++){
          d.flights[i].style.stroke = 'blue'
        }
        console.log(d.x,d.y)
        const div = document.createElement('div')
        div.style.height = '70px';
        div.style.width = '70px';
        div.style.background = 'red';
        div.style.color = "white";
        div.style.fontSize = "12px"
        div.style.borderRadius = "5px"
        div.id = 'popUp';
        div.style.textAlign = 'center'
        //div.innerHtml = `${d.x}`;
        // div.innerHTML = d.x + "," + d.y
        //div.innerHTML = ""+ d.iata;
        div.innerHTML = "Outgoing:" + d.outgoing;
        //document.body.appendChild(div);
        document.body.append(div)
      })
      .on('mouseout', function(d){
        for(let i = 0; i < d.flights.length; i ++){
          d.flights[i].style.stroke = d.color;//'red'
        }
        var popBox = document.getElementById('popUp');
        popBox.remove();
      })
      .each(function(d) {
        // adds the circle object to our airport
        // makes it fast to select airports on hover
        d.bubble = this;
      })
      
      
      //Change circle radius via the slider
      var circleRadius = document.getElementById('circle_radius_slider');
      var radiusOutput = document.getElementById("radiusOutput");
      radiusOutput.innerHTML = circleRadius.value
      circleRadius.addEventListener('input', function(airports){
        radiusOutput.innerHTML = this.value;
        d3.selectAll('circle')
        .attr("r",  d => scales.airports(d.outgoing/this.value))
      });
  }
  function drawPolygons(airports) {
  // convert array of airports into geojson format
  const geojson = airports.map(function(airport) {
    
    return {
      type: "Feature",
      properties: airport,
      geometry: {
        type: "Point",
        coordinates: [airport.longitude, airport.latitude]
      }
    }
  });

  // calculate voronoi polygons
  //console.log(geojson)
  const polygons = d3.geoVoronoi().polygons(geojson);
  // console.log(polygons)

  g.voronoi.selectAll("path")
    .data(polygons.features)
    .enter()
    .append("path")
    // .attr("d", d3.geoPath(projection))
    // .attr("d", projection)
    // .attr("d", function(d){return d['geometry'];})
    .attr("class", "voronoi")
    .on("mouseover", function(d) {
      alert('test');
      let airport = d.properties.site.properties;

      d3.select(airport.bubble)
        .classed("highlight", true);

      d3.selectAll(airport.flights)
        .classed("highlight", true)
        .raise();

      // make tooltip take up space but keep it invisible
      tooltip.style("display", null);
      tooltip.style("visibility", "hidden");

      // set default tooltip positioning
      tooltip.attr("text-anchor", "middle");
      tooltip.attr("dy", -scales.airports(airport.outgoing) - 4);
      tooltip.attr("x", airport.x);
      tooltip.attr("y", airport.y);

      // set the tooltip text
      tooltip.text(airport.name);
      //" in " + airport.city + ", " + airport.state

      // double check if the anchor needs to be changed
      let bbox = tooltip.node().getBBox();

      if (bbox.x <= 0) {
        tooltip.attr("text-anchor", "start");
      }
      else if (bbox.x + bbox.width >= width) {
        tooltip.attr("text-anchor", "end");
      }

      tooltip.style("visibility", "visible");
    })
    .on("mouseout", function(d) {
      console.log('mouseout1');
      let airport = d.properties.site.properties;

      d3.select(airport.bubble)
        .classed("highlight", false);

      d3.selectAll(airport.flights)
        .classed("highlight", false);

      d3.select("text#tooltip").style("visibility", "hidden");
    })
    .on("dblclick", function(d) {
      // toggle voronoi outline
      let toggle = d3.select(this).classed("highlight");
      d3.select(this).classed("highlight", !toggle);
    });
  }
  function drawNames(airports){
    g.airportText.selectAll("text")
      .data(airports, d => d.iata)
      .enter()
      .append('text')
      .attr('class','airportName')
      .attr("x", d => d.x - 80) // calculated on load
      .attr("y", d => d.y)
      .text(d => d.iata.slice(0, 3))

      let airList = document.getElementsByClassName("airportName")
      
      for(let i = 0; i < airList.length; i ++){
        // if((airList[i].innerHTML)[4]!=0){
          if (i % 13 != 0){
            airList[i].style.display = 'none' 
          //airList[i].remove();
        }
      }
      
      // g.airportText.selectAll("text")
      //   .text(function(d){
      //     console.log(d.iata.length);
      //     if (d.iata.length > 3){
      //       return d.iata.slice(0, 3)
      //     }
      //     else{
      //       return d.iata;
      //     }
      //   });
        // .text(d => d.iata.slice(0,3))
      
  }
  function drawMonths(airports){
    let lastIndex = airports.length-1;

    var svg = d3.select('#months')
      .append("svg")

    var x = d3.scalePoint()
      .domain(["JAN", "FEB", "MAR", "APRL", "MAY", 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT','NOV', 'DEC'])         // This is what is written on the Axis: from 0 to 100
      .range([0, 800]);   
      //Variable for range 

      svg
      .append("g")
      .style('font', '20px sans-serif')
      //Base the month list of off of airports list to get the right value. Look at 36!!
      .attr("transform", "translate("+(airports[0].longitude + 36)+','+(airports[lastIndex].latitude + airports[0].latitude)+")")      // This controls the vertical position of the Axis
      .call(d3.axisBottom(x));

  }
  function drawFlights(airports, flights, alphaDecay, forceCharge, forceLink, strokeWidth, strokeOpacity) {
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
      .style('stroke-width', function(d, i){ 
        return flights[i].count/100;
      })
      .style('opacity', strokeOpacity)
      .style('stroke', function(d){return d[0].color;})
      
      //.style('')
      .each(function(d) {
        // adds the path object to our source airport
        // makes it fast to select outgoing paths
        d[0].flights.push(this);//.color
      })

    //https://github.com/d3/d3-force
    let layout = d3.forceSimulation()
      // settle at a layout faster
      .alphaDecay(alphaDecay)  //.1
      // nearby nodes attract each other
      .force("charge", d3.forceManyBody()
        .strength(forceCharge) //5
        .distanceMax(scales.airports.range()[1] * 2)
      )
      // edges want to be as short as possible
      // prevents too much stretching
      .force("link", d3.forceLink()
        .strength(forceLink) //.1
        .distance(0)
      )
      .on("tick", function(d) {
        links.attr("d", line);
      })
      .on("end", function(d) {
        console.log("layout complete");
      });
  
    layout.nodes(bundle.nodes).force("link").links(bundle.links);

    //Stroke Width slider function
    var strokeWidth = document.getElementById('stroke_width_slider');
    var strokeOutput = document.getElementById("strokeOutput");
    strokeOutput.innerHTML = strokeWidth.value;
    strokeWidth.oninput = function(){
      strokeOutput.innerHTML = this.value;
      var val = this.value
      var fPaths = d3.selectAll("path.flight")
      console.log(val);

      d3.selectAll("path.flight")
      .style('stroke-width', function(d, i){return flights[i].count/(val);});
    }
    //Stroke opacity slider function
    var strokeOpacity = document.getElementById('stroke_opacity_slider');
    var opacityOutput = document.getElementById("opacityOutput");
    opacityOutput.innerHTML = strokeOpacity.value
    strokeOpacity.oninput = function(){
      d3.selectAll('path')
      .style('opacity', this.value)
      opacityOutput.innerHTML = this.value
    }
  }
  function generateSegments(nodes, links) {
    // generate separate graph for edge bundling
    // nodes: all nodes including control nodes
    // links: all individual segments (source to target)
    // paths: all segments combined into single path for drawing
    let bundle = {nodes: [], links: [], paths: []};
  
    // console.log(nodes);
    // make existing nodes fixed
    bundle.nodes = nodes.map(function(d, i) {
      d.fx = d.x;
      d.fy = d.y;
      return d;
    });
  
    links.forEach(function(d, i) {
      // console.log(d);
      // calculate the distance between the source and target
      let length = distance(d.source, d.target);
  
      // calculate total number of inner nodes for this link
      let total = Math.round(scales.segments(length));
  
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
        target = {
          x: xscale(j),
          y: yscale(j)
        };
  
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
  
    return bundle;
  }
  
  function typeAirport(airport) {
    airport.longitude = parseFloat(airport.longitude);
    airport.latitude  = parseFloat(airport.latitude);
  
    // use projection hard-coded to match topojson data
    const coords = projection([airport.longitude, airport.latitude]);
    airport.x = airport.longitude//coords[0];
    airport.y = airport.latitude //coords[1];
  
    airport.outgoing = 0;  // eventually tracks number of outgoing flights
    airport.incoming = 0;  // eventually tracks number of incoming flights
  
    airport.flights = [];  // eventually tracks outgoing flights
  
    return airport;
  }
  
  function typeFlight(flight) {
    flight.count = parseInt(flight.count);
    return flight;
  }
  // calculates the distance between two nodes
  // sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
  function distance(source, target) {
    const dx2 = Math.pow(target.x - source.x, 2);
    const dy2 = Math.pow(target.y - source.y, 2);
  
    return Math.sqrt(dx2 + dy2);
  }