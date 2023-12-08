import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import dotenvPlugin from 'rollup-plugin-dotenv';

// https://stenciljs.com/docs/config

export const config: Config = {
	globalStyle: 'src/global/app.scss',
	globalScript: 'src/global/app.ts',
	taskQueue: 'async',
	namespace: 'web-scraper-helper',
	plugins: [
		dotenvPlugin(),
		sass({
			includePaths: ['./node_modules'],
		}),
	],
	outputTargets: [
		{
			type: 'www',
			// comment the following line to disable service workers in production
			serviceWorker: null,
			baseUrl: 'https://myapp.local/',
		},
	],
};
