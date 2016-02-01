var gcloud = require('gcloud');

module.exports = function(config){
	//var dataset = gcloud.datastore.dataset(config.gcloud);
	//var kind = 'Question';

	// Datastore format received:
  //   {
  //     key: [kind, id],
  //     data: {
  //       property1: value1
  //       property2: value2
  //     }
  //   }
  //
  // Application format:
  //   {
  //     id: id,
  //     property1: value1,
  //     property2: value2,
  //   }

	function fromDataStore(obj){
		obj.data.id = obj.key.path[obj.key.path.length-1];
		return obj.data;
	}


	// Translates from the application's format to the datastore's
  // extended entity property format. It also handles marking any
  // specified properties as non-indexed. Does not translate the key.
  //
  // Application format:
  //   {
  //     id: id,
  //     property: value,
  //     unindexedProperty: value
  //   }
  //
  // Datastore extended format for 'data' part ONLY : to handle unindexed properties
  // Does not translate the key.
  //   [
  //     {
  //       name: property,
  //       value: value
  //     },
  //     {
  //       name: unindexedProperty,
  //       value: value,
  //       excludeFromIndexes: true
  //     }
  //   ]
  // So if return value is <R>
  // Then final entity to be sent is
  // {
  // 		key : key,
  //		data: <R>
  // }
	function toDataStore(obj, nonIndexed){
		nonIndexed = nonIndexed || [];
		var results = [];
		Object.keys(obj).forEach(function(key){
			if(obj[k] === undefined){return;}
			results.push({
				name : key,
				value : obj[key],
				excludeFromIndexes : nonIndexed.indexOf(key) !== -1
			});
		});
	}

	// [START exports]
  return {
    toDataStore : toDataStore,
    fromDataStore : fromDataStore
  };
  // [END exports]
};