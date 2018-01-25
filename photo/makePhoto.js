startTime = Date.now()
var photo = getPhoto();
print("Finished photo in " + (Date.now()-startTime));
startTime = Date.now()
var h = 120;
var w = 160;
var scale = 1;
var photoBW = [];

var grayscale = "MXOmxo=|:-....    "
if (photo.length != h*w) {
  print ("Incorrect size: " + photo.length)
} else
for(var i = 0; i < h; i++) {
        var str = "";
        for(var j = 0; j < w; j++) {
                var x = (j + i*scale*w )*scale;
                var p = photo[x];
                p = (((p & 0xff0000) >> 18) + ((p & 0xff00) >> 10) + ((p&0xff)>>2));
                photoBW[j+i*w]=p;
                p = Math.floor(p*grayscale.length>>8);
                str+=grayscale[p]
        }
        print(str)
}
print("Finished photoBW in " + (Date.now()-startTime));
print(photoBW.length)
 

