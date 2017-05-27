var __interpretation_started_timestamp__;
var pi = 3.141592653589793;

var k;
var u;

var mLeft = brick.motor(M3);
var mRight = brick.motor(M4);

var eLeft = brick.encoder(E3);
var eRight = brick.encoder(E4);
var gyro = brick.gyroscope();

// в этих переменных будут хранится данные с энкодеров
var encLeftOld = 0;  
var encRightOld = 0;
var encLeft = 0;
var encRight = 0;

// переменные для подсчета текущих координат
var center = 0.0; 
var tiltMdps = 0.0; // скорость изменения угла отклонения в миллиградусах в секунду
var tilt = 0.0;
var dtilt = 0.0;
var prevTilt = 0.0;
// текущие координаты
var ex = 0.0; 
var ey = 0.0;

//массив для записи координат
var roboWasAt = [[0.0, 0.0]];
//если counter == CONST_FOR_COUNTER, тогда записываем в roboWasAt текущие координаты
var counter = 0;
var CONST_FOR_COUNTER = 20;

//----------------------------------------------------------------------------------FUNCTIONS----------------

//выполняет инициализацию энкодеров и датчика линии
var initialisation = function() 
{
	eLeft.reset();
	eRight.reset();
	brick.lineSensor("video0").detect();
}

// ждет команду от пользователя (нажатие галочки на панели) 
var waitForStartCommand = function() 
{
	brick.display().setBackground("red");
	brick.display().redraw();
	
	brick.display().addLabel("Press Enter", 40, 100);
	brick.display().redraw();
	
	brick.display().addLabel("when ready", 40, 120);
	brick.display().redraw();
	
	while (!brick.keys().wasPressed(KeysEnum.Enter)) {
		script.wait(100);
	}
	
	brick.display().clear();
	brick.display().redraw();
	
	brick.display().setBackground("green");
	brick.display().redraw();
}

function toRadians (angle) 
{
	return angle * (pi / 180);
}

//----------------------------------------------------------------------------------MAIN-----------------

var main = function()
{
	__interpretation_started_timestamp__ = Date.now();
	
	waitForStartCommand();
	initialisation();
	
	k = 1;
	while (true) {
		u = brick.lineSensor("video0").read()[0];
		
		mLeft.setPower(50 + k * u);
		mRight.setPower(50 - k * u);
		
		encLeft = eLeft.readRawData();
		encRight = -eRight.readRawData();
		
		script.wait(50); //задержка на 0.05 секунды
		tilt = gyro.read()[6] / 1000; // эта команда считывает угол отклонения от оси Х

		//считаем текущие координаты, см презентацию по одометрии
		center = (encLeft - encLeftOld + encRight - encRightOld) / 2;
		dtilt = tilt + (tilt - prevTilt) / 2;
		ex = ex + Math.cos(toRadians(dtilt)) * center;
		ey = ey + Math.sin(toRadians(dtilt)) * center;

		encLeftOld = encLeft;
		encRightOld = encRight;
		prevTilt = tilt;
		
		counter += 1;
		if (counter == CONST_FOR_COUNTER)
		{
			roboWasAt.push([ex, ey]);
			print(ex .toFixed(2) , " || ", ey.toFixed(2), "  ", tilt);
			counter = 0;
		}
		
		script.wait(50);
		
	}
}
