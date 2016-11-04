function load() {
	var i = 0;
	while (++i<=15)
	{
		var img = document.getElementById("pic"+i);
		img.setAttribute("src","img/"+i+".jpg");
	}
}
