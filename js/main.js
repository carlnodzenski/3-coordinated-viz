//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Expend", "PopTot", "PopMed", "PopDens", "Partic", "Ozone", "Grass", "Shrub", "Forest", "UrbanVeg", "Wetlands", "OpenSpace", "Crops", "Pasture"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 460,
    leftPadding = 55,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 110]);



//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){


    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 900;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", function () {
        map.attr("transform", d3.event.transform)
        }))
        .append("g");

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 36.7])
        .rotate([119.4, 0, 0])
        .parallels([36.7, 36.7])
        .scale(3800)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

  //use Promise.all to parallelize asynchronous data loading
	var promises = [];
	promises.push(d3.csv("data/California_edit2.csv")); //load attributes from csv
	promises.push(d3.json("data/ne_50m_land.topojson")); //load background spatial data
	promises.push(d3.json("data/CA_Counties_try.topojson")); //load choropleth spatial data
	Promise.all(promises).then(callback);

	function callback(data){

    [csvData, usa, counties] = data;

    //place graticule on the map
    setGraticule(map, path);

    var usa_topo = topojson.feature(usa, usa.objects.ne_50m_land),
			counties_topo = topojson.feature(counties, counties.objects.CA_Counties_try).features;

      console.log(usa_topo);


    //add Europe countries to map
    var usa_country = map.append("path")
        .datum(usa_topo)
        .attr("class", "country")
        .attr("d", path);

    //join csv data to GeoJSON enumeration units
    counties_topo = joinData(counties_topo, csvData);

    //create the color scale
    var colorScale = makeColorScaleNatural(csvData);

    //add enumeration units to the map
    setEnumerationUnits(counties_topo, map, path, colorScale);

    //add coordinated visualization to the map
    setChart(csvData, colorScale);

    // dropdown
    createDropdown(csvData);

    //correlation chart
    setCorr(csvData, colorScale);
  };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460,
        leftPadding = 55,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate)
        .style("fill", "#FFF");
    //create a scale to size bars proportionally to frame
    var csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
    console.log(csvmax);

    var yScale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain([0, csvmax + 20]);


    //set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.NAME;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return chartHeight - 10 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed]))+ topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        })
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

        //below Example 2.2 line 31...add style descriptor to each rect
    var desc = bars.append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
   var chartTitle = chart.append("text")
       .attr("x", 140)
       .attr("y", 40)
       .attr("class", "chartTitle")
       .text("Number of Variable " + expressed +" in each region");
       console.log(expressed);

       //create vertical axis generator
      var yAxis = d3.axisLeft()
          .scale(yScale);

      //place axis
      var axis = chart.append("g")
          .attr("class", "axis")
          .attr("transform", translate)
          .call(yAxis);

      //create frame for chart border
      var chartFrame = chart.append("rect")
          .attr("class", "chartFrame")
          .attr("width", chartInnerWidth)
          .attr("height", chartInnerHeight)
          .attr("transform", translate);

};

//function to create color scale generator
function makeColorScaleNatural(data){
    var colorClasses = [
        "#f0f9e8",
        "#bae4bc",
        "#7bccc4",
        "#43a2ca",
        "#0868ac"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    console.log("Domain Array",domainArray);

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    //console.log(domainArray);
    domainArray.shift();

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //console.log("Choro Value",val);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};


function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
	//create graticule generator
	var graticule = d3.geoGraticule()
		.step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule

	//create graticule lines
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
};

function joinData(counties_topo, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvCounty = csvData[i]; //the current region
        var csvKey = csvCounty.NAME; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<counties_topo.length; a++){

            var geojsonProps = counties_topo[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCounty[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };

    return counties_topo;
};

//function to create a dropdown menu for attribute selection
function createDropdown(){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScaleNatural(csvData);

    //recolor enumeration units
    var enum_county = d3.selectAll(".county")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //change Y axis
    d3.select('.axis').remove();
    var csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
    console.log(csvmax);
    var newYscale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain([0, csvmax + 20]);
    var yAxis = d3.axisLeft()
        .scale(newYscale);

    //place axis
    var axis = d3.select('.chart').append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);


    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function(d, i){
                return i * 20
            })
            .duration(500)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
        //resize bars
        .attr("height", function(d, i){
            return chartHeight - 10 - newYscale(parseFloat(d[expressed]));
            })
        .attr("y", function(d, i){
            return newYscale(parseFloat(d[expressed])) + topBottomPadding;
            })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
            });

    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed + " in each region");


};

function highlight(props){
  console.log(props)
    //change stroke
    var selected = d3.selectAll("." + props.NAME)
        .style("stroke", "#fd8d3c")
        .style("stroke-width", "3");

    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
   var selected = d3.selectAll("." + props.NAME)
       .style("stroke", function(){
           return getStyle(this, "stroke")
       })
       .style("stroke-width", function(){
           return getStyle(this, "stroke-width")
       });
  //below Example 2.4 line 21...remove info label
  d3.select(".infolabel")
             .remove();

   function getStyle(element, styleName){
       var styleText = d3.select(element)
           .select("desc")
           .text();

       var styleObject = JSON.parse(styleText);

       return styleObject[styleName];
   };
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.NAME + "_label")
        .html(labelAttribute);
        console.log("info label is...",infolabel);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME)

        console.log("region props...", props);
};

//function to move info label with mouse
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function setEnumerationUnits(counties_topo, map, path, colorScale){
    //...REGIONS BLOCK FROM MODULE 8
	//add counties to map
	var enum_county = map.selectAll(".county")
		.data(counties_topo)
		.enter()
		.append("path")
		.attr("class", function(d){
      //console.log(d.properties.NAME);
      //console.log("3rd", d);
			return "county " + d.properties.NAME;

		})

		.attr("d", path)

    .style("fill", function(d){
      //console.log("4th",d)
        return choropleth(d.properties, colorScale);
    })
    .on("mouseover", function(d){
            //console.log("2nd", d);
            //console.log(d.properties.NAME)
            highlight(d.properties);

    })
    .on("mouseout", function(d){
        dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);

    //below Example 2.2 line 16...add style descriptor to each path
    var desc = enum_county.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};



})(); //last line of main.js
