var calc = require('./calc').calc

calc.seperator = '-2-';

function join(a, b){
    return calc.join(a, b);
}

module.exports.join = join;
