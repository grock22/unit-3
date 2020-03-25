//griffin rock 3/11/2020
//execute script when window is loaded
window.onload = function(){


    //SVG dimension variables
    var w = 900, h = 500;


    //container block for svg
    var container = d3.select("body") //get the <body> element from the DOM
       .append("svg") //put a new svg in the body
       .attr("width", w) //assign the width
       .attr("height", h) //assign the height
       .attr("class", "container") //always assign a class (as the block name) for styling and future selection
       .style("background-color", "rgba(0,0,0,0.1)"); //only put a semicolon at the end of the block!
	
	//add a <rect> element
    var innerRect = container.append("rect") 
       .datum(400)
       .attr("width", function(d){
         return d*2;
       }) //rectangle width
       .attr("height",function(d){
         return d;
       }) //rectangle height
       .attr("class", "innerRect") //class name
       .attr("x", 50) //position from left on the x (horizontal) axis
       .attr("y", 50) //position from top on the y (vertical) axis
       .style("fill", "#FFFFFF"); //fill color
    
	//array of city and respective population
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
	//create linear scal
    var x = d3.scaleLinear() 
        .range([90, 810]) //output min and max
        .domain([0, 3.3]); //input min and max
		
	//find the minimum value of the array
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    //find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    //scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50]) //was 440, 95
        .domain([0, 700000]); //was minPop, maxPop
	
	//color scale 
	var color = d3.scaleLinear()
        .range([
            "#59003e",
            "#ffe6f7"
        ])
        .domain([
            minPop, 
            maxPop
        ]);
		
    //create an empty selection
    var circles = container.selectAll(".circles") 
        .data(cityPop) //here we feed in an array
        .enter() //one of the great mysteries of the universe (good one)
        .append("circle") //inspect the HTMLe
        .attr("class", "circles")
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
            //use the index to place each circle horizontally
            return x(i);
        })
        .attr("cy", function(d){
            //subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
            return y(d.population);
		})
		.style("fill", function(d, i){ //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); //black circle stroke
		
	//create y axis
	var yAxis = d3.axisLeft(y);
		
	//create axis g element and add axis
    var axis = container.append("g")
        .attr("class", "axis")
		.attr("transform", "translate(50, 0)")
		.call(yAxis)
		
	//create a text element and add the title
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 34)
        .text("City Populations");
		
	//create labels for circles
	var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population);
        });

    //first line of label
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });
	//format generator
	var format = d3.format(",");
    
	//second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
		.attr("dy", "15") // vertical offset
        .text(function(d){
            return "Pop. " + format(d.population);
        });
};
