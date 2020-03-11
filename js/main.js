//griffin rock 3/11/2020
//execute script when window is loaded
window.onload = function(){


    //SVG dimension variables
    var w = 900, h = 500;


    //Example 1.2 line 1...container block
    var container = d3.select("body") //get the <body> element from the DOM
       .append("svg") //put a new svg in the body
       .attr("width", w) //assign the width
       .attr("height", h) //assign the height
       .attr("class", "container") //always assign a class (as the block name) for styling and future selection
       .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!

    var innerRect = container.append("rect") //add a <rect> element
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
    // <rect> is now the operand of the container block
};
