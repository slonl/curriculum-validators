var mergeContext = (function() {
	
	return {
		getChanges: function(context) {
			var changes = {};
			var errors = [];
			Object.keys(context.data).forEach(function(dataset) {
				changes[dataset] = [];
				context.data[dataset].forEach(function(entity) {
					var original = curriculum.index.id[entity.id];
					var change = {};
					if (!original) {
						if (curriculum.index.deprecated[entity.id]) {
							errors.push(new Error(context.fileName, 'Entiteit is deprecated', entity, [entity]));
						} else {
							// new entry
							entity.unreleased = true;
							Object.keys(entity).forEach(function(property) {
								if (property[0]!='_') {
									change[property] = entity[property];
								}
							});
						}
					} else {
						// update entry
						Object.keys(entity).forEach(function(property) {
							if (property[0]!='_' && entity[property]) {
								if (Array.isArray(entity[property])) {
									// TODO: for now, allow only additions
									
								} else if ( entity[property]!==original[property]) {
									entity.dirty = 1;
									change.id = entity.id;
									change[property] = entity[property];
								}
							}
						});
					}
					if (change.id) {
						changes[dataset].push(change);
					}
				});
			});
			if (errors.length) {
				throw errors;
			}
			return changes;
		}
	}
})();