(function () {
  var rwsetting = window.rwsettings = {
    // Globals.
    startingDate: 1996,

    // Reports Overview Section.
    'overview-updates': {
      label: 'Updates Overview',
      resource: 'reports',
      categories: {
        'theme': {
          label: 'Themes',
          description: 'Number of reports tagged with a theme according to the ReliefWeb taxonomy. Some themes, such as Gender, Climate Change or Humanitarian Financing were added to the ReliefWeb taxonomy in 2011. While some reports have been tagged retrospectively, trends are more reliable from 2011 onwards. The figures do not indicate the total number of reports published by ReliefWeb since a report can be tagged with multiple themes. For description of the ReliefWeb themes please see: <a href="http://reliefweb.int/book/taxonomy-descriptions#theme">Taxonomy description - Themes</a>.'
        },
        'disaster_type': {
          label: 'Disater Types',
          description: 'Number of reports tagged with a disaster type according to RW taxonomy. The numbers do not indicate the total number of reports published by ReliefWeb since one report can be tagged with multiple themes. For description of the ReliefWeb disaster types please see: <a href="http://reliefweb.int/book/taxonomy-descriptions#disastertype">Taxonomy description - Disaster Types</a>'
        },
        'vulnerable_groups': {
          label: 'Vulnerable Groups',
          description: 'Number of reports tagged with a vulnerable groups according to RW taxonomy.  The numbers do not indicate the total number of reports published by ReliefWeb since one report can be tagged with multiple vulnerable groups. For description of the ReliefWeb vulnerable groups please see: <a href="http://reliefweb.int/book/taxonomy-descriptions#groups">Taxonomy description - Vulnerable Groups</a>'
        },
        'source.type': {
          label: 'Organization Types',
          description: 'Source type is the generic grouping for organizations used by ReliefWeb.  The numbers do not indicate the total number of reports published by ReliefWeb since one report can be tagged with multiple sources and thus include more than 1 source type. For description of the ReliefWeb organization types please see: <a href="http://reliefweb.int/book/taxonomy-descriptions#orgtype">Taxonomy description - Organization Types</a>'
        }
      }
    },

    // Get section's resource.
    getSectionLabel: function(section) {
      return this[section] ? this[section].label || '' : '';
    },

    // Get section's resource.
    getSectionResource: function(section) {
      return this[section] ? this[section].resource || '' : '';
    },

    // Get section's categories.
    getSectionCategories: function(section) {
      var categories = [];

      if (this[section] && this[section].categories) {
        var data = this[section].categories;
        for (var property in data) {
          if (data.hasOwnProperty(property)) {
            categories.push(property);
          }
        }
      }
      return categories;
    },

    // Get category's label.
    getCategoryLabel: function(section, category) {
      if (this[section] && this[section].categories && this[section].categories[category]) {
        return this[section].categories[category].label || '';
      }
      return '';
    },

    // Get category's description.
    getCategoryDescription: function(section, category) {
      if (this[section] && this[section].categories && this[section].categories[category]) {
        return this[section].categories[category].description || '';
      }
      return '';
    }
  };
})();
