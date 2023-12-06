import * as amplitude from '@amplitude/analytics-browser';

export function initializeAmplitude() {
	let amplitudeKey = null;
	try {
		amplitudeKey = process.env.AMPLITUDE_KEY;
		amplitude.init(amplitudeKey, { defaultTracking: false });
	} catch (e) {}
	console.log(amplitudeKey);
}

export function logEvent(name: string, payload = {}) {
	amplitude.track(name, payload);
}
