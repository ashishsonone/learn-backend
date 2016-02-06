if calc.js, calc object with property seperator is exported
now if in any file, any changes to the var calc = require('./calc').calc
    persisted globally, i.e to the original calc object defined in calc.js
so there is only one instance of the exported object as defined in the original
    module file. Any changes to it will affect everywhere it is used
