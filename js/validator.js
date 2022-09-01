var validator = (function() {

	return {
		validate: function(contextName, context=null) {
			if (!context) {
				context = curriculum;
			}
			try {
				var valid = context.validate('https://opendata.slo.nl/curriculum/schemas/'+contextName+'/context.json');
			} catch(error) {
				if (error.validationErrors && Array.isArray(error.validationErrors)) {
					return validator.mergeErrors(error.validationErrors, context);
				}
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