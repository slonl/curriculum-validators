var validator = (function() {

	var ajv = new Ajv({
		extendRefs: true,
		allErrors: true,
		jsonPointers: true
	});
	var ajvContext = null;

	ajv.addKeyword('itemTypeReference', {
	    validate: function(schema, data, parentSchema, dataPath, parentData, propertyName, rootData) {
	        var matches = /.*\#\/definitions\/(.*)/g.exec(schema);
	        if (matches) {
				if (ajvContext.index.type[data] == matches[1]) {
					return true;
				} else if (curriculum.index.type[data] == matches[1]) {
					return true;
				} else {
					return false;
				}
	        }
	        console.log('Unknown #ref definition: '+schema);
	    }
	});

	return {
		loadSchemas: function(contexts) {
			contexts.forEach(function(context) {
				ajv.addSchema(curriculum.schemas[context], 'https://opendata.slo.nl/curriculum/schemas/'+context+'/context.json');
			});
		},
		validate: function(contextName, context=null) {
			if (!context) {
				context = curriculum;
			}
			ajvContext = context;
			var valid = ajv.validate('https://opendata.slo.nl/curriculum/schemas/'+contextName+'/context.json', context.data);
			if (!valid) {
				return validator.mergeErrors(ajv.errors, context);
			}
			return true;
		},
		mergeErrors: function(errors, context) {
            var paths = {};
            errors.forEach(function(error) {
                if (!paths[error.dataPath]) {
                    paths[error.dataPath] = [];
                }
                paths[error.dataPath].push(error);
            });
			var result = [];
			Object.values(paths).forEach(function(nodeErrors) {
				result.push(validator.mergeNodeErrors(nodeErrors, context))
			});
			return result;
		},
		mergeNodeErrors: function(errors, context) {
			var path = errors[0].dataPath;
			if (!path) {
				return null;
			}
			var parts = path.substr(1,path.length).split('/');
			var prop = parts.shift();
			var index = parts.shift();
			var entity = context.data[prop][index];
			var messages = [];
			var schemaMessages = {};
			errors.forEach(function(error) {
				if (!schemaMessages[error.schemaPath]) {
					schemaMessages[error.schemaPath] = [];
				}
				schemaMessages[error.schemaPath].push({
					keyword: error.keyword,
					message: error.message,
					params: error.params
				});
			});
			var result = {
				entity: entity,
				errors: []
			};
			Object.keys(schemaMessages).forEach(function(schemaPath) {
				result.errors.push(validator.mergeNodeSchemaErrors(schemaMessages[schemaPath], schemaPath));
			});
			return result;
		},
		mergeNodeSchemaErrors: function(errors, schemaPath) {
			// single node, single schema path
			if (schemaPath.indexOf('/anyOf/')>0) {
				return {
					innerHTML: schemaPath+': Entiteit moet voldoen aan tenminste &eacute;&eacute;n van deze vereisten:',
					errors: errors.map(function(error) {
						return error.message;
					})
				};
			} else if (schemaPath.indexOf('/allOf/')>0) {
				return {
					innerHTML: schemaPath+': Entiteit moet voldoen aan al deze vereisten:',
					errors: errors.map(function(error) {
						return error.message;
					})
				};
			} else {
				return {
					innerHTML: schemaPath+': Entiteit moet voldoen aan deze vereisten:',
					errors: errors.map(function(error) {
						return error.message;
					})
				};
			}
		}
	};

})();