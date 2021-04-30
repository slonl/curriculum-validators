	var readFile = function(file) {
		return new Promise((resolve,reject) => {
			var reader = new FileReader();
			reader.onload = resolve;
			reader.onerror = reject;
			reader.readAsBinaryString(file);
		});
	};

    function walk(hierarchy, node, parents, callback) {
        var hier = hierarchies[hierarchy];
        var type = node.section;
        callback(node, parents);
        var childParents = parents.slice();
        childParents.push(node);
        if (hier[type]) {
            hier[type].forEach(function(prop) {
                if (node[prop]) {
                    node[prop].forEach(function(childId) {
                        var child = curriculum.index.id[childId];
                        if (!child) {
                            console.error('Missing child id: '+childId+' in '+prop, node);
                        } else {
                            walk(hierarchy, curriculum.index.id[childId], childParents, callback);
                        }
                    });
                }
            });
        }
    }

	function NodeReplacer(key, value) {
		switch(key) {
			case 'children':
			case 'deletedChildren':
			case 'parents':
				return undefined;
			break;
			default:
				return value;
			break;
		}
	}

	function Node(tree, index, row={}) {
		var self = this;
		Object.keys(row).forEach(function(key) {
			var value = ''+row[key]; // force entries to string
			if (key=='ParentID') {
				key = 'parentId';
			} else {
				key = key.toLowerCase();
			}
			if (key=='type') {
				value = value.toLowerCase();
			}
			value = value.trim();
			if (value == "``") {
				value = "";
			}
			self[key] = value;
		});
		this.children = [];
		this.deletedChildren = [];
		this._row = index;
		Object.defineProperty(this, '_tree', {
			value: tree,
			writeable: false,
			enumerable: false
		});
	}

	function CombinedNode(tree) {
		this._rows = [];
		this.children = [];
		this.deletedChildren = [];
		this.level = [];
		Object.defineProperty(this, '_tree', {
			value: tree,
			writeable: false,
			enumerable: false
		});
		this._row = null;
	}

	function Entity(node, context, schema) {
		if (context.index.id[node.id]) {
			return context.index.id[node.id]; // prevent duplicate entities
		}
		var self = this;
		this._rows = [];
		this._node = node;
		this.children = [];
		this.deletedChildren = [];
		this.parents = [];
		Object.defineProperty(this, '_row', {
			get: function() {
				return this._rows.join(',');
			}
		});
		Object.defineProperty(this, '_tree', {
			value: node._tree,
			writeable: false,
			enumerable: false
		});
		Object.defineProperty(this, 'level', {
			value: node.level,
			writeable: true,
			enumerable: false
		});
		if (!node.type) {
			context.errors.push(new Error(node._tree.fileName, 'Geen type opgegeven',node,[node]));
		} else {
			var jsonSchema = tree.findSchema(node.type);
			if (!jsonSchema) {
				context.errors.push(new Error(node._tree.fileName, 'Type '+node.type+' is onbekend',node,[node]));
			}
		}
		if (!jsonSchema) {
			this.id = node.id;
			this.type = node.type;
		} else {
			var referencesKey = 'verwijst naar';
			if (!node[referencesKey]) {
				referencesKey = 'verwijst naar:';
			}
			if (node[referencesKey]) {
				var targetId = node[referencesKey];
				var targetType = curriculum.index.type[targetId];
				if (targetType) {
					node[targetType+'_id'] = [targetId];
				}
				delete node[referencesKey];
			}
			
			Object.keys(node).forEach(function(prop) {
				self[prop] = node[prop];
				if (typeof self[prop] == 'string') {
					self[prop] = self[prop].trim();
				}
				if (self[prop] === '-') { // '-' is used to mark deletion of a property
					delete self[prop]; // TODO: check if we should do that here or later
				}
				var properties = jsonSchema.properties[node.type].items.properties;
				if (typeof self[prop] !== 'undefined' && properties[prop]) {
					switch(properties[prop].type) {
						case 'integer':
							if (String.isString(self[prop])) {
								if (isNaN(Number(self[prop]))) {
									context.errors.push(new Error(node._tree.fileName, 'Eigenschap &quot;'+prop+'&quot; moet een integer zijn',node,[node]));
								} else {
									self[prop] = +self[prop];
								}
							}
						break;
						case 'boolean':
							self[prop] = !!self[prop];
						break;
						case 'array':
							if (!Array.isArray(self[prop])) {
								context.errors.push(new Error(node._tree.fileName,'Eigenschap &quot;'+prop+'&quot; moet een array zijn',node,[node]));
							}
						break;
						case 'string':
						default:
							self[prop] = ''+self[prop];
						break;
					}
				}
			});
		}
		context.index.type[this.id] = this.type;
		delete this.children;
		delete this.type;
		delete this.parents;
	}

	function getExcelIndex(node) {
		return '['+node._tree.fileName+':'+node._row+']';
	}

	function parseNodeLevels(tree, node) {
		if (node.level.substr(0,2)=='--') {
			return; // this is a comment
		}
		var levels = node.level.split(',').map(function(level) { return level.trim().toLowerCase(); });
		if (levels && tree.levels) {
			if (!levels.every(level => tree.levels.includes(level))) {
				tree.errors.push(new Error(tree.fileName, 'Node bevat een of meer levels die niet in de eerste rij van de sheet staan', node, [tree.roots[0], node]));
			}
		}
		return levels;
	}

	var defaultProps = ['_row','ID','Prefix','Title'];
	function Error(file, error, node=null, rows=null, props=[]) {
		this.file = file;
		this.error = error;
		this.props = defaultProps.concat(props);
		this.node = node;
		this.rows = rows;
	}

	var niveauIndex = {};

	/**
	 * Returns a list of Niveau's relevant to this entity
	 * Any niveau_id from a child in the same context is counted
	 * As well as niveau_id's from doelniveau's that are linked
	 */
	function getNiveaus(originalEntityId) {
		if (niveauIndex[originalEntityId]) {
			return niveauIndex[originalEntityId];
		}
		var originalEntity = curriculum.index.id[originalEntityId];
		if (originalEntity.niveau_id) {
			niveauIndex[originalEntityId] = originalEntity.niveau_id;
		} else {
			var niveaus = [];
			childrenInContext(originalEntityId).forEach(childId => {
				niveaus = niveaus.concat(getNiveaus(childId));
			});
			niveauIndex[originalEntityId] = [... new Set(niveaus)];
		}
		return niveauIndex[originalEntityId];
	}

	/**
	 * returns a list of all children (and children of children) in
	 * the same context, adding doelniveau's as well.
	 */
	function childrenInContext(id) {
		var entity = curriculum.index.id[id];
		var schema = curriculum.index.schema[id];
		var children = [];
		Object.keys(entity).forEach(prop => {
			if (prop.substr(prop.length-3)=='_id' && Array.isArray(entity[prop])) {
				entity[prop].forEach(childId => {
					var childSchema = curriculum.index.schema[childId];
					if (childSchema==schema) {
						children.push(childId);
					} else if (childSchema=='curriculum-basis' && curriculum.index.type[childId] == 'doelniveau') {
						children.push(childId);
					}
				});
			}
		});
		return [... new Set(children)];
	}

	function referencesInContext(id) {
		var schema = curriculum.index.schema[id];
		var references = curriculum.index.references[id];
		if (references) {
			return references.filter(refId => {
				var refSchema = curriculum.index.schema[refId];
				return schema == refSchema || schema == 'curriculum-basis';
			});
		} else {
			return [];
		}
	}

	function getRoots(id) {
		var references = referencesInContext(id);
		if (!references.length) {
			return id;
		} else {
			return [... new Set(references.map(refId => getRoots(refId)).flat())];
		}
	}

	var tree = {
		importXLSX: function(files, context) {
			var errors = [];
			return Promise.all(files.map(
				function(file) {
					return readFile(file)
					.then(function(e) {
						return { name: file.name, data: e.target.result};
					})
					.catch(function(error) {
						errors.push(new Error(file.name, error));
					});
				}
			))
			.then(function(dataset) {
				return dataset.filter(Boolean); // remove null results
			})
			.then(function(dataset) {
				// array of data per file
				return dataset.map(function(file) {
					var workbook = XLSX.read(file.data, {
						type: 'binary'
					});
					var sheets = {};
					workbook.SheetNames.forEach(function(sheetName) {
						sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
							workbook.Sheets[sheetName]
						);
					});
					sheets.fileName = file.name
					return sheets
				});
			})
			.then(function(sheetset) {
				// combine sheets
				return sheetset.map(function(sheets) {
					var combined = [];
					Object.keys(sheets).forEach(function(sheetName) {
						if (sheetName=='fileName') {
							return;
						}
						combined = combined.concat(sheets[sheetName]);
					});
					combined.fileName = sheets.fileName;
					return combined;
				});
			})
			.then(function(combinedSheets) {
				// build trees
				var trees = combinedSheets.map(function(sheet) {
					return tree.buildFromArray(sheet, sheet.fileName);
				});
				return trees;
			});
		},
		buildFromArray: function(data, filename='') {
			console.log('buildFromArray');
			var myTree = {
				fileName: filename,
				roots: [],
				all: [],
				ids: {},
				errors: []
			};
			var ids = {};
			var firstNode = null;
			data.forEach(function(row, index) {
				var node = new Node(myTree, index+2, row); // sheet is 1-indexed and has a header row
				myTree.all[index] = node;
				var nodeID = node.id ? (''+node.id).trim() : null;
				if (!nodeID) {
					nodeID = node.id = curriculum.uuidv4();
				} else if (!nodeID.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
					if (!ids[nodeID]) {
						ids[nodeID] = curriculum.uuidv4();
					}
					nodeID = ids[nodeID];
				}
				if (!myTree.ids[nodeID]) {
					myTree.ids[nodeID] = [];
				}
				node.id = nodeID;
				myTree.ids[nodeID].push(node);
			});
			window.idToUuid = ids;
			// link parents to children
			// find rootnodes
			myTree.all.forEach(function(node, index) {
				var parentId = node.parentId ? (''+node.parentId).trim() : null;
				if (!parentId) {
					myTree.roots.push(node);
				} else {
					if (ids[parentId]) {
						parentId = ids[parentId];
					}
					if (!myTree.ids[parentId]) {
						myTree.errors.push(new Error(myTree.fileName,'Missende Parent',node,[node],['ParentID']));
					} else {
						myTree.ids[parentId].forEach(function(parent) {
							if (node.delete=='x') {
								delete node.delete; //CHECK: laten staan voor foutmeldingen?
								parent.deletedChildren.push(node.id);
							} else if (node.delete) {
								myTree.errors.push(new Error(myTree.filename,'Ongeldige waarde voor Deleted kolom',node,[node]));
							} else {
								parent.children.push(node.id);
							}
						});
					}
				}
			});
			// run basic checks
			// 1 root node per sheet (no orphans)
			if (myTree.roots.length!=1) {
				myTree.errors.unshift(new Error(
					myTree.fileName,
					'Deze sheet moet precies 1 root node hebben, maar heeft er '+myTree.roots.length,
					null,
					myTree.roots
				));
			} else {
				var root = myTree.roots[0];
				if (!root.level) {
					myTree.errors.push(new Error(myTree.fileName, 'Eerste row moet alle levels voor deze sheet bevatten',root,[root]));
				} else {
					myTree.levels = parseNodeLevels(myTree, root);
					if (!myTree.levels) {
						myTree.errors.push(new Error(myTree.fileName, 'Eerste row moet alle levels voor deze sheet bevatten',root,[root]));					
					}
				}
			}
			var dataErrors = {};
			// multiple entries for an ID have the same data
			Object.keys(myTree.ids).forEach(function(id) {
				myTree.ids[id] = myTree.ids[id].reduce(function(combinedNode, node) {
					Object.keys(node).forEach(function(property) {
						switch(property) {
							case '_tree':
							break;
							case '_row':
								combinedNode._rows.push(node._row);
								combinedNode._row = combinedNode._rows.join(',');
							break;
							case 'children':
								combinedNode.children = [... new Set(combinedNode.children.concat(node.children))];
							break;
							case 'parents':
								if (!combinedNode.parents) {
									combinedNode.parents = [];
								}
								combinedNode.parents = [... new Set(combinedNode.parents.concat(node.parents))];
							break;
							case 'deletedChildren':
								var conflicted = node.deletedChildren.filter(function(deletedChild) {
									return combinedNode.children.indexOf(deletedChild)!==-1;	
								});
								if (conflicted.length) {
									myTree.errors.push(new Error(myTree.fileName, 'Conflict in Deleted, deze kinderen zijn niet overal verwijderd', node, conflicted));
								} else {
									combinedNode.deletedChildren = [ ... new Set(combinedNode.deletedChildren.concat(node.deletedChildren))];
								}
							break;
							case 'parentId':
								// there is no need for the ParentID anymore, as we now have children
								// combinedNode.parents = [... new Set(combinedNode.parents.concat(node.ParentID))];
							break;
							case 'level':
								// this is expected, level is used to link a doelniveau
								combinedNode.level = [... new Set(combinedNode.level.concat(parseNodeLevels(myTree, node)))];
							break;
							default:
								if (typeof node[property] == 'string') {
									node[property] = node[property].trim();
									if (node[property].substr(0,2)=='--') { // '--' at the start is used to mark a comment, should re-use the original value
										return; // skip this value, it is a comment
									}
								}
								if (!combinedNode.hasOwnProperty(property)) {
									combinedNode[property] = node[property];
								} else if (node[property] 
									&& (typeof combinedNode[property] != typeof node[property] 
										|| (typeof node[property] == 'string' 
											&& combinedNode[property].trim()!=node[property].trim()
										)
										|| (combinedNode[property] != node[property])
									)
								) {
									if (!dataErrors[id] || !dataErrors[id][property]) {
										// explicitly allow later nodes to leave out everything except ID by only iterating
										// over the defined properties in node
										myTree.errors.push(new Error(
											myTree.fileName,
											'Verschil in data '+property+' was &quot;'+combinedNode[property]+'&quot; nu &quot;'+node[property]+'&quot;',
											node,
											myTree.ids[id],
											[
												property
											]
										));
										if (!dataErrors[id]) {
											dataErrors[id] = {};
										}
										dataErrors[id][property] = true;
									}
								}
							break;
						}
					});
					return combinedNode;				
				}, new CombinedNode(myTree));
			});
			if (!myTree.errors.length) {
				myTree = tree.combineNodes(myTree);
			}
			return myTree;
		},
		combineNodes: function(myTree) {
			console.log('combineNodes');
			var newTree = {
				fileName: myTree.fileName,
				ids: myTree.ids,
				root: myTree.ids[myTree.roots[0].id]
			};
			// deepest first walk, because we need to alter the children after walking them
			var walkDeepestFirst = function(node, callback) {
				node.children.forEach(function(nodeID) {
					if (typeof nodeID == 'string') {
						walkDeepestFirst(newTree.ids[nodeID], callback);
					} else {
						walkDeepestFirst(nodeID, callback);
					}
				});
				callback(node);
			};
			walkDeepestFirst(newTree.root, function(node) {
				node.children = node.children.map(function(nodeID) {
					return (typeof nodeID == 'string') ? newTree.ids[nodeID] : nodeID;
				});
			});
			return newTree;
		},
	    render: function(entity) {
	        if (!entity) {
	            return '<span class="slo-treeview-title"><span class="slo-tag"></span>Missing</span>';
	        }
	        var title = (entity.prefix ? entity.prefix + ' ' + entity.title : (entity.title ? entity.title : entity.id));

	        var result = '<span class="slo-treeview-title" data-simply-command="showEntity" data-simply-value="'+entity.id+'" title="'+escapeQuotes(entity.id)+'">';
	        result += '<span class="slo-tag">'+entity.type+'</span><span class="slo-title">'+title+'</span>';
			if (entity.level) {
				result += '<span class="slo-level">'+entity.level+'</span>';
			}
			result += '</span>';
	        result += '<div class="slo-treeview-children">';

	        if (entity.children) {
		        entity.children.forEach(function(child) {
		            result += tree.render(child);
		        });
			}
	        result += '</div>';

	        return result;
	    },
	    walk: function(node, callback, parents=[]) {
	        callback(node, parents);
	        var childParents = parents.slice();
	        childParents.push(node);
			if (node.children) {
	            node.children.forEach(function(child) {
					tree.walk(child, callback, childParents);
	            });
	        }
	    },
		getAllTypes: function(node) {
			var types = new Set();
			tree.walk(node, function(node) {
				types.add(node.type);
			});
			return [...types];
		},
		convertToContext: function(node, schema) {
			console.log('convertToContext');
			var context = {
				fileName: node._tree.fileName,
				index: {
					id: {},
					type: {},
					dnReferences: {}
				},
				errors: [],
				data: {
					doelniveau: []
				}
			};
			context.niveaus = tree.getNiveausFromLevel(node, context.errors);
			var moveDoelniveauProps = function(doelniveau, child) {
				var dnProps = curriculum.schemas['curriculum-basis'].properties.doelniveau.items.properties;
				var childType = child.type ? child.type : context.index.type[child.id];
				var childSchema = tree.findSchema(childType);
				if (childSchema) {
					var childProps = childSchema.properties[childType].items.properties;
					Object.keys(dnProps).forEach(p => {
						if (p!='id' && dnProps[p].type!='array' && child[p] && !childProps[p]) { //ignore arrays, only copy simple values
							doelniveau[p] = child[p];
							delete child[p];
						}
					});
				}
			};

			var makeDoelniveau = function(entity, prop, child) {
				// TODO: find existing doelniveau entry
				if (!entity.doelniveau_id) {
					entity.doelniveau_id = [];
				}
				var errors = [];
				var niveaus = tree.getNiveausFromLevel(child, errors);
				if (!niveaus.length) {
					context.errors.push( new Error(child._tree.fileName, 'Geen levels opgegeven', child, [cloneForErrors(entity), child]));
					return;
				}
				niveaus.forEach(function(niveau) {
					// cannot search for existing doelniveau here, because more children may
					// be added to this doelniveau later.
					var dn = {
						id: curriculum.uuidv4(),
						type: 'doelniveau',
						niveau_id: [ niveau ]
					}; 
					var doelniveau = new Entity(dn, context, schema);
					doelniveau[prop+'_id'] = [ child.id ];
					moveDoelniveauProps(doelniveau, child);
					context.data.doelniveau.push(doelniveau);
					context.index.id[doelniveau.id] = doelniveau;
					context.index.type[doelniveau.id] = 'doelniveau';
					entity.doelniveau_id.push(doelniveau.id);
				});
				if (errors.length) {
					context.errors = context.errors.concat(errors);
				} else {
					delete entity.level;
				}
			};


			var isDoelniveauLink = function(childType, nodeType, schema) {
				if (!schema) {
					schema = tree.findSchema(nodeType);
				}
				return (schema && schema.properties[nodeType]
					&& schema.properties[nodeType].items.properties['doelniveau_id'] 
					&& isDoelniveauChild(childType));
			};

			var isValidChildType = function(childType, nodeType, schema) {
				if (!schema) {
					schema = tree.findSchema(nodeType);
				}
				return (schema && schema.properties[nodeType]
					&& ( 
						schema.properties[nodeType].items.properties[childType+'_id']
						|| isDoelniveauLink(childType, nodeType, schema)
					)
				);
			};

			var isDoelniveauChild = function(type) {
				return !!curriculum.schemas['curriculum-basis'].properties['doelniveau'].items.properties[type+'_id'];
			};
			var isDoelniveauParent = function(type) {
				var schema = tree.findSchema(type);
				if (!schema) {
					return false;
				}
				return (schema && schema.properties[type] && schema.properties[type].items.properties['doelniveau_id']);
			};

			var cloneForErrors = function(ob) {
				var keys = ['_row','id','parentId','prefix','title'];
				var clone = {};
				keys.forEach(k => {
					clone[k] = ob[k];
				});
				return clone;
			};

			var addChildLink = function(entity, child, schema) {
				var entityType = context.index.type[entity.id];
				var entitySchema = tree.findSchema(entityType);
				var entityProperties = [];
				if (entitySchema && entitySchema.properties[entityType]) {
					entityProperties = entitySchema.properties[entityType].items.properties;
				}
				if (!child.type) {
					var childType = context.index.type[child.id];
				} else {
					var childType = child.type;
				}
				if (!childType) {
					return;
				}
				var childSchema = tree.findSchema(childType);
				var childProperties = [];
				if (childSchema && childSchema.properties[childType]) {
					childProperties = childSchema.properties[childType].items.properties;
				} else {
					context.errors.push( new Error(entity._tree.fileName, 'Type '+childType+' is onbekend', child, [cloneForErrors(entity)]));
					return;
				}

				if (entityProperties[childType+'_id']) { // default case
					if (!entity[childType+'_id']) {
						entity[childType+'_id'] = [];
					}
					if (!entity[childType+'_id'].includes(child.id)) {
						entity[childType+'_id'].push(child.id);
					}
				} else if (childProperties[entityType+'_id']) { // reverse parent child link
					child.children.push(entity);
				} else if (isDoelniveauLink(childType, entityType, schema)) {
					// child is linked to parent entity through doelniveau
					makeDoelniveau(entity, childType, child);
				} else if (isDoelniveauChild(childType) && isDoelniveauChild(entityType)) {
					// if so combine child in the entity's doelniveau
					// doelniveau[child.type+'_id'] must have no other entries
					var doelniveau = context.data.doelniveau.filter(e => e[entityType+'_id'] && e[entityType+'_id'].includes(entity.id));
					if (!doelniveau || !doelniveau.length) {
						return; // missing doelniveau because of earlier error
					}
					doelniveau = doelniveau.pop(); // get last matching entry
					if (!doelniveau[childType+'_id']) {
						doelniveau[childType+'_id'] = [];
					}
					doelniveau[childType+'_id'].push(child.id);
					moveDoelniveauProps(doelniveau, child);
				} else if (isDoelniveauParent(childType) && isDoelniveauChild(entityType)) {
					// reverse parent child relation
					var doelniveaus = context.data.doelniveau.filter(e => e[entityType+'_id'] && e[entityType+'_id'].includes(entity.id));
					if (!doelniveaus || !doelniveaus.length) {
						context.errors.push( new Error(child._tree.fileName, 'Kan geen doelniveau vinden voor omgekeerde parent-child link', child, [child, entity]));
						debugger;
						return;
					}
					if (!child.doelniveau_id) {
						child.doelniveau_id = [];
					}
					var doelniveau = doelniveaus.pop(); // pick the last defined doelniveau
					
					child.doelniveau_id.push(doelniveau.id);
				} else {
					context.errors.push( new Error(entity._tree.fileName, 'Type '+childType+' mag niet gekoppeld worden aan '+entityType, child, [cloneForErrors(entity), child]));
					return;
				}
			};

			/**
             * check that all properties of dn are in dnMatch and are the same, and vice versa
             */
			var isMatch = function(dn, dnMatch) {
				var match = null;
				var props = Object.keys(dn);
				for (var pi=0,pl=props.length;pi<pl;pi++) {
					var p = dn[props[pi]];
					var pm = dnMatch[props[pi]];
					if (Array.isArray(p) && p.length) {
						if (!Array.isArray(pm)) {
							return false;
						}
						var s = new Set(p);
						var sm = new Set(pm);
						if (s.size != sm.size) {
							return false;
						}
						for (var sid of s) {
							if (!sm.has(sid)) {
								return false;
							}
						}
					}
				}
				// check that all reference properties of dnMatch are in dn
				var propsMatch = Object.keys(dnMatch);
				for (var pi=0,pl=propsMatch.length;pi<pl;pi++) {
					var p = dn[propsMatch[pi]];
					var pm = dnMatch[propsMatch[pi]];
					if (Array.isArray(pm) && pm.length) {
						if (!Array.isArray(p)) {
							return false;
							break;
						}
					}
				}

				return true;
			};

			/**
			 * Find existing doelniveau with exact same references
			 * Only match on reference properties (*_id)
			 */
			var findDoelniveau = function(dn) {
				for (const key in dn) {
					if (key.substr(key.length-3)=='_id') {
						for (const id of dn[key]) {
							var idReferences = curriculum.index.references[id];
							if (idReferences && idReferences.length) {
								for (const refid of idReferences) { //var i=0, l=idReferences.length; i<l; i++) {
									// var refid = idReferences[i]; 
									if (curriculum.index.type[refid]=='doelniveau') {
										if (isMatch(dn, curriculum.index.id[refid])) {
											return refid;
										}
									}
								}
							}
						}
					}
				}
				return false;
			}

			var filterDuplicateDoelniveaus = function() {
				if (context.data.doelniveau) {
					// build a reverse index for all references to doelniveau's in this context
					var refIndex = {};
					Object.keys(context.index.id).forEach(id => {
						var e = context.index.id[id];
						if (e.doelniveau_id) {
							e.doelniveau_id.forEach(childId => {
								if (!refIndex[childId]) {
									refIndex[childId] = [];
								}
								refIndex[childId].push(id);
							});
						}
					});

					// now merge doelniveau's in this context that are identical
					// FIXME:/TODO: implement

					// now merge doelniveau's with curriculum doelniveau's that are identical
					context.data.doelniveau.forEach((dn,index) => {
						var id = findDoelniveau(dn);
						if (id && id!=dn.id) {
							Object.keys(context.data).forEach(type => {
								if (type!='doelniveau') {
									context.data[type].forEach(e => {
										if (e.doelniveau_id) {
											var dnIndex = e.doelniveau_id.indexOf(dn.id);
											if (dnIndex>=0) {
												console.log('replacing link to doelniveau '+dn.id+' with '+id+' in '+e.id+' ('+context.index.type[e.id]+')');
												e.doelniveau_id.splice(dnIndex, 1);
												if (!e.doelniveau_id.includes(id)) { // replacement doelniveau may already be there
													e.doelniveau_id.push(id);
												}
											}
										}
									});
								}
							});
							var removed = context.data.doelniveau.splice(index, 1);
							console.log('removed duplicate doelniveau '+removed[0].id);
						}
					});
				}
			};

			function mergeEntityChildrenWithOtherNiveaus(entity, original, context) {
				var schema = curriculum.index.schema[original.id];
				Object.keys(original).forEach(prop => {
					if (prop.substr(prop.length-3)=='_id' && Array.isArray(original[prop])) {
						var missing = original[prop].filter(childId => {
							return !entity[prop] || entity[prop].indexOf(childId)==-1;
						});
						if (missing.length) {
							// remove children from other contexts, except doelniveau
							missing = missing.filter(childId => {
								return curriculum.index.type[childId] == 'doelniveau' || curriculum.index.schema[childId]==schema;
							});
						}
						if (missing.length && entity.deletedChildren.length) {
							// remove children that are explicitly deleted
							missing = missing.filter(childId => entity.deletedChildren.indexOf(childId)==-1);
						}
						if (missing.length) {
							// only merge childId's back that are used in niveau's not part of this excel sheet
							var toMerge = missing.filter(childId => {
								var niveaus = getNiveaus(childId);
								var extraNiveaus = niveaus.filter(niveauId => context.niveaus.indexOf(niveauId)==-1);
								return extraNiveaus.length>0;
							});
							// or have roots not part of this excel sheet
							toMerge = toMerge.concat(missing.filter(childId => {
								var roots = getRoots(childId).filter(rootId => [context.root,original.id].indexOf(rootId)!=-1);
								return roots.length>0;
							}));
							if (toMerge.length) {
								if (!entity[prop]) {
									entity[prop] = [];
								}
								entity[prop] = [... new Set(entity[prop].concat(toMerge))];
							}
						}
					}
				});
/*

					if (original.doelniveau_id) {
						original.doelniveau_id.forEach(dnId => {
							let dn = curriculum.index.id[dnId];
							if (entity.doelniveau_id && entity.doelniveau_id.indexOf(dnId)!== -1) {
								return; // already linked
							}
							if (!dn.niveau_id) {
								// broken doelniveau, keep it, we'll fix it later
								if (!entity.doelniveau_id) {
									entity.doelniveau_id = [];
								}
								entity.doelniveau_id.push(dn.id);
							} else if (!dn.niveau_id.every(niId => context.niveaus.includes(niId))) {
								// this doelniveau contains a niveau id that is not in the uploaded excel sheet
								// so add this doelniveau to the entity
								if (!entity.doelniveau_id) {
									entity.doelniveau_id = [];
								}
								entity.doelniveau_id.push(dn.id);
							}
						});
					}
*/
			}

			tree.walk(node, function(myNode, parents) {
				var entity = new Entity(myNode, context, schema);
				if (entity.delete === 'x') {
					return;
				}
				var myNodeType = myNode.type ? myNode.type : context.index.type[myNode.id];
				if (!myNodeType) {
					return;
				}
				var schema = tree.findSchema(myNodeType);
				if (entity.level) {
					var niveaus = tree.getNiveausFromLevel(entity, context.errors);
					entity.niveau_id = niveaus;
				}
				if (myNode.children && myNode.children.length) {
					myNode.children.forEach(function(child) {
						var childType = child.type ? child.type : context.index.type[child.id];
						if (!child.delete || child.delete!='x') {
							addChildLink(entity, child, schema);
						}
					});
				}

				// final check that all properties are known properties for each entity
				// doing that now, because addChildLink moves some properties around
				var jsonSchema = tree.findSchema(myNodeType);
				var properties = jsonSchema.properties[myNodeType].items.properties;
				var ignoreList = ['_node','_rows','_row','children','deletedChildren','parents','level','type'];
				Object.keys(entity).forEach(prop => {
					if (typeof entity[prop] !== 'undefined' && !properties[prop]) {
						if (!ignoreList.includes(prop) && entity[prop]!=='') {
							if (prop == 'niveau_id') {
								delete entity.niveau_id;
							} else {
								context.errors.push(new Error(myNode._tree.fileName, 'Eigenschap &quot;'+prop+'&quot; is onbekend voor '+myNodeType, myNode, [myNode]));
							}
						}
					}
				});

				let original = curriculum.index.id[entity.id];
				if (original) {
					if (curriculum.index.type[entity.id] !== myNodeType) {
						context.errors.push( new Error(myNode._tree.fileName, 'Type matched niet, origineel heeft type '+curriculum.index.type[entity.id]+', row heeft type: '+myNodeType, myNode, [myNode]));
					}
					// here we have a single tree with just the myNodes contained in the sheet
					// but the sheet doesn't have all myNodes, only for specific levels
					// so for all the levels not in this sheet, add entity links from the current
					// entities before importing this sheet.
					// example: we are importing a sheet with information for level 'havo'
					// the full tree also contains information for level 'vwo'
					// importing this sheet must not result in removal of the entities linked to 'vwo'
					// this is not limited to doelniveau_id entries, but also inhoud entities
					// so we need the niveauIndex for those
					mergeEntityChildrenWithOtherNiveaus(entity, original, context);
				}

				if (!context.data[myNodeType]) {
					context.data[myNodeType] = [];
				}
				if (!context.index.id[myNode.id]) {
					context.data[myNodeType].push(entity);
					context.index.id[myNode.id] = entity;
				}
				if (!context.index.type[myNode.id]) {
					context.index.type[myNode.id] = myNodeType;
				}
			});
			if (!context.errors || !context.errors.length) {
				filterDuplicateDoelniveaus();
			}
			return context;
		},
		showChanges: function(el, sheetContexts) {
			function escapeHtml(unsafe) {
			    return unsafe
			         .replace(/&/g, "&amp;")
			         .replace(/</g, "&lt;")
			         .replace(/>/g, "&gt;")
			         .replace(/"/g, "&quot;")
			         .replace(/'/g, "&#039;");
			}

			var hasDiff = function(newEntity, originalEntity) {
				var props = Object.keys(newEntity);
				for (var i=0,l=props.length;i<l;i++) {
					var p = props[i];
					if (!originalEntity[p]) {
						return true;
					}
					if (typeof originalEntity[p] != typeof newEntity[p]) {
						return true;
					}
					if (Array.isArray(originalEntity[p])) {
						if (originalEntity[p].length != newEntity[p].length) {
							return true;
						}
						var so = new Set(originalEntity[p]);
						var se = new Set(newEntity[p]);
						for (var v of se) {
							if (!so.has(v)) {
								return true;
							}
						}
					} else if (originalEntity[p]!=newEntity[p]) {
						return true;
					}
				}
				return false;	
			};

			var cleanupByContext = function(contextName, type, entities) {
				var result = [];
				var schema = curriculum.schemas[contextName];
				if (!schema) {
					throw new Error('Unknown schema '+contextName);
				}
				var def    = schema.properties[type];
				if (!def) {
					throw new Error('Unknown property '+type+' in schema '+schema);
				}
				var props  = Object.keys(def.items.properties);

				entities.forEach(e => {
					var entity = {};
					props.forEach(p => {
						if (typeof e[p] != 'undefined') {
							entity[p] = e[p];
						}
					});
					if (curriculum.index.id[e.id]) {
						if (hasDiff(entity, curriculum.index.id[entity.id])) {
							result.push(entity);
						}
					} else {
						result.push(entity);
					}
				});
				return result;
			};

			// split sheetContexts into real contexts
			// each property in the correct curriculum-* context
			var toCurriculumContext = function(sheetContexts) {
				var schemas = {};
				sheetContexts.forEach(c => {
					Object.keys(c.data).forEach(type => {
						var schema = curriculum.getSchemaFromType(type);
						if (!schemas[schema]) {
							schemas[schema] = {};
						}
						if (!schemas[schema][type]) {
							schemas[schema][type] = [];
						}
						schemas[schema][type] = schemas[schema][type].concat(cleanupByContext(schema, type, c.data[type]));
					});
				});
				return schemas;
			};

			function getDiff(aNew, aOriginal) {
				if (!aOriginal) {
					var newEntries = aNew;
					var removedEntries = [];
				} else {
					var newEntries = aNew.filter(id => aOriginal.indexOf(id) === -1);
					var removedEntries = aOriginal.filter(id => aNew.indexOf(id) === -1);					
				}
				return [ newEntries.map(id => '<ins>+'+id+'</ins>').join(','), removedEntries.map(id => '<del>-'+id+'</del>').join(',')].join(',');
			}

			var output = '<h3>Gevonden wijzigingen</h3>';
			output += '<p>Selecteer de contexten die u wilt opslaan</p>';
			output += '<form data-simply-command="handle-changes">';
			var schemas = toCurriculumContext(sheetContexts);
			Object.keys(schemas).forEach(c => {
				output += '<details class="slo-changes slo-changes-context">';
				output += '<summary><input type="checkbox" checked name="applyChanges" value="'+escapeHtml(c)+'">' + escapeHtml(c) + '</summary>';
				Object.keys(schemas[c]).forEach(p => {
					var count = schemas[c][p].length;
					if (!count) {
						return;
					}
					output += '<details class="slo-changes slo-changes-type"><summary>' + escapeHtml(p) + ': ' + (count==1 ? '1 entiteit' : count + ' entiteiten') + '</summary>';
					schemas[c][p].forEach(e => {
						output += '<div class="slo-changes slo-changes-entity';
						var change = false;
						if (curriculum.index.id[e.id]) {
							change = curriculum.index.id[e.id];
							output += ' slo-changes-entity-updated';
						} else {
							output += ' slo-changes-entity-new';
						}
						output += '">';
						Object.keys(e).forEach(ep => {
							if (Array.isArray(e[ep])) {
								output += escapeHtml(ep)+': '+getDiff(e[ep], change[ep]);
							} else {
								output += escapeHtml(ep)+': <ins>'+JSON.stringify(e[ep])+'</ins>';
								if (change && change[ep] != e[ep]) {
									output += ' (was: <del>'+JSON.stringify(change[ep])+'</del>)';
								}
							}
							output += '<br>';
						});
						output += '</div>';
					});
					output += '</details>';
				});
				output += '</details>';
			});
			output += '<div><button>Verwerk wijzigingen</button></div>';
			el.innerHTML = output;
			console.log(schemas);
			editor.pageData.changedSchemas = schemas;
		},
		findSchema: function(prop) {
			prop = prop.trim().toLowerCase();
			if (prop.endsWith('_id')) {
				prop = prop.substring(0, prop.length-3);
			}
			var schema = null;
			Object.keys(curriculum.schemas).forEach(function(context) {
				if (curriculum.schemas[context].properties[prop]) {
					schema = curriculum.schemas[context];
				}
			});
			return schema;
		},
		getNiveausFromLevel: function(node, errors=[]) {
			if (!curriculum.index.niveauTitle) {
				curriculum.index.niveauTitle = {};
                curriculum.data.niveau.forEach(function(niveau) {
                    curriculum.index.niveauTitle[niveau.title.trim().toLowerCase()] = niveau;
                });
			}
			if (Array.isArray(node.level)) {
				var levels = node.level;
			} else {
				var levels = node.level.split(',').map(function(level) { return level.trim().toLowerCase(); });
			}
			return levels.map(function(level) {
				if (curriculum.index.niveauTitle[level]) {
					return curriculum.index.niveauTitle[level].id;
				} else {
					errors.push(new Error(node._tree.fileName, 'Onbekend niveau '+level, node, [Object.assign({}, node, {_row: node._rows.join(',')})]));
				}
			}).filter(Boolean);
		}
	};
