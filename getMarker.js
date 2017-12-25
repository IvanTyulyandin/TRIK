
var sourcePic = brick.getStillImage("/dev/video0");
print(sourcePic.length);

var pic_large = [];

var R = 0;
var G = 0;
var B = 0;
for (var i = 0; i < 320 * 240 * 4; i += 4) {
	// format is 0xffRRGGBB, so skip sourcePic[i]
	R = sourcePic[i + 1];
	G = sourcePic[i + 2];
	B = sourcePic[i + 3];
	//print(0.2989 * R + 0.5870 * G + 0.1140 * B);
	pic_large.push(Math.round(0.2989 * R + 0.5870 * G + 0.1140 * B).toFixed(2));
}

var pic = [];

var marker_size = 5;
var total_width = 320 / 2;
var total_height = 240 / 2 ;
var prob = 25 * 5 * 5;

for (var x = 0; x < total_width; ++x)
  for (var y = 0; y < total_height; ++y)
    pic[y * total_width + x] = pic_large[y * 320 * ( 240 / total_height) + (x * 320 / total_width) ];

function getColor(pic, x, y) {
    return pic[y * total_width + x];
}

function squareAverage(pic, x, y, diam) {
    var sum = 0;
    var start_row = y  * total_width;        
    var end_row = start_row + diam * total_width;
    for (var index = start_row + x; index < end_row; index += total_width) {
        for (var j = 0; j < diam; j++) {
            sum += pic[index + j];
        } 
    }
    return sum; 
}

// lu - left-up corner. Coordinates: (x, y)
// ld - left-down corner
// ru - right-up corner
// rd - right-down corner
function getCenterColor(pic, lu, ld, ru, rd, diam) {
    var x = (lu[0] + ld[0] + ru[0] + rd[0]) >> 2;
    var y = (lu[1] + ld[1] + ru[1] + rd[1]) >> 2;
    var color = squareAverage(pic, x - diam, y - diam, diam << 1);
    return color;
}

function findGridCorners(corners, marker_size) {
    var grid_corners = [];

    var vertical_lines = [];
    var upper_line_x1 = corners[0][0];
    var upper_line_y1 = corners[0][1];
    var upper_line_x2 = corners[2][0];
    var upper_line_y2 = corners[2][1];
    var down_line_x1 = corners[1][0];
    var down_line_y1 = corners[1][1];
    var down_line_x2 = corners[3][0];
    var down_line_y2 = corners[3][1];
            
    var mks = 1.0 / marker_size;
    var k_ux = (upper_line_x2 - upper_line_x1) * mks;
    var k_uy = (upper_line_y2 - upper_line_y1) * mks;
    var k_dx = (down_line_x2 - down_line_x1) * mks;
    var k_dy = (down_line_y2 - down_line_y1) * mks;
    
    for (var i = 0; i < marker_size + 1; i++) {
        
        var up_x = upper_line_x1 + k_ux * i;
        var up_y = upper_line_y1 + k_uy * i;

        var down_x = down_line_x1 + k_dx * i;
        var down_y = down_line_y1 + k_dy * i;

        var k_x = (down_x - up_x) * mks;
        var k_y = (down_y - up_y) * mks;
 

        for (j = 0; j < marker_size + 1; j++) {
            
            var point_x = up_x + k_x * j;
            var point_y = up_y + k_y * j; 

            grid_corners.push([Math.floor(point_x), Math.floor(point_y)]);  
        }
    }
    return grid_corners;
}

function detectCode(pic, grid_corners, diam) {
    var calculated_colors = []
    for (var i = 0; i < marker_size; i++) {
        for (var j = 0; j < marker_size; j++) {
            lu_index = i * (marker_size + 1) + j;
            ld_index = i * (marker_size + 1) + j + 1;
            ru_index = (i + 1) * (marker_size + 1) + j;
            rd_index = (i + 1) * (marker_size + 1) + j + 1;
            
            var lu = grid_corners[lu_index];
            var ld = grid_corners[ld_index];
            var ru = grid_corners[ru_index];
            var rd = grid_corners[rd_index];

            grid_color = getCenterColor(pic, lu, ld, ru, rd, diam);
            if (grid_color <  diam << 8) {
                calculated_colors.push(0);
            } else {
                calculated_colors.push(1);
            }
        }
    }
    return calculated_colors;
}

function findULCorner(pic, diam) {
    var color = 1;
    for (var i = 0; i < total_height; i++) {
        for (var j = 0; j <= i; j++) {
            var x = j;
            var y = i - j;
            if (getColor(pic, x, y) == 0) {
                color = squareAverage(pic, x, y, diam);
                if (color < prob) {
                    return [x, y];
                }
            }
        }
    }
}

function findDLCorner(pic, diam) {
    var color = 1;
    for (var i = 0; i < total_height; i++) {
        for (var j = 0; j <= i; j++) {
            var x = j;
            var y = total_height - (i - j);
            if (getColor(pic, x, y) == 0) {
                color = squareAverage(pic, x, y - diam + 1, diam);
                if (color < prob) {
                    return [x, y];
                }   
            }
        }
    }
}

function findURCorner(pic, diam) {
    for (var i = 0; i < total_height; i++) {
        for (var j = 0; j <= i; j++) {
            var x = total_width - j;
            var y = i - j;
            if (getColor(pic, x, y) == 0) {
                var color = squareAverage(pic, x - diam + 1, y, diam);
                if (color < prob) {
                    return [x, y];
                }   
            }
        }
    }
}

function findDRCorner(pic, diam) {
    for (var i = 0; i < total_height; i++) {
        for (var j = 0; j <= i; j++) {
            var x = total_width - j;
            var y = total_height - (i - j);
            if (getColor(pic, x, y) == 0) {
                var color = squareAverage(pic, x - diam + 1, y - diam + 1, diam);
                if (color < prob) {
                    return [x, y];
                }
            }
        }
    }
}

function findCorners(pic, diam) {
    return [findULCorner(pic, diam), findDLCorner(pic, diam), findURCorner(pic, diam), findDRCorner(pic, diam)];
}   


function threshold2(level, pic, height, width) {
    var length = pic.length;
    for (var i = 0; i < length; i++) {
        var color = pic[i];
        if (color < level) {
            pic[i] = 0;
        } else {
            pic[i] = 255;
        }
    }
    return pic;        
}

function printPic(pic) {
	var debugStr = '';
	var color = 0;
	var asciiGraph = ['@', 'a', '_', '.', ' '];
	var step = 255 / (asciiGraph.length);
	for (var j = 0; j < total_height; j += 2)
	{
		debugStr = '';
		for (var k = 0; k < total_width; k ++)
		{
			for (var cnt = 0; cnt < asciiGraph.length; cnt ++)
			{
				if (pic[j * total_width + k] <= cnt * step)
				{
					debugStr += asciiGraph[cnt];
					break;
				}
			}
		}
		print(debugStr);
	}
}

var start = Date.now();
    
var corners;
var calculated_colors;
var TRY_COUNT = 1;
for (var i = 0; i < TRY_COUNT; i++) {
    printPic(pic);
    var thresh = threshold2(70, pic, total_height, total_width);
    corners = findCorners(thresh, 5);
    var grid_corners = findGridCorners(corners, marker_size)
    calculated_colors = detectCode(thresh, grid_corners, 3);
}

print((Date.now() - start) / TRY_COUNT);
print("Colors:", calculated_colors);
print("Corners:", corners);

// threshold -- 110
// corners -- 212
// grid -- 10
// detectColor -- 25
