(function () {

  if (!window.sections) {
    window.sections = {};
  }

  window.sections.intro = function (id) {

    function drawGraph(index, data) {
      var width = 200,
          height = 100,
          margin = {
            left: 35,
            right: 15,
            top: 15,
            bottom: 35
          };

      var group = container.append('div')
          .attr('class', 'group');

      var total = group.append('div')
          .attr('class', 'total ' + index)
          .html('<i class="icon-' + index + '"></i>' +
                '<strong>' + formatter(data.total) + '</strong> ' + index);

      var graph = group.append('div')
          .attr('class', 'graph ' + index)
          .style({
            'width': (width + margin.left + margin.right) + 'px',
            'height': (height + margin.top + margin.bottom) + 'px'
          });

      var svg = graph.append('svg')
          .attr('width', '100%')
          .attr('height', '100%')
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' +  margin.top + ')');

      var x = d3.time.scale()
          .range([0, width]);

      var y = d3.scale.linear()
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .tickFormat(d3.format('0000'));

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .tickFormat(d3.format('.1s'))
          .ticks(5)
          .outerTickSize(0);

      var line = d3.svg.line()
          .interpolate("basis")
          .x(function(d) { return x(d.year); })
          .y(function(d) { return y(d.count); });

      var years = d3.range(startingYear, currentYear + 1);

      var count = 0;
      var values = years.map(function (year) {
        count += data.data[year] || 0;
        return {
          year: year,
          count: count
        }
      });

      x.domain(d3.extent(years));
      y.domain([0, d3.max(values, function (d) {
          return d.count;
      })]);

      svg.selectAll("grid")
          .data(y.ticks(4))
        .enter().append("line")
          .attr({
              "class": "grid",
              "x1" : 0,
              "x2" : width + margin.right,
              "y1" : function(d) { return y(d); },
              "y2" : function(d) { return y(d); },
              "fill" : "none",
              "shape-rendering" : "crispEdges",
              "stroke" : "#eee",
              "stroke-width" : "1px"
          });

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", 'rotate(-45)');

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .attr("fill", "#333")
          .style({
            "text-anchor": "end",
            "font-size": "8px"
          })
          .text("# Posted");

      var index = svg.append("path")
          .datum(values)
          .attr("class", "line " + index)
          .attr("d", line);
    }

    // Load global data.
    function loadData() {
      spinner.spin(container.node());

      queue()
          .defer(rwapi.countByYears, 'reports')
          .defer(rwapi.countByYears, 'jobs')
          .defer(rwapi.countByYears, 'training')
          .defer(rwapi.countByYears, 'disasters')
          .await(function (error, reports, jobs, training, disasters) {
            spinner.stop();

            if (!error) {
              drawGraph('reports', reports);
              drawGraph('jobs', jobs);
              drawGraph('training', training);
              drawGraph('disasters', disasters);
            }
          });
    }

    var container = d3.select('#' + id + ' .data'),
        spinner = new Spinner(),
        startingYear = 1996,
        currentYear = new Date().getUTCFullYear(),
        width = 500,
        height = 200,
        formatter = d3.format(",.0f"),
        indexes = ['reports', 'jobs', 'training', 'disasters'];

    return {
      load: function () {
        loadData();
      }
    };
  };

})();
