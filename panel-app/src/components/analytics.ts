import * as amplitude from '@amplitude/analytics-browser';
import { formatState } from './store';
import { PayloadForFileSave } from './types';

export function initializeAmplitude() {
	let amplitudeKey = null;
	try {
		amplitudeKey = process.env.AMPLITUDE_KEY;
		amplitude.init(amplitudeKey, {
			// logLevel: amplitude.Types.LogLevel.Debug,
			transport: 'beacon',
			defaultTracking: {
				attribution: false,
				pageViews: false,
				sessions: true,
				formInteractions: false,
				fileDownloads: false,
			},
			identityStorage: 'localStorage',
			trackingOptions: {
				ipAddress: false,
			},
		});
	} catch (e) { }
}

export function logEvent(name: string, payload = {}) {
	amplitude.track(name, payload);
}

export function getScraperConfigMetrics() {
	let payload: PayloadForFileSave = { for: 0, exclude: 0, metadata: 0, subItems: 0, excludeSelectors: [], name: 0 };
	let formattedState = formatState();
	formattedState.forEach((i) => {
		Object.keys(i).forEach((key) => {
			let values = i[key];
			if (typeof values === 'object') {
				values = Object.values(values);
			}
			if (!(values instanceof Array)) {
				values = [values];
			}
			payload[key] = (payload[key] || 0) + (values || []).length;

			const excludeSelectors = payload.excludeSelectors || [];
			if (key === 'exclude') {
				values.forEach((v) => {
					excludeSelectors.push(`[${v.type}] ${v.path}`);
				});
			}
			payload.excludeSelectors = excludeSelectors;
		});
	});

	return payload;
}
