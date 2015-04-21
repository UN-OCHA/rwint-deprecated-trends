if (!window.ExportData) {
  window.ExportData = {
    mimetypes: {
      'csv': 'text/csv'
    },

    quote: function (data) {
      if (typeof data === 'string' && (data.indexOf(',') !== -1 || data.indexOf('"') !== -1)) {
        return '"' + data.replace('"', '""') + '"';
      }
      return data;
    },

    export: function (name, data) {
      var csv = [], type = 'csv';

      for (var r = 0, rl = data.length; r < rl; r++) {
        var row = data[r].slice();

        for (var c = 0, cl = row.length; c < cl; c++) {
          row[c] = this.quote(row[c]);
        }
        csv.push(row.join(','));
      }

      var filename = name.toLowerCase().replace(/\s+/, '-') + '.' + type;
      saveAs(new Blob([csv.join("\n")], {type:this.mimetypes[type] + ';charset=utf-8'}), filename);
    }
  }
}
