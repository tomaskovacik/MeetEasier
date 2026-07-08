const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// react-scripts@1.1.4 ships webpack 3 with webpack.optimize.UglifyJsPlugin,
// which is built on uglify-js and only parses ES5. Modern npm packages
// (e.g. engine.io-client) ship ES6+ syntax and fail to minify. Swap in
// uglifyjs-webpack-plugin, which is built on uglify-es and understands ES6+.
module.exports = function override(config, env) {
  if (env !== 'production') {
    return config;
  }

  const uglifyIndex = config.plugins.findIndex(
    (plugin) => plugin instanceof webpack.optimize.UglifyJsPlugin
  );

  if (uglifyIndex !== -1) {
    const original = config.plugins[uglifyIndex];
    config.plugins[uglifyIndex] = new UglifyJsPlugin({
      uglifyOptions: {
        compress: original.options.compress,
        mangle: original.options.mangle,
        output: original.options.output,
      },
      sourceMap: !!original.options.sourceMap,
    });
  }

  return config;
};
