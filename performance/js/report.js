function performanceReport() {
	var cost = performance.timing.loadEventEnd - performance.timing.fetchStart;
	console.log(performance.timing.loadEventEnd);
	console.log(performance.timing.fetchStart);
	console.log('resource_load_time_cost:' + cost);
}
