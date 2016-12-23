function performanceReport() {
	var cost = performance.timing.loadEventEnd - performance.timing.fetchStart;
	console.log('resource_load_time_cost:' + cost);
	if(sessionStorage.getItem("reported")==="true")
	{
		console.log('you refresh the page, do not report');
	}
	else
	{
		sessionStorage.setItem("reported","true");
		console.log('you first open the page!');
	}
} 
