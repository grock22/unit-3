//griffin rock 4/8/2020
(function(){
	
	//pseudo-global variables
	var attrArray = ["Total population (25 years and over with a Bachelor's degree or higher)",
							"Total Science and Engineering",
							"Percent Science and Engineering",
							"Total Science and Engineering Related Fields",
							"Percent Science and Engineering Related Fields",
							"Total Business",
							"Percent Business",
							"Total Education",
							"Percent Education",
							"Total Arts, Humanities and Others",
			"Percent Arts, Humanities and Others"]
	var expressed = attrArray[2];
	
	//begin script when window loads
	window.onload = setMap();

	//set up choropleth map
	function setMap(){
		
		//map frame dimensions
		var width = window.innerWidth *0.55
			height = 500;

		//create new svg container for the map
		var map = d3.select("body")
			.append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height);

		//create Albers equal area conic projection centered on France
		var projection = d3.geoAlbers()
			.center([3.64, 39.05])
			.rotate([101.00, 0.00, 0])
			.parallels([45.00, 45.00])
			.scale(1083.84)
			.translate([width / 2, height / 2]);
		
		var path = d3.geoPath()
			.projection(projection);
			
			
		var promises = [];
		promises.push(d3.csv("data/field_of_first_major_UScounty_ACS_2017.csv")); //load attributes from csv
		promises.push(d3.json("data/main_states_counties.topojson")); //load spatial data
		Promise.all(promises).then(callback);
		
		function callback(data){
			countyData = data[0];
			countyGeo = data[1];
			
			setGraticule(map,path);
			
							
			//translate main_states_counties TopoJSON
			var county_bound = topojson.feature(countyGeo, countyGeo.objects.main_states_counties).features
		
			county_bound = joinData(county_bound, countyData);
			
			var colorScale = makeColorScale(countyData);
			
			setEnumerationUnits(county_bound, map, path, colorScale);
			
			//add coordinated visualization to map
			setChart(countyData, colorScale);
		};
		
	};
	
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
		
		return county_bound;
	};
	
	function setEnumerationUnits(county_bound, map, path, colorScale){
		//add counties
		var counties = map.selectAll(".counties")
			.data(county_bound)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "counties " + d.properties.GEOID;
			})
			.attr("d", path)
			.style("fill", function(d){
				var value = d.properties[expressed];
				if(value) {
					return colorScale(d.properties[expressed]);
				} else {
					return "#ccc";
				}
			});
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
		//chart frame dimensions
		var chartWidth = window.innerWidth * 0.38,
			chartHeight = 500;
			leftPadding = 550,
			rightPadding = 20,
			topBottomPadding = 0,
			translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
			
		//create a second svg element to hold the bar chart
		var chart = d3.select("body")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");
	   
	   	//create scale to proportionally size stuff	
		var yScale = d3.scaleLinear()
			.range([0, chartHeight])
			.domain([0, 100]);
		
		//set bars for each province
		var bars = chart.selectAll(".bars")
			.data(countyData)
			.enter()
			.append("rect")
			.sort(function(a,b){
				return a[expressed]-b[expressed]
			})
			.attr("class", function(d){
				return "bars " + d.Id2;
			})
			
			.attr("width", chartWidth / (countyData.length - 1))
			.attr("x", function(d, i){
				return i * (chartWidth / countyData.length);
			})
			.attr("height", function(d){
				return yScale(parseFloat(d[expressed]));
			})
			.attr("y", function(d){
				return chartHeight - yScale(parseFloat(d[expressed])) + topBottomPadding;
			})
			.style("fill", function(d){
				return colorScale(d[expressed]);
			});
		//create a text element for the chart title
		var chartTitle = chart.append("text")
			.attr("x", 5)
			.attr("y", 40)
			.attr("class", "chartTitle")
			.text(expressed + " Major by County");
		
		//create vertical axis generator
		var yAxis = d3.axisRight()
			.scale(yScale);

		//place axis
		var axis = chart.append("g")
			.attr("class", "axis")
			.attr("transform", translate)
			.call(yAxis);

		
	};	
			
	
})();


