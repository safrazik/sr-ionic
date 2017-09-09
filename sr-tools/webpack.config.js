var path = require('path');

module.exports = {
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // modules: [path.resolve('node_modules')],
    alias: {
         "models/base": path.resolve(__dirname, "../src/models/base/index"),
         "models": path.resolve(__dirname, "../src/models/index"),
         "sackets": path.resolve(__dirname, "../src/sackets/src/lib/index"),
         // "loki-indexed-adapter": path.resolve(__dirname, "node_modules/lokijs/src/loki-indexed-adapter"),
    }
  },
};