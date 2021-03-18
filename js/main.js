//Lesson 1
//SVG dimension variables
var w = 900, h = 500;

 //Example 1.2 line 1...container block
var container = d3.select("body") //get the <body> element from the DOM
    .append("svg") //put a new svg in the body
    .attr("width", w) //assign the width
    .attr("height", h) //assign the height
    .attr("class", "container") //always assign a class (as the block name) for styling and future selection
    .style("background-color", "rgba(0,0,0,0.2)");

//innerRect block
var innerRect = container.append("rect") //put a new rect in the svg
    .datum(400) //a single value is a datum
    .attr("width", function(d){ //rectangle width
        return d * 2; //400 * 2 = 800
    })
    .attr("height", function(d){ //rectangle height
        return d; //400
    })

    .attr("class", "innerRect") //class name
    .attr("x", 50) //position from left on the x (horizontal) axis
    .attr("y", 50) //position from top on the y (vertical) axis
    .style("fill", "#FFFFFF"); //fill color
// <rect> is now the operand of the container block


//Lesson 2
var numbersArray = [1, 2, 3];

var stringsArray = ["one", "two", "three"];

var colorsArray = ["#F00", "#0F0", "#00F"];

var objectsArray = [
    {
        city: 'Madison',
        population: 233209
    },
    {
        city: 'Milwaukee',
        population: 594833
    },
    {
        city: 'Green Bay',
        population: 104057
    }
];

var arraysArray = [
    ['Madison', 23209],
    ['Milwaukee', 593833],
    ['Green Bay', 104057]
];

var dataArray = [10, 20, 30, 40, 50];

var cityPop = [
     {
         city: 'Madison',
         population: 233209
     },
     {
         city: 'Milwaukee',
         population: 594833
     },
     {
         city: 'Green Bay',
         population: 104057
     },
     {
         city: 'Superior',
         population: 27244
     }
 ];


//find minimum value of the array
var minPop = d3.min(cityPop, function(d){
    return d.population;
});

//find maxium value of the array
var maxPop = d3.max(cityPop, function(d){
    return d.population;
});

var x = d3.scaleLinear() //create the scale
    .range([90, 750]) //outut min and max
    .domain([0, 3]); //input min and max
    console.log(x);

//scale for circles center y coordinate
var y = d3.scaleLinear()
    .range([450, 50]) //was 440, 95
    .domain([0, 700000]); //was minPop, maxPop

//color sclae generator
var color = d3.scaleLinear()
    .range([
        "#FDBE85",
        "#D94701"
    ])
    .domain([
        minPop,
        maxPop
    ]);

var circles = container.selectAll(".circles") //but wait -- there are no circles yet!

    .data(cityPop) //here we feed in an array
    .enter() //one of the great mysteries of the universe
    .append("circle") //add a circle for each datum
    .attr("class", "circles") //apply a class name to all circles
    .attr("id", function(d, i){//circle radius
        //console.log("d:", d, "i:", i);
        return d.city;
    })
    .attr("r", function(d){
        //calculate the radius based on population value as circle area
        var area = d.population * 0.01;
        return Math.sqrt(area/Math.PI);
    })
    .attr("cx", function(d, i){ //x coordinate
        //use scale generator with the index to place each circle horizontally
        return x(i);
    })
    .attr("cy", function(d){//y coordinate
        return y(d.population);
    })
    .style("fill", function(d, i){//add a fill based on the color scale generator
        return color(d.population);
      })
    .style("stroke", "#000"); //black circle stroke

//create y axis generator
var yAxis = d3.axisLeft(y);

//create axis g element and add axis
var axis = container.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);

var title = container.append("text")
    .attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", 450)
    .attr("y", 30)
    .text("City Populations");

var labels = container.selectAll(".labels")
    .data(cityPop)
    .enter()
    .append("text")
    .attr("class", "labels")
    .attr("text-anchor", "left")
    .attr("y", function(d){
        //vertical position centered on each circle
        return y(d.population) -2;
    });

    //first line of the label
var nameLine = labels.append("tspan")
    .attr("class", "nameLine")
    .attr("x", function(d,i){
        //horizontal position to the right of each circle
        return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
    })
    .text(function(d){
        return d.city;
    });

var format = d3.format(",");

var popLine = labels.append("tspan")
    .attr("class", "popLine")
    .attr("x", function(d,i){
        //horizontal position to the right of each circle
        return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
    })
    .attr("dy", "15") //vertical offset
    .text(function(d){
        return "Pop. " + format(d.population);
    });
