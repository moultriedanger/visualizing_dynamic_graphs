//d3 wrapped object
const canvas = d3.select('.canva')
//adding an svg element inside canvas
const svg = canvas.append("svg")
            //add attribute to determine height and width
            .attr('width', 1250)
            .attr('height', 1250)
            // .attr('style', "background-color: green")



d3.csv("cities.csv", function(row){
    svg.append("text")
        .attr("x", (row.lon*-10))
        .attr('y', (row.lat*10))
        .text(row.City)
        .attr('style',"font-size: 1rem")
        //.attr('transform', 'rotate(180)')

    svg.append("circle")
        .attr("cx", (row.lon*-10))
        .attr('cy', (row.lat*10))

        .attr('r', 2)
        .attr('fill', 'blue')
})


// attr("cx", (row.lon*-10))
//     .attr('cy', (row.lat*10))
