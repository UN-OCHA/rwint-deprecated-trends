(function () {

  if (!window.sections) {
    window.sections = {};
  }

  window.sections.details = function (id) {
    var categories = ['theme', 'disaster_type', 'vulnerable_groups', 'source.type'],
        startingYear = 1996,
        currentYear = new Date().getUTCFullYear(),
        year, from, to, category, i, l, facets = [];

    for (i = 0, l = categories.length; i < l; i++) {
      category = categories[i];

      for (year = 1996; year < currentYear; year++) {
        from = Date.UTC(year, 0, 1, 0, 0, 0, 0);
        to = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0);

        facets.push({
          field: category + '.name.exact',
          name: category + '-' + year,
          limit: 30,
          filter: {
            field: 'date',
            value: {
              from: from,
              to: to
            }
          }
        });
      }
    }

    var params = {
      limit: 0,
      nodefault: true,
      filter: {
        field: 'status',
        value: ['to-review', 'published'],
        operator: 'OR'
      },
      facets: facets
    }

    var url = 'http://api.rwlabs.org/v0/report/list';

    d3.xhr(url).post(JSON.stringify(params), function(error, xhr) {
      var data = JSON.parse(xhr.responseText);

      // Parse data.
      var facets = data.data.facets,
          category, term, name, count, i, j, l, m,
          dataset, datasets = {};

      for (i = 0, l = categories.length; i < l; i++) {
        category = categories[i];
        dataset = datasets[category] = {max: 0, totalYear: 0};

        for (year = currentYear - 10; year < currentYear; year++) {
          totalYear = 0;

          if (facets[category + '-' + year]) {
            terms = facets[category + '-' + year].terms;

            for (j = 0, m = terms.length; j < m; j++) {
              term = terms[j];
              name = term.term;
              count = term.count;
              dataset[name] = dataset[name] || {name: name, total: 0, data: []};
              dataset[name].data.push([year, count]);
              dataset[name].total += count;
              dataset.max = count > dataset.max ? count : dataset.max;
              totalYear += count;
            }
          }

          dataset.totalYear = totalYear > dataset.totalYear ? totalYear : dataset.totalYear;
        }
      }

      for (property in datasets) {
        if (datasets.hasOwnProperty(property)) {
          drawData(property, datasets[property]);
          drawBarChart(property, datasets[property]);
        }
      }
    });


    function drawData(property, dataset) {
      var margin = {
            top: 20,
            right: 220,
            bottom: 0,
            left: 20
          },
        width = 300,
        offset = 20;

      height = d3.keys(dataset).length * offset;

      var startYear = currentYear - 10,
          endYear = currentYear - 1;

      var c = d3.scale.category20c();

      var xScale = d3.scale.linear()
        .domain([startYear, endYear])
        .range([0, width]);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('top')
        .tickFormat(d3.format('0000'));

      var item, j = 0;

      var container = d3.select('#' + id).append('div')
          .attr('class', 'group circle');

      container.append('h4').html(property.replace(/[_\.]/g, ' ').replace(/s*$/, 's') + ' <em>(past 10 years)</em>');

      var svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('margin-left', margin.left + 'px')
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + 0 + ')')
        .call(xAxis);

      function m(max, precision) {
        var magnitude = Math.floor(Math.log(max) / Math.LN10),
            stepHop = Math.pow(10, magnitude),
            stepMax = (max / stepHop).toFixed(precision || 0) * stepHop;
        return stepMax;
      }

      for (property in dataset) {
        if (dataset.hasOwnProperty(property) && property !== 'max' && property !== 'totalYear') {
          item = dataset[property];

          var g = svg.append('g').attr('class', 'category')
              .on('mouseover', mouseover)
              .on('mouseout', mouseout);

          var circles = g.selectAll('circle')
            .data(item.data)
            .enter()
            .append('circle');

          var text = g.selectAll('text')
            .data(item.data)
            .enter()
            .append('text');

          var domain = item.data.map(function (d) {
            return m(d[1], 1);
          });

          var rScale = d3.scale.quantile()
              .domain(domain)
              .range(d3.range(3, offset / 2));

          circles
            .attr('cx', function (d, i) {
              return xScale(d[0]);
            })
            .attr('cy', j * offset + 20)
            .attr('r', function (d) {
              return rScale(d[1]);
            })
            .style('fill', function (d) {
              return c(j);
            });

          text
            .attr('y', j * offset + 25)
            .attr('x', function (d, i) {
              return xScale(d[0]) - 5;
            })
            .attr('class', 'value')
            .text(function (d) {
              return d[1];
            })
            .style('fill', function (d) {
              return c(j);
            })
            .style('display', 'none');

          g.append('text')
            .attr('y', j * offset + 25)
            .attr('x', width + 30)
            .attr('class', 'label')
            .text(truncate(item.name, 50, '...'))
            .style('fill', function (d) {
              return c(j);
            });

          j++;
        }
      }
    }

    function createSlider(container, width, domain, callback) {
      var height = 60;
      var xScale = d3.scale.linear()
        .domain(domain)
        .range([0, width])
        .clamp(true);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('top')
        .tickFormat(d3.format('0000'))
        .tickSize(0)
        .tickPadding(12);

      var brush = d3.svg.brush()
          .x(xScale)
          .extent([0, 0])
          .on("brush", brushed);

      var svg = container.append('svg')
          .attr('class', 'slider-container')
          .attr('width', width + 40)
          .attr('height', height)
        .append('g')
          .attr('transform', 'translate(20,0)');

      svg.append("g")
          .attr("class", "slider-axis")
          .attr("transform", "translate(0," + height / 2 + ")")
          .call(xAxis)
        .select(".domain")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
          .attr("class", "halo");

      var slider = svg.append("g")
          .attr("class", "slider")
          .call(brush);

      slider.selectAll(".extent,.resize")
          .remove();

      slider.select(".background")
          .attr("height", height)
          .style('cursor', 'default');

      var handle = slider.append("circle")
          .attr("class", "handle")
          .attr("transform", "translate(0," + height / 2 + ")")
          .attr("cx", xScale(domain[1]))
          .attr("r", 9);

      function brushed() {
        if (d3.event.sourceEvent) {
          var value = Math.round(xScale.invert(d3.mouse(this)[0]));
          brush.extent([value, value]);
          handle.attr("cx", xScale(value));
          callback(value);
        }
      }
    }

    function drawBarChart(property, dataset) {
      var width = 320,
          barHeight = 20;

      var years = d3.range(startingYear, currentYear);

      var data = d3.keys(dataset).filter(function (k) {
        return k !== 'max' && k !== 'totalYear';
      }).map(function (k) {
        var category = dataset[k];
            data = category.data,
            values = {};
        years.forEach(function (year) {
          for (var i = 0, l = data.length; i < l; i++) {
            var d = data[i];
            if (d[0] === year) {
              values[year] = d[1];
              break;
            }
          }
        });
        return {
          name: category.name,
          data: values
        };
      });

      var height = barHeight * data.length;

      var c = d3.scale.category20c();

      var x = d3.scale.linear()
          .domain([0, dataset.max])
          .range([0, width]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom')
          .tickFormat(d3.format('.2s'));

      function update(year) {
        chart.selectAll('.bar rect')
            .transition()
            .duration(500)
            .attr("width", function(d) { return x(d.data[year] || 0); });
        chart.selectAll('.bar .number')
            .transition()
            .duration(500)
            .attr("x", function(d) { return x(d.data[year] || 0); })
            .text(function(d) { return d.data[year] || 0; });
      }

      var group = d3.select('#' + id).append('div')
          .attr('class', 'group chart');

      var title = group.append('h4')
          .html(property.replace(/[_\.]/g, ' ').replace(/s*$/, 's') + ' <em>(per year)</em>');

      createSlider(group, width, [currentYear - 10, currentYear - 1], update);

      var year = currentYear - 1;

      var chart = group.append('svg')
          .attr({
            'width': width + 200 + 40,
            'height': barHeight * data.length + 50
          })
        .append('g')
          .attr('transform', 'translate(0,' + 31 + ')');

      var bar = chart.selectAll("g")
          .data(data)
        .enter().append("g")
          .attr('class', 'bar')
          .attr("transform", function(d, i) { return "translate(" + 200 + "," + i * barHeight + ")"; });

      bar.append("rect")
          .attr("width", function(d) { return x(d.data[year] || 0); })
          .attr("height", barHeight - 1)
          .attr('fill', function (d, i) { return c(i); });

      bar.append("text")
          .attr('class', 'number')
          .attr("x", function(d) { return x(d.data[year] || 0); })
          .attr("y", barHeight / 2)
          .attr("dy", ".35em")
          .attr("dx", "3")
          .text(function(d) { return d.data[year] || 0; });

      bar.append("text")
          .attr('class', 'category')
          .attr("x", -6)
          .attr("y", barHeight / 2)
          .attr("dy", ".35em")
          .attr('fill', function (d, i) { return c(i); })
          .text(function(d) { return d.name; });

      chart.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(" + 200 + "," + barHeight * data.length + ")")
          .call(xAxis);
    }

    function truncate(str, maxLength, suffix) {
      if (str.length > maxLength) {
        str = str.substring(0, maxLength + 1);
        str = str.substring(0, Math.min(str.length, str.lastIndexOf(' ')));
        str = str + suffix;
      }
      return str;
    }

    function mouseover(p) {
      var g = d3.select(this);
      g.selectAll('circle').style('display', 'none');
      g.selectAll('text.value').style('display', 'block');
    }

    function mouseout(p) {
      var g = d3.select(this);
      g.selectAll('circle').style('display', 'block');
      g.selectAll('text.value').style('display', 'none');
    }

    return {
      load: function () {
      }
    }
  };

})();
