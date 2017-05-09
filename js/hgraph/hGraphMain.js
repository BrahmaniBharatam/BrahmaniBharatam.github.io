var graph, transitionTime, transitionDelayTime;
var usermenu, userinfo;

var fixedHeight = 350;
var fixedWeight = 500;

var updateBarGraph;

function resize(){
	graph.width = fixedWeight; 
	graph.height = fixedHeight - 10; 
	graph.redraw();

	if(!graph.isZoomedIn()) {
		usermenu.find('.user').each(function(){
			$(this).center();
		});
	}

	var usertimeline = $('#user-timeline');
	usertimeline.css({ left : (userinfo.width() - usertimeline.width()) / 2  });
}

$.fn.center = function () {
  
    return this;
}

var renderParallelGraph = function(stateName){
    d3.csv("data/parallel/nutrients.csv", function(raw_data) {
        // Convert quantitative scales to floats
        data = raw_data.map(function(d) {
            for (var k in d) {
                if (!_.isNaN(raw_data[0][k] - 0) && k != 'id') {
                    d[k] = parseFloat(d[k]) || 0;
                }
            };
            return d;
        });

        for(var i=0; i<data.length; i++) {
            if(stateName === data[i].name) {
                unhighlight();
                highlight(data[i]);
                return;
            }
        }
    });
    
}


function renderHgraph(data){

    function initGraph(data) {
      
        var opts = {
          
            container: $("#viz").get(0),
            userdata: {
                hoverevents : true,
                factors: data
            },
          
            scaleFactors: {
                labels : { lower : 6, higher : 1.5},
                nolabels : { lower : 3, higher : 1}
            },
          
            zoomFactor : 2,

          
            zoominFunction : mu.users.hide,
          
            zoomoutFunction : mu.users.show,
          
            zoomable : true,
            showLabels : true
        };
        graph = new HGraph(opts);

      
        var container = $('#viz');

        graph.width = fixedWeight;
        graph.height = fixedHeight - 10;

        graph.initialize();
    }

  
    if(graph) {
        d3.select('#viz svg').transition().duration(0+0).style('opacity',0)
        .each("end", function() { 
            d3.select(this).remove();
            initGraph(data);
            d3.select('#viz svg').style('opacity',0);
            d3.select('#viz svg').transition().delay(0+0).duration(0).style('opacity',1);
        });
    } 
  
    else {
        initGraph(data);
    }
};


$(document).ready(function (){

    // Bar Graph Starts

    var marginBar = {top: 20, right: 40, bottom: 20, left: 40},
        widthBar = 450 - marginBar.left - marginBar.right,
        heightBar = 280 - marginBar.top - marginBar.bottom;

    var svgBar = d3.select(".bargraph").append("svg")
        .attr("width", widthBar + marginBar.left + marginBar.right)
        .attr("height", heightBar + marginBar.top + marginBar.bottom + 120)
        .append("g")
        .attr("transform", "translate(" + marginBar.left + "," + marginBar.top + ")");

    var yAxis, xAxis, x, y;

    var barData;

    updateBarGraph = function(stateName){
        y.domain([0, d3.max(barData, function(d){
            return +d[stateName];
        })]);

        yAxis.scale(y);

        d3.selectAll(".rectangle")
            .transition()
            .attr("height", function(d){
                return heightBar - y(+d[stateName]);
            })
            .attr("x", function(d, i){
                return (widthBar / barData.length) * i ;
            })
            .attr("y", function(d){
                return y(+d[stateName]);
            })
            .ease("linear")
            .select("title")
            .text(function(d){
                return d.State + " : " + d[stateName];
            });

        d3.selectAll("g.y.axis")
            .transition()
            .call(yAxis);
    }

    d3.csv("data/bargraph/data.csv", function(error, data){

        barData = data;

        // Get every column value
        var elements = Object.keys(data[0])
            .filter(function(d){
                return ((d != "State"));
            });
        var selection = elements[0];

        y = d3.scale.linear()
            .domain([0, d3.max(data, function(d){
                return +d[selection];
            })])
            .range([heightBar, 0]);

        x = d3.scale.ordinal()
            .domain(data.map(function(d){ return d.State;}))
            .rangeBands([0, widthBar]);


        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        svgBar.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + heightBar + ")")
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "8px")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-90)" );


        svgBar.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svgBar.selectAll("rectangle")
            .data(data)
            .enter()
            .append("rect")
            .attr("class","rectangle")
            .attr("width", widthBar/data.length)
            .attr("height", function(d){
                return heightBar - y(+d[selection]);
            })
            .attr("x", function(d, i){
                return (widthBar / data.length) * i ;
            })
            .attr("y", function(d){
                return y(+d[selection]);
            })
            .append("title")
            .text(function(d){
                return d.State + " : " + d[selection];
            });

        var selector = d3.select("#drop")
            .append("select")
            .attr("id","dropdown")
            .on("change", function(d){
                selection = document.getElementById("dropdown");

                updateBarGraph(selection.value);

            });

        selector.selectAll("option")
            .data(elements)
            .enter().append("option")
            .attr("value", function(d){
                return d;
            })
            .text(function(d){
                return d;
            })


    });


    // Bar Graph Ends








    //Creates tooltip and makes it invisiblae
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //Sets dimensions
    var margin = {top: 100, left: 0, bottom: 100, right: 0}
        , widthCp = 500
        , widthCp = widthCp - margin.left - margin.right
        , mapRatio = .5
        , heightCp = widthCp * mapRatio;

    //Tells the nap what projection to use
    var projection = d3.geo.albersUsa()
        .scale(widthCp)
        .translate([widthCp / 2, heightCp / 2]);

    //Tells the map how to draw the paths from the projection
    var path = d3.geo.path()
        .projection(projection);

    //Appened svg to page
    var map = d3.select(".g-chart").append("svg")
        .style('height', heightCp + 'px')
        .style('width', widthCp + 'px');

    //Load the files
    queue()
        .defer(d3.json, "data/chloropleth/us.json")
        .defer(d3.csv, "data/chloropleth/maptemplate.csv")
        .await(ready);

    //Moves selection to front
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    //Moves selection to back
    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    function ready(error, us, maptemplate) {
        if (error) throw error;

        //Sets color scale
        var numMedian = d3.median(maptemplate, function(d) { return d.num;});
        var quantize = d3.scale.quantize()
            .domain([0, numMedian])
            .range(d3.range(5).map(function(i) { return "q" + i + "-9"; }));

        //Pair data with state id
        var dataByFIPS = {};
        maptemplate.forEach(function(d) { dataByFIPS[d.FIPS] = +d.num; });

        //Pair state name with state id
        var stateByFIPS = {};
        maptemplate.forEach(function(d) { stateByFIPS[d.FIPS] = d.state; });

        //Appends chart headline
        d3.select(".g-hed").text("State Ranking Based on Health Status");

        //Appends chart intro text
        d3.select(".g-intro").text("");

        //Append states
        map.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("d", path)
            //Color states
            .attr("class", function(d) { return quantize(dataByFIPS[d.id]); })
            //Hovers
            .on("mouseover", function(d) {

                var sel = d3.select(this);
                sel.moveToFront();
                d3.select(this).transition().duration(300).style("opacity", 0.8);
                div.transition().duration(300)
                    .style("opacity", 1)
                div.text(stateByFIPS[d.id] + ": " + dataByFIPS[d.id])
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY -30) + "px");
            })
            .on("click", function(d) {
                // console.log(stateByFIPS[d.id]);

                // chloropleth state click

                // update parallel graph
                renderParallelGraph(stateByFIPS[d.id]);

                // hgraph
                mu.users.loadHGraph(stateByFIPS[d.id]);

                // bar graph
                updateBarGraph(stateByFIPS[d.id]);
            })
            .on("mouseout", function() {
                var sel = d3.select(this);
                sel.moveToBack();
                d3.select(this)
                    .transition().duration(300)
                    .style("opacity", 1);
                div.transition().duration(300)
                    .style("opacity", 0);
            });

        //Appends chart source
        d3.select(".g-source-bold")
            .text("SOURCE: ")
            .attr("class", "g-source-bold");

        d3.select(".g-source-reg")
            .text("Chart source info goes here")
            .attr("class", "g-source-reg");

        //RESPONSIVENESS
        d3.select(window).on('resize', resize);

        function resize() {

            var w = 500;
            console.log("resized", w);

            // adjust things when the window size changes
            widthCp = w - margin.left - margin.right;
            heightCp = widthCp * mapRatio;

            // update projection
            var newProjection = d3.geo.albersUsa()
                .scale(widthCp)
                .translate([widthCp / 2, heightCp / 2]);

            //Update path
            path = d3.geo.path()
                .projection(newProjection);

            // resize the map container
            map
                .style('width', widthCp + 'px')
                .style('height', heightCp + 'px');

            // resize the map
            map.selectAll("path").attr('d', path);
        }
    }


    var container = $('#viz');
        minHeight = parseInt(container.css('min-height')),
        minWidth = parseInt(container.css('min-width'));

    d3.json("data/hgraph/metrics.json", function(error, metrics) {
        if (error) return;

        usermenu = $('#user-selection');
        userinfo = $('#user-info');


        mu.data.initialize(metrics);
        mu.users.initialize({ usermenu : usermenu, userinfo : userinfo});

    });

});