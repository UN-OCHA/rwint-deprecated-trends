(function() {
  var rwapi = window.rwapi = {
    base: 'http://api.reliefweb.int/v1/',

    // Get the list of countries with name, shortname and iso3.
    countries: function(callback) {
      rwapi.post('countries', {
        limit: 300,
        fields: {
          include: ['name', 'shortname', 'iso3']
        }
      }, callback);
    },

    // Get report country, theme and disaster type stats for the given year.
    reports: function (year, callback) {
      rwapi.content('reports', callback, year, [{
        field: 'country.iso3.exact',
        name: 'country',
        limit: 300
      }, {
        field: 'theme.name.exact',
        name: 'theme',
        limit: 30
      }, {
        field: 'disaster_type.name.exact',
        name: 'disaster_type',
        limit: 30
      }]);
    },

    // Get training country and theme type stats for the given year.
    training: function (year, callback) {
      rwapi.content('training', callback, year, [{
        field: 'country.iso3.exact',
        name: 'country',
        limit: 300
      }, {
        field: 'theme.name.exact',
        name: 'theme',
        limit: 30
      }]);
    },

    // Get job country and theme stats for the given year.
    jobs: function (year, callback) {
      rwapi.content('jobs', callback, year, [{
        field: 'country.iso3.exact',
        name: 'country',
        limit: 300
      }, {
        field: 'theme.name.exact',
        name: 'theme',
        limit: 30
      }]);
    },

    // Get disaster country and type stats for the given year.
    disasters: function (year, callback) {
      rwapi.content('disasters', callback, year, [{
        field: 'country.iso3.exact',
        name: 'country',
        limit: 300
      }, {
        field: 'type.name.exact',
        name: 'type',
        limit: 30
      }]);
    },

    // Get stats for the resource.
    content: function(resource, callback, year, facets) {
      var data = {
        limit: 0,
        facets: facets
      };

      if (year) {
        data.filter = {
          field: 'date',
          value: {
            from: rwapi.yearToISO8601(year),
            to: rwapi.yearToISO8601(year + 1)
          }
        };
      }
      else {
        data.facets.push({field: 'date'});
      }

      rwapi.post(resource, data, callback);
    },

    // Serialize GET parameters.
    serialize: function (source, prefix) {
      var property, key, value, params = [];
      for (property in source) {
        if (source.hasOwnProperty(property)) {
          key = prefix ? prefix + "[" + encodeURIComponent(property) + "]" : property;
          value = source[property];
          params.push(typeof value === "object" ?
            this.serialize(value, key) :
            key + "=" + encodeURIComponent(value));
        }
      }
      return params.join("&").replace('%20', '+');
    },

    // Extend an object.
    extend: function (target) {
      var sources = Array.prototype.slice.call(arguments, 1),
          i, l, property, source;
      for (i = 0, l = sources.length; i < l; i++) {
        source = sources[i] || {};
        for (property in source) {
          if (source.hasOwnProperty(property)) {
            target[property] = source[property];
          }
        }
      }
      return target;
    },

    // Query the API with POST method.
    post: function (resource, data, callback) {
      data.preset = 'analysis';

      d3.xhr(rwapi.base + resource).post(JSON.stringify(data), function (error, xhr) {
        callback(error, error ? null : JSON.parse(xhr.responseText));
      });
    },

    // Query the API to get the total count for a resource.
    count: function (resource, callback) {
      rwapi.post(resource, {limit: 0}, function (error, data) {
        callback(error, error ? null : data.totalCount);
      });
    },

    // Get the number of resource items per year.
    countByYears: function (resource, callback) {
      rwapi.post(resource, {limit: 0, facets: [{field: 'date'}]}, function (error, data) {
        if (!error) {
          var facet = data.embedded.facets.date,
              results = {};

          facet.data.forEach(function (item) {
            results[item.value.substr(0, 4)] = item.count;
          });

          callback(null, {total: data.totalCount, data: results});
        }
        else {
          callback(error, null);
        }
      });
    },

    // Get various stats by year for the given resource.
    statsByYears: function (resource, categories, callback) {
      var startingYear = 1996,
          currentYear = new Date().getUTCFullYear(),
          year, from, to, category, i, l, facets = [];

      // Build the list of facets foreach category and year.
      for (i = 0, l = categories.length; i < l; i++) {
        category = categories[i];

        for (year = 1996; year < currentYear; year++) {
          from = rwapi.yearToISO8601(year);
          to =rwapi.yearToISO8601(year + 1);

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

      var data = {
        limit: 0,
        facets: facets
      }

      rwapi.post('reports', data, callback);
    },

    // Convert a year to ISO 8601 date format.
    yearToISO8601: function (year) {
      return '' + year + '-01-01T00:00:00+00:00';
    },

    // Convert a date object to ISO 8601 date format.
    dateToISO8601: function (date) {
      return this.getUTCFullYear()
        + '-' + pad(this.getUTCMonth() + 1)
        + '-' + pad(this.getUTCDate())
        + 'T' + pad(this.getUTCHours())
        + ':' + pad(this.getUTCMinutes())
        + ':' + pad(this.getUTCSeconds())
        + '+00:00';
    }
  };
})();
