//script.system("/etc/init.d/edge-line-sensor-ov7670  -v 2 start");
script.system("echo 2 > /sys/class/misc/l3g42xxd/odr_selection");

var stopKey = KeysEnum.Up;
var startKey = KeysEnum.Left;

var calibrateTime = 20000;
var middleError = 0;
var degInRad = 180 / 3.14;
var readGyro = brick.gyroscope().read;
var exec_time = 0;
var pi = 3.1415926535897931

var mLeft = brick.motor(M3);
var mRight = brick.motor(M4);

eLeft = brick.encoder(E3);
eRight = brick.encoder(E4);

eLeft.reset();
eRight.reset();

brick.lineSensor("video2").init(true);

var p = 0.25;
var i = 0.001;
var k = 0.1;

var xys = [0,0,0];
var x = 0;
var s = 0;

var xold = 0;
var speed = 60;

var calc_bias_error = function() {
	var myTime = 0;
	var sumOfAngles = 0;
	while (myTime <= calibrateTime / 10) {
		sumOfAngles += gyro.read()[2];
		myTime ++;
		script.wait(10);
	}
	// 8.75 * 10 == 87.5
	middleError = sumOfAngles * 87.5 / calibrateTime; //mdps
	print(middleError, " == middle error---------------------");
}

var gyro = brick.gyroscope();
calc_bias_error();
print("gyro inited");
brick.playTone(500, 500);

var key = 0;
function wasPressed(_key)
{
	key = 0;
	if (brick.keys().wasPressed(_key))
	{
		key = _key;
		return 1;
	} else {
		return 0;
	}
}

var next = 0;
var terminate = 0;
var tilt = 0;
var prevTilt = 0;

var calc_gyro5 = function() {
	var angle_speed = gyro.read()[2] * 8.75; //mdps
	tilt = tilt * 180 / pi;
	tilt += (angle_speed - middleError) * 0.05 / 1000;
	tilt = tilt * pi / 180;
}

var timer = script.timer(20000);

var comeBack = function() {
	terminate = 1;
	timer.stop();

	mLeft.setPower(0);
	mRight.setPower(0);

	eLeft.reset();
	eRight.reset();

	script.wait(2000);

	print("coming back; time = ", new Date() - exec_time);

	var dist = Math.sqrt(ex * ex + ey * ey);

	calc_gyro5();
	var disTilt = -Math.atan2(ey, ex);

	print("ex = ", ex, "; ","ey = ", ey, "dist = ", dist, "; tilt = ", tilt, "; disTilt = ", disTilt, " time = ", new Date() - exec_time);

	print("reverting");

	//mLeft.setPower(65);
	//mRight.setPower(-65);

	while (true) {
		calc_gyro5();
		print("tilt = ", tilt, "; ","disTilt = ", disTilt, " time = ", new Date() - exec_time);
		if (Math.abs(tilt - disTilt ) < 0.001) {
			mLeft.setPower(0);
			mRight.setPower(0);
			break;
		}
		if (tilt < disTilt) {
			mLeft.setPower(60);
			mRight.setPower(-60);
		} else {
			mLeft.setPower(-60);
			mRight.setPower(60);
		}
		script.wait(50);
	}

//	var revEnc = (eLeft.readRawData() + eRight.readRawData());
	//print(eLeft.readRawData() , ";", eRight.readRawData());
	print("reverted; time = ", new Date() - exec_time);

	//mLeft.setPower(0);
	//mRight.setPower(0);

	ex = 0;
	ey = 0;
	encLeftOld = 0;
	encRightOld = 0;
	encLeft = 0;
	encRight = 0;

	eLeft.reset();
	eRight.reset();

	script.wait(2000);

	mLeft.setPower(70);
	mRight.setPower(70);

	while (true) {
		encLeft = -eLeft.readRawData();
		encRight = eRight.readRawData();

		var diff = (encLeft - encRight) * 0.5;

		print("dist = ", dist, "; ", "encRight = ", encRight, "; ","encLeft = ", encLeft, "; ", "time = ", new Date() - exec_time);

		mLeft.setPower(70 - diff);
		mRight.setPower(70 + diff);

		if (2 * dist - (encLeft + encRight) < 50) {
			mLeft.setPower(0);
			mRight.setPower(0);
			break;
		}

		script.wait(20);
	}

	encLeft = -eLeft.readRawData();
	encRight = eRight.readRawData();

	print("dist = ", dist, "; ","encRight = ", encRight, "; ","encLeft = ",  encLeft, ";", "time = ", new Date() - exec_time);

}

while (!next) {

	while (!(wasPressed(startKey) || wasPressed(stopKey))) {
		script.wait(100);
	}

	switch (key) {
		case startKey:
			print("start");
			timer.timeout.connect(comeBack);
			timer.start();
			exec_time = new Date();
			brick.lineSensor("video2").detect();
			next = 1;
		break;
		case stopKey:
			brick.stop();
			next = 1;
			terminate = 1;
		break;
	}

	script.wait(1000);
}

var ex = 0;
var ey = 0;
var encLeftOld = 0;
var encRightOld = 0;
var encLeft = 0;
var encRight = 0;

var firstTime = 1;

while (!terminate) {

	if (brick.keys().wasPressed(stopKey)) {
		terminate = 1;
		comeBack();
	} else {

		xys = brick.lineSensor("video2").read();
		x = xys[0];
		s = xys[2];

		//print(x, ";", s);

		if (s < 12) {
			firstTime = 1;
			if (xold > 0) {
		print("turn left; time = ", new Date() - exec_time);
				mLeft.setPower(-60);
				mRight.setPower(60);
			} else {
		print("turn right; time = ", new Date() - exec_time);
				mLeft.setPower(60);
				mRight.setPower(-60);
			}
		} else {
			if (firstTime) {
				calc_gyro5();
				print("tilt = ", tilt, "time = ", new Date() - exec_time);
				xold = x;
				firstTime = 0;
			}

			var yaw = x*p + (x - xold) * k;
			//print(s, x, yaw);
			mLeft.setPower(-(speed + yaw));
			mRight.setPower(-(speed - yaw));
			xold = x;
		}

		encLeft = eLeft.readRawData();
		encRight = -eRight.readRawData();
		calc_gyro5();

		var center = (encLeft - encLeftOld + encRight - encRightOld) / 2;
		var dtilt = tilt + (tilt - prevTilt) / 2;
		ex = ex + Math.cos(dtilt) * center;
		ey = ey + Math.sin(dtilt) * center;

			print("ex = ", ex, ";"," ey = ", ey, "; tilt = ", tilt, "time = ", new Date() - exec_time);

		encLeftOld = encLeft;
		encRightOld = encRight;
		prevTilt = tilt;
	}
	script.wait(50);
}

brick.stop();
print("finish, time = ", new Date() - exec_time);
script.quit();
