//griffin rock 4/8/2020
//calls everything, wraps it all up
(function(){
	
	//pseudo-global variables
	//countyData variables
	var attrArray = ["Id2",
						"Geography",
						"Percent of Population with Bachelor's Degree",
						"Percent Science and Engineering Majors",
						"Percent Science and Engineering Related Majors",
						"Percent Business Majors",
						"Percent Education Majors",
						"Percent Arts, Humanities and Other Majors"]
	var expressed = attrArray[2]; //percent with bachelor's degree
	
	//chart frame dimensions
	var chartWidth = window.innerWidth * 0.38,
		chartHeight = 510,
		leftPadding = 25,
		rightPadding = 5,
		topBottomPadding = 5, //note: cuts out bottom axis
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottomPadding * 2,
		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
	
	//create a scale to size bars proportionally to frame and for axis
	var yScale = d3.scaleLinear()
		.range([500, 0])
		.domain([0, 70]); // percent but highest value only goes to 60 or so
		
			
	//begin script when window loads
	window.onload = setMap();

	//set up choropleth map
	function setMap(){
		
		//map frame dimensions
		var width = window.innerWidth *0.55
			height = 500;
		
		
			
		//create new svg container for the map, assign width and height variables to it
		var map = d3.select("body")
		    .append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height)
		
		
			
		//create Albers equal area conic projection for continental US as a whole
		//parameters, scale important
		var projection = d3.geoAlbers()
			.center([3.64, 39.05])
			.rotate([101.00, 0.00, 0])
			.parallels([45.00, 45.00])
			.scale(900)
			.translate([width / 2, height / 2]);
		
		//map element needed for projection and future use
		var path = d3.geoPath()
			.projection(projection);
			
		
		// add in zoom and pan, limit extent to add in hawaii and alaska
		var zoom = d3.zoom()
			.scaleExtent([1,7])
			.translateExtent([[-800,-400],[800,800]])
			.on('zoom', function() {
				map.selectAll('path')
				.attr('transform', d3.event.transform);
			});
		//call zoom
		map.call(zoom);
		
		//empty array
		var promises = [];
		promises.push(d3.csv("data/field_of_first_major_UScounty_ACS_2017.csv")); //load attributes from csv
		promises.push(d3.json("data/main_states_counties_v2.topojson")); //load spatial data (smaller file)
		Promise.all(promises).then(callback);
		
		//calls data async
		function callback(data){
			countyData = data[0];
			countyGeo = data[1];
			
			//create graticule for background reference
			setGraticule(map,path);
			
							
			//translate main_states_counties TopoJSON
			var county_bound = topojson.feature(countyGeo, countyGeo.objects.main_states_counties).features
		
			county_bound = joinData(county_bound, countyData);
			
			//color scale used to classify
			var colorScale = makeColorScale(countyData);
			
			//create counties and fill
			setEnumerationUnits(county_bound, map, path, colorScale);
			
			//add coordinated visualization to map
			setChart(countyData, colorScale);
			
			//create menu
			createDropdown(countyData);
			
									
		};
		
	};
	
	//create graticule as well as map text
	function setGraticule(map, path){
		//create graticule generator
		var graticule = d3.geoGraticule()
			.step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
		
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
			
		//create map title
		var mapTitle = map.append("text")
			.attr("x", 15)
			.attr("y", 25)
			.attr("class", "mapTitle")
			
		var mapTitle = d3.select(".mapTitle")
			.text("First Field of Major by County, 2012-2017")
			
		//create map details for user info
		var mapDetails = map.append("text")
			.attr("x", 15)
			.attr("y", 487)
			.attr("class", "mapDetails")
			
		var mapDetails = d3.select(".mapDetails")
			.text("(Alaska & Hawaii North and West)")
	}
	
	function joinData(county_bound, countyData){
		//loop through csv to assign each set of csv attribute values to geojson region
		for (var i=0; i<countyData.length; i++){
			var csvRegion = countyData[i]; //the current region
			var csvKey = csvRegion.Id2; //the CSV primary key
			
			//loop through geojson regions to find correct region
			for (var a=0; a<county_bound.length; a++){

				var geojsonProps = county_bound[a].properties; //the current region geojson properties
				
				var geojsonKey = geojsonProps.GEOID; //the geojson primary key
				
				//where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey == csvKey){

					//assign all attributes and values
					attrArray.forEach(function(attr){
						var val = parseFloat(csvRegion[attr]); //get csv attribute value
						geojsonProps[attr] = val; //assign attribute and value to geojson properties
					});
				};
			};
		};
		// return boundaries with data inside
		return county_bound;
	};
	
	function setEnumerationUnits(county_bound, map, path, colorScale){
		//add counties
		var counties = map.selectAll(".counties")
			.data(county_bound)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "counties " + d.properties.GEOID; //primary key
			})
			.attr("d", path)
			.style("fill", function(d){
				var value = d.properties[expressed];
				if(value) {
					return colorScale(d.properties[expressed]);
				} else {
					return "#a8a8a8";
				}
			})
			.on("mouseover", function(d){ //nightmare
				//console.log(d.properties)
				highlight(d.properties);
			})
			.on("mouseout", function(d){
				dehighlight(d.properties);
			})
			.on("mousemove", moveLabel);
	};
	
	//create color scale generator
	//function to create color scale generator
	function makeColorScale(data){
		var colorClasses = [
			"#f1eef6",
			"#bdc9e1",
			"#74a9cf",
			"#2b8cbe",
			"#045a8d"
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

		//assign array of expressed values as scale domain
		colorScale.domain(domainArray);

		return colorScale;
	};
	
	//function to create coordinated bar chart
	function setChart(countyData, colorScale){
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
			.attr("transform", translate);

		//set bars for each province
		var bars = chart.selectAll(".bar")
			.data(countyData)
			.enter()
			.append("rect")
			.sort(function(a, b){
				return b[expressed]-a[expressed]
			})
			.attr("class", function(d){
				return "bar " + d.Id2;
			})
			.attr("width", chartInnerWidth / (countyData.length - 1)) //add extra () so math works out
			.on("mouseover", highlight)//also not good
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel);
			
		//create a text element for the bar graph title
		var chartTitle = chart.append("text")
			.attr("x", 40)
			.attr("y", 40)
			.attr("class", "chartTitle")
		// extra text for user info	
		var chartDetails = chart.append("text")
			.attr("x", 50)
			.attr("y", 60)
			.attr("class", "chartDetails")
			
		var chartDetails = d3.select(".chartDetails")
			.text("There are 3142 counties in the United States, which are displayed below from highest to lowest percent")
			
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
		//update chart as attribute changes	
		updateChart(bars, countyData.length, colorScale)
	};
	
	//function to create a dropdown menu for attribute selection
	function createDropdown(countyData){
		//add select element
		var dropdown = d3.select("body")
			.append("select")
			.attr("class", "dropdown")
			.on("change", function(){
				changeAttribute(this.value, countyData)
			});

		//add initial option
		var titleOption = dropdown.append("option")
			.attr("class", "titleOption")
			.attr("disabled", "true")
			.text("Select First Major of Interest");

		//add attribute name options
		var attrOptions = dropdown.selectAll("attrOptions")
			.data(attrArray.slice(2,8))
			.enter()
			.append("option")
			.attr("value", function(d){ return d })
			.text(function(d){ return d });
	};
	
	function changeAttribute(attribute, countyData){
		//change the expressed attribute
		expressed = attribute;
		
		//recreate the color scale
		var colorScale = makeColorScale(countyData);

		//recolor enumeration units
		var counties = d3.selectAll(".counties")
			.transition()
			.duration(1750)
			.style("fill", function(d){
				var value = d.properties[expressed];
				if(value) {
					return colorScale(value);
				} else {
					return "#a8a8a8";
				}
			});
		
		//re-sort, resize, and recolor bars
		var bars = d3.selectAll(".bar")
			//re-sort bars
			.sort(function(a, b){
				return b[expressed] - a[expressed];
			})
			.transition() //pretty
			.delay(function(d,i){
				return i*0.5
			})
			.duration(500);
		
		updateChart(bars, countyData.length, colorScale)
	};	
	//update chart as stuff changes
	function updateChart(bars, n, colorScale){
		//position bars
		bars.attr("x", function(d, i){
				return i * (chartInnerWidth / n) + leftPadding;
			})
			//size/resize bars
			.attr("height", function(d, i){
				return 500 - yScale(parseFloat(d[expressed]));
			})
			.attr("y", function(d, i){
				return yScale(parseFloat(d[expressed])) + topBottomPadding;
			})
			//color/recolor bars
			.style("fill", function(d){
				var value = d[expressed];
				if(value) {
					return colorScale(value);
				} else {
					return "#a8a8a8";
				}
		});
		var chartTitle = d3.select(".chartTitle")
			.text(expressed); //change title as variable does DYNAMIC
		
	};
	//function to highlight enumeration units (maybe bars too, might have to make seperate function)
	function highlight(props){
		//change stroke
		// var selected = d3.selectAll("." + props.Id2) //// yea not sure what I did wrong here but it failed
			// .style("stroke", "green")
			// .style("stroke-width", "1");
		//console.log(selected)
		setLabel(props);
	};
	
	//function to reset the element style on mouseout
	function dehighlight(props){
		//var selected = d3.selectAll("." + props.Id2) ////same issue
			// .style("stroke", function(){
				// return getStyle(this, "stroke")
			// })
			// .style("stroke-width", function(){
				// return getStyle(this, "stroke-width")
			// });
		
		function getStyle(element, styleName){
			var styleText = d3.select(element)
				.select("desc")
				.text();

			var styleObject = JSON.parse(styleText);

			return styleObject[styleName];
		};
		//remove infolabel
		d3.select(".infolabel")
			.remove();
	};
	
	
	//function to create dynamic label
	function setLabel(props){
		//label content
		var labelAttribute = "<h1>" + props[expressed] +
			"</h1><b>" + expressed + "</b>"; //yet this worked

		//create info label div
		var infolabel = d3.select("body")
			.append("div")
			.attr("class", "infolabel")
			.attr("id", props.Id2 + "_label") //and this
			.html(labelAttribute);

		var countyName = infolabel.append("div")
			.attr("class", "labelname")
			.html(props.Geography); //this only worked for the chart, idk why
	};
	
	function moveLabel(){
		//get width of label
		var labelWidth = d3.select(".infolabel")
			.node()
			.getBoundingClientRect()
			.width;

		//use coordinates of mousemove event to set label coordinates
		var x1 = d3.event.clientX + 10,
			y1 = d3.event.clientY + 400,
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

		
})();

//yea, tried to implement a legend as well but no avail unfortunately, as well as a zoom in function for the bar graph. 
//I do think that the bar graph makes sense and works well for the data, but not being able to zoom in hinders it a bit too much because there are so many data points. 

