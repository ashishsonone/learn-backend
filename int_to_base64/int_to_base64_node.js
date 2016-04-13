//====== internals =====
function intToTwoByteArray(int){
	var bA = [0, 0];
	var b0 = int & 0xff;
	var b1 = (int >> 8) & 0xff;
	bA[0] = b0;
	bA[1] = b1;
	return bA;
}

function twoByteArrayToInt(array){
	var int = array[0];
	int = int | (array[1] << 8);
	return int;
}

function intArrayToByteStream(intArray){
	var byteStream = [];
	for(index in intArray){
		var int = intArray[index];
		var twoByteArray = intToTwoByteArray(int);
		//console.log(int + " | " + twoByteArray);
		byteStream = byteStream.concat(twoByteArray);
	}
	return byteStream;
}

function byteStreamToIntArray(byteStream){
	var intArray = [];
	for(var i=0; i < byteStream.length; i = i + 2){
		var twoByteArray = byteStream.slice(i, i + 2);
		var int = twoByteArrayToInt(twoByteArray);
		//console.log(twoByteArray + " | " + int + " | " + byteStream + " | " + i);
		intArray.push(int);
	}
	return intArray;
}

function byteStreamToBase64String(byteStream){
	var buffer = new Buffer(byteStream);
	var base64String = buffer.toString('base64');
	return base64String;
}

function base64StringToByteStream(base64String){
	var buffer = new Buffer(base64String, 'base64');
	var byteStream = Array.prototype.slice.call(buffer, 0);
	return byteStream;
}

//======= wrappers ========
function intArrayToBase64String(intArray){
	var byteStream = intArrayToByteStream(intArray);
	var base64String = byteStreamToBase64String(byteStream);
	return base64String;
}

function base64StringToIntArray(base64String){
	var byteStream = base64StringToByteStream(base64String);
	var intArray = byteStreamToIntArray(byteStream);
	return intArray;
}

module.exports = {
	intToTwoByteArray : intToTwoByteArray,
	twoByteArrayToInt : twoByteArrayToInt,

	intArrayToByteStream : intArrayToByteStream,
	byteStreamToIntArray : byteStreamToIntArray,

	byteStreamToBase64String : byteStreamToBase64String,
	base64StringToByteStream : base64StringToByteStream,

	intArrayToBase64String : intArrayToBase64String,
	base64StringToIntArray : base64StringToIntArray,
};