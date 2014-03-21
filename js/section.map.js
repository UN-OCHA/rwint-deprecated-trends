(function () {

  if (!window.sections) {
    window.sections = {};
  }

  window.sections.map = function (id) {
    function showLabel() {
      var target = d3.select(d3.event.target);
      if (target.classed('country')) {
        var data = target.datum().properties,
            name = data.name,
            iso3 = data.iso3,
            values = indexes.map(function (i) {
              return '<i class="icon-' + i + '"></i>' + formatter(stats[i].getValue(iso3));
            }).join('');

        label.style('display', 'block')
            .html('<span class="name">' + name + '</span>' + values);
      }
      else {
        hideLabel();
      }
    }

    function hideLabel() {
      label.style('display', 'none');
    }

    function moveLabel() {
      var position = d3.mouse(container.node()),
          x = position[0],
          y = position[1],
          w = parseInt(label.style('width')),
          right = (x > parseInt(container.style('width')) / 2);

      label.classed('left', right).classed('right', !right)
          .style({
            'top': (y - 16) + 'px',
            'left': (right ? x - 32 - w : x + 16) + 'px'
          });
    }

    function addYearSelector() {
      var control = layerControl.select('.top.right').append('div')
          .attr('class', 'control year selector');

      control.append('span')
          .html('Year ');

      control.append('select')
          .on('change', function () {
            loadData(parseInt(this.value));
          })
          .html(d3.range(startingYear, currentYear).reverse().map(function (year) {
            return '<option value="' + year + '">' + year + '</option>';
          }).join(''));
    }

    function addIndexSelector() {
      layerControl.select('.top.right').append('div')
          .attr('class', 'control index selector')
          .html(indexes.map(function(i) {
            var checked = (i === activeIndex ? ' checked="checked"' : '');
            return '<input type="radio" name="selection" id="selector-' + i + '" value="' + i + '" ' + checked + '/>' +
                   '<label for="selector-' + i + '"><i class="icon-' + i + '"></i>' + i + '</label>';
          }).join('<br/>'))
          .on('click', function() {
            var target = d3.event.target;
            if (target.name === 'selection') {
              activeIndex = target.value;
              updateMap(true);
            }
          });
    }

    function addLegend() {
      layerControl.select('.top.right').append('div')
          .attr('class', 'control legend');
    }

    function updateLegend(index) {
      var color = getCurrentStats().color,
          domain = color.domain().slice(0);

      if (!domain.length) {
        domain.unshift(1);
      }
      else if (domain[0] !== 1) {
        domain.unshift(0);
      }

      var html = domain.map(function (v, i) {
            var v2 = domain[i + 1];
            return '<i style="background:' + color(v) + '"></i>' +
                (!v2 ? (v < 10 ? v : v + 1) + '+' : (v + 1 === v2 ? v : v + 1 + '-' + v2));
          }).join('<br/>');

      layerControl.select('.control.legend').html(html);
    }

    function addZoom() {
      var control = layerControl.select('.top.left').append('div')
          .attr('class', 'control zoom');

      control.append('a')
          .attr('class', 'zoom-in')
          .html('+')
          .on('click', function () { handleZoom(2); });

      control.append('a')
          .attr('class', 'zoom-out')
          .html('-')
          .on('click', function () { handleZoom(0.5); });
    }

    function createZoom(bbox, width, height) {
      var matrix = [1, 0, 0, 1, 0, 0],
          ctm = svgContainer.node().getScreenCTM(),
          container = svgContainer.node(),
          w = d3.select(window),
          focus = d3.select('.focus').node();

      function resize() {
        ctm = svgContainer.node().getScreenCTM();
      }

      w.on({'resize': resize, 'scroll': resize});

      function convert(x, y, inverse) {
        var point = container.createSVGPoint();
        point.x = x; point.y = y;
        point = point.matrixTransform(inverse ? ctm.inverse() : ctm);
        return [point.x, point.y];
      }

      function mouse() {
        var event = d3.event;
        return convert(event.clientX, event.clientY, true);
      }

      function update(dx, dy, scale) {
        pan(dx, dy);
        zoom(scale);
        svg.attr('transform', 'matrix(' + matrix.join(' ') + ')');
      }

      function pan(dx, dy) {
        matrix[4] += dx ? width / 2 - dx : 0;
        matrix[5] += dy ? height / 2 - dy : 0;
      }

      function zoom(scale) {
        if (scale) {
          for (var i = 0, l = matrix.length; i < l; i++) {
            matrix[i] *= scale;
          }
          pan(scale * width / 2, scale * height / 2);
        }
      }

      svgContainer.on('dblclick', function () {
        var l = mouse();
        update(l[0], l[1], d3.event.shiftKey ? 0.5 : 2);
        d3.event.preventDefault();
      });

      svgContainer.on('mousedown', function () {
        var origin = mouse();

        function move() {
          var l = mouse();
          if (l[0] !== origin[0] || l[1] !== origin[1]) {
            update(width / 2 + origin[0] - l[0], height / 2 + origin[1] - l[1]);
            origin = l;
          }
          d3.event.preventDefault();
        }

        function stop() {
          w.on('mousemove', null).on('mouseup', null);
        }

        w.on('mousemove', move).on('mouseup', stop);
        d3.event.preventDefault();
      });

      var b = bbox,
          c = [(b[2] + b[0]) / 2, (b[3] + b[1]) / 2],
          s = 1 / Math.max((b[2] - b[0]) / width, (b[3] - b[1]) / height);

      update(c[0], c[1], s.toFixed(1));

      handleZoom = function (dx, dy, scale) {
        if (dx && dy) {
          scale *= matrix[0];
          matrix = [1, 0, 0, 1, 0, 0];
        }
        update(dx, dy, scale);
      };

      handleTranslate = function(dx, dy) {
        update(width / 2 - dx * matrix[0] / s, height / 2 - dy * matrix[0] / s);
      };
    }

    // Draw the map.
    function drawMap(world, boundaries) {
      // Add the countries.
      svg.append('g')
          .attr('class', 'countries')
        .selectAll('.country')
          .data(topojson.feature(world, world.objects.layer1).features)
        .enter().append('path')
          .attr('class', function (d) { return 'country ' + d.properties.iso3; })
          .attr('fill', '#fff')
          .attr('d', path);

      // Add the inner boundaries.
      d3.keys(boundaries.objects).forEach(function (k) {
        svg.append('path')
          .datum(topojson.feature(boundaries, boundaries.objects[k]))
          .attr('class', 'boundaries inner' + ['', ' dashed', ' dotted'][k])
          .attr('d', path);
      });

      // Add outer boundaries.
      svg.append('path')
        .datum(topojson.mesh(world, world.objects.layer1, function (a, b) { return a === b; }))
        .attr('class', 'boundaries outer')
        .attr('d', path);

      createZoom(world.bbox, width, height);

      addZoom();
      addYearSelector();
      addIndexSelector();
      addLegend();
    }

    // Update statistics object.
    function setStats(index, data, color) {
      var stat = stats[index] = {},
          countries = stat.countries = {},
          terms = data.data.facets.country.terms,
          max = 0,
          term, count, i, l;

      for (var i = 0, l = terms.length; i < l; i++) {
        term = terms[i];
        count = term.count;
        countries[term.term.toUpperCase()] = count;
        max = count > max ? count : max;
      }

      var domain = computeSteps(max, 6).filter(function (d) {
        return !isNaN(d);
      });

      stat.color = d3.scale.threshold()
          .domain(domain)
          .range(colorbrewer[color][7]);

      stat.getColor = function (iso3) {
        var value = this.getValue(iso3);
        return value ? this.color(value) : '#fff';
      };
      stat.getValue = function (iso3) {
        return this.countries[iso3] || 0;
      };
    }

    // Calculate 'count' thresholds from 'max' value.
    function computeSteps(max, count) {
      var magnitude = Math.floor(Math.log(max) / Math.LN10),
          stepHop = Math.pow(10, magnitude),
          stepMax = Math.floor(max / stepHop) * stepHop,
          divide = stepMax > 10,
          steps = [], i, l;

      steps.push(stepMax);
      for (i = 0, l = Math.min(count, stepMax) - 1; i < l; i++) {
        if (divide) {
          stepHop = stepMax <= stepHop ? stepHop / 10 : stepHop;
          stepMax = stepHop * Math.floor(stepMax / (2 * stepHop));
        }
        else {
          stepMax -= 1;
        }
        steps.push(stepMax >= 1 ? stepMax : 0);
      }
      return steps.reverse();
    }

    function getCurrentStats() {
      return stats[activeIndex];
    }

    // Update choropleth.
    function updateMap(transition) {
      var stat = getCurrentStats();

      svg.selectAll('.country')
          .transition()
          .duration(transition ? 500 : 0)
          .attr('fill', function (d) {
            return stat.getColor(d.properties.iso3);
          });

      updateLegend();
    }

    // Load the map data.
    function loadData(year, loadWorld) {
      var loader = queue();

      spinner.spin(container.node());

      loader
        .defer(d3.json, rwapi.reports(year))
        .defer(d3.json, rwapi.jobs(year))
        .defer(d3.json, rwapi.training(year))
        .defer(d3.json, rwapi.disasters(year))

      if (loadWorld) {
        loader
          .defer(d3.json, 'data/un.countries.mercator.topojson')
          .defer(d3.json, 'data/un.boundaries.mercator.topojson')
          .defer(d3.json, rwapi.countries());
      }

      loader.await(function (error, reports, jobs, training, disasters, world, boundaries, countries) {
        spinner.stop();

        if (error === null) {
          setStats('reports', reports, 'Reds');
          setStats('jobs', jobs, 'Blues');
          setStats('training', training, 'Oranges');
          setStats('disasters', disasters, 'Purples');

          if (world) {
            drawMap(world, boundaries);
          }

          updateMap(false);
        }
      });
    }

    /********
     * Main *
     ********/
    var width = 1000,
        height = 670,
        container = d3.select('#' + id),
        spinner = new Spinner(),
        formatter = d3.format(",.0f"),
        indexes = ['reports', 'jobs', 'training', 'disasters'],
        stats = {},
        activeIndex = indexes[0],
        startingYear = 1996,
        currentYear = new Date().getUTCFullYear(),
        handleZoom, handleTranslate;

    // Add layers.
    var layerMap = container.append('div').attr('class', 'layer-map'),
        layerMarker =  container.append('div').attr('class', 'layer-marker'),
        layerControl = container.append('div').attr('class', 'layer-control');

    layerControl.append('div').attr('class', 'top left');
    layerControl.append('div').attr('class', 'top right');
    layerControl.append('div').attr('class', 'bottom right');
    layerControl.append('div').attr('class', 'bottom left');

    // Label.
    var label = layerMarker.append('div')
        .style('display', 'none')
        .attr('class', 'label right');

    var path = d3.geo.path().projection(null);

    var svgContainer = layerMap.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', '0 0 ' + width + ' ' + height);

    var svg = svgContainer.append('g')
        .attr('transform', 'matrix(1 0 0 1 0 0)')
        .on('mousemove', moveLabel)
        .on('mouseover', showLabel)
        .on('mouseout', hideLabel);

    return {
      load: function () {
        // Load the data.
        loadData(currentYear - 1, true);
      }
    };
  };

})();
