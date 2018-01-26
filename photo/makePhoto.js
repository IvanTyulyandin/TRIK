var startTime = Date.now()
var photo = getPhoto();
print("Finished photo in " + (Date.now()-startTime));
startTime = Date.now()
var h = 120;
var w = 160;
var scale = 1;
var photoBW = [];
var histogram = [];
var histSize = 256;

function calculateHistogram() {
	for (var i = 0; i < histSize; i ++)
		histogram[i] = 0;

	var curPixelLine = 0;
	for (var i = 0; i < h; i ++)
	{
		curPixelLine = i * w;
		for (var j = 0; j < w; j ++)
			histogram[Math.floor(photoBW[curPixelLine + j])] += 1;
	}
}

var grayscale = "@. "
var numOfBins = grayscale.length;
var rangeBins = [];
var binCapacity = h * w / numOfBins;

function getRange() {
	for (var i = 0; i < numOfBins; i ++)
		rangeBins[i] = 0;

	var curBin = 0;
	var curSum = 0;
	var i = 0;
	var lastIndexBin = numOfBins - 1;
	
	for (; (i < histSize) && (curBin < lastIndexBin); i ++)
	{
		var diff = binCapacity - curSum;
		
		if ( Math.abs(diff) < Math.abs(diff - histogram[i]) )
		{
			curBin ++;
			curSum = 0;
		}

		curSum += histogram[i];
		rangeBins[curBin] = i;
	}
	
	for (; curBin <= lastIndexBin; curBin ++)
		rangeBins[curBin] = histSize;
}




var mapColorToLetter = [];

function initMapColorToLetter()
{
	var curBin = 0;
	for (var i = 0; i < histSize; i ++)
	{
		if (rangeBins[curBin] <= i)
		{
			curBin ++;
		}
		mapColorToLetter[i] = grayscale[curBin];
	}
}


if (photo.length != h * w) 
{
	print ("Incorrect size: " + photo.length)
} 
else
{
	for(var i = 0; i < h; i++) 
	{
		var str = "";
		for(var j = 0; j < w; j++) 
		{
			var x = (j + i*scale*w )*scale;
			var p = photo[x];
			p = (((p & 0xff0000) >> 18) + ((p & 0xff00) >> 10) + ((p&0xff) >> 2));
			photoBW[j+i*w]=p;
			p = Math.floor(p*grayscale.length>>8);
			str+=grayscale[p]
		}
		print(str)
	}

	calculateHistogram()
	getRange();
	initMapColorToLetter();

	for(var i = 0; i < h; i++) 
	{
		var str = "";
		for(var j = 0; j < w; j++) 
		{
			var p = photoBW[j+i*w];
			str+=mapColorToLetter[p];
		}
		print(str)
	}
}

print("Finished photoBW in " + (Date.now()-startTime));
print(photoBW.length)
 

