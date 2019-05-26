import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-only';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import vue from 'rollup-plugin-vue';

export default {
  input: 'src/main.ts',
  output:
    [
      { file: 'dist/vue-query-builder.common.js', format: 'cjs' },
      { file: 'dist/vue-query-builder.esm.js', format: 'esm' }
    ],
  external: ['vue'],
  plugins:
    [
      typescript({ module: 'es2015' }),
      resolve(),
      alias({
        resolve: ['.vue', '.json'],
        '@': __dirname + '/src',
      }),
      commonjs({ namedExports: { 'node_modules/mathjs/index.js': ['parse'] } }),
      css({ output: 'dist/vue-query-builder.css' }),
      vue({ css: false }),
      json(),
    ]
}
