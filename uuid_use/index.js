var uuid = require('node-uuid');

console.log(uuid.v1());
console.log(uuid.v4());

var buffer = [];
var array = [];
uuid.v4(null, buffer, 0);

uuid.v4(null, array, 16);
console.log(buffer.length + ":" + array[0]);
console.log(array.length + ":" + array[0] + " " + array[16]);

//---------------
var id = uuid.v4();
var id_offset = 0;
var id_buffer = [];
uuid.parse(id, id_buffer, id_offset);
var id_recovered = uuid.unparse(id_buffer);
console.log("id => " + id);
console.log("id_buffer => " + id_buffer);
console.log("id_recovered => " + id_recovered);
