//griffin rock 3/31/2020

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
	//map frame dimensions
    var width = 960,
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
			
		//translate main_states_counties TopoJSON
        var county_bound = topojson.feature(countyGeo, countyGeo.objects.main_states_counties).features
        
				
		var counties = map.selectAll(".counties")
            .data(county_bound)
            .enter()
            .append("path")
			.attr("class", function(d){
                return "counties " + d.properties.GEOID;
            })
            .attr("d", path);
					
    };
	
};
