const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const webpack = require('webpack');
const TsConfigPlugin = require('./TsConfigPlugin');

// declare global test timeout to 10s for async tests
jest.setTimeout(20 * 1000);

const runWithinWebpackContext = (callback, settings = {}) => {
	webpack({
		mode: settings.mode || 'development',
		entry: path.resolve(__dirname, 'fixtures/entry.ts'),
		target: 'node',
		node: {
			global: false,
		},
		output: {
			path: path.resolve(__dirname, 'fixtures/dist'),
			filename: 'bundle.js',
			libraryTarget: 'umd',
		},
		plugins: [new TsConfigPlugin(settings.pluginOptions)],
	}).run((_, stats) => {
		callback({
			_,
			stats,
			options: stats.compilation.options,
			errors: stats.compilation.errors,
		});
	});
};


afterEach(resolve => {
	jest.resetModules();
	rimraf(path.join(__dirname, 'fixtures/dist'), resolve);
});

describe('TsConfigPlugin', () => {
	it('should be creatable without options', () => {
		new TsConfigPlugin();
	});

	describe('options', () => {
		it('options should match the last options snapshot (dev)', resolve => {
			runWithinWebpackContext(({ options }) => {
				expect(options).toMatchSnapshot();
				resolve();
			});
		});

		// TODO: This test throws timeout error!
		it.skip('options should match the last options snapshot (prod)', resolve => {
			runWithinWebpackContext(({ options }) => {
				expect(options).toMatchSnapshot();
				resolve();
			});
		}, { mode: 'production' });
	})

	describe('runnable webpack context', () => {
		it('should finish without errors', () => {
			runWithinWebpackContext(({ errors }) => {
				expect(errors).toEqual([]);
			});
		});

		it('should set plugins correctly', resolve => {
			runWithinWebpackContext(({ options }) => {
				expect(options.plugins.length).toBe(1);
				expect(options.plugins[0] instanceof TsConfigPlugin).toBe(true);
				resolve();
			});
		});

		it('should set rules correctly', resolve => {
			runWithinWebpackContext(({ options }) => {
				expect(options.module.rules.length).toBe(1);
				expect(options.module.rules[0].test.test('entry.ts')).toBe(true);
				resolve();
			});
		});

		// TODO: This test throws cache-loader error!
		it.skip(
			'should generate correct output',
			() => {
				runWithinWebpackContext(() => {
					const bundlePath = path.resolve(__dirname, './fixtures/dist/bundle.js');
					const contents = fs.readFileSync(bundlePath).toString();
					expect(contents).toBeDefined();
				});
			},
			{ mode: 'production' }
		);
	});
});
