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
	var asciiString = "";
	for(i = 0; i < byteStream.length; i++){
		asciiString += String.fromCharCode(byteStream[i]);
	}
	var base64String  = window.btoa(asciiString)
	return base64String;
}

function base64StringToByteStream(base64String){
	var asciiString = window.atob(base64String);
	var byteStream = [];
	for(i = 0; i < asciiString.length; i++){
		byteStream.push(asciiString.charCodeAt(i));
	}
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