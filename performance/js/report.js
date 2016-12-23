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
		
		var resources = performance.getEntriesByType('resource');
		for(var i=0;i<resources.length;i++)
		{
			if(resources[i].duration == 0)
			{
				console.log('you have already open this page short before!');
				return;
			}
		}
		console.log('you first open the page!');
	}
} 
