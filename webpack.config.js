module.exports = {
  cache: true,

  watch: true,

  entry: {
    'app': ['./js/app.js']
  },

  output: {
    filename: '[name].js'
  },

  module: {
    loaders: [
    ]
  },

  resolve: {
    root: __dirname
  }
};