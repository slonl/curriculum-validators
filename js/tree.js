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
			self[key] = value.trim();
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
		var jsonSchema = tree.findSchema(node.type);
		if (!jsonSchema) {
			context.errors.push(new Error(node._tree.fileName, 'Type '+node.type+' is onbekend',node,[node]));
			this.id = node.id;
			this.type = node.type;
		} else {
			if (node['verwijst naar:']) {
				var targetId = node['verwijst naar:'];
				var targetType = curriculum.index.type[targetId];
				if (targetType) {
					node[targetType+'_id'] = [targetId];
				}
				delete node['verwijst naar:'];
			}
			
			var ignoreList = ['_rows','_row','children','deletedChildren','level','type'];
			Object.keys(node).forEach(function(prop) {
				self[prop] = node[prop];
				if (self[prop] === '-') { // '-' is used to mark deletion of a property
					delete self[prop]; // TODO: check if we should do that here or later
				}
				var properties = jsonSchema.properties[node.type].items.properties;
				if (typeof self[prop] !== 'undefined' && properties[prop]) {
					switch(properties[prop].type) {
						case 'integer':
							if (String.isString(self[prop])) {
								if (isNaN(Number(self[prop]))) {
									context.errors.push(new Error(node._tree.fileName, 'Eigenschap '+prop+' moet een integer zijn',node,[node]));
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
								context.errors.push(new Error(node._tree.fileName,'Eigenschap '+prop+' moet een array zijn',node,[node]));
							}
						break;
						case 'string':
						default:
							self[prop] = ''+self[prop];
						break;
					}
				} else if (!ignoreList.includes(prop)) {
					context.errors.push(new Error(node._tree.fileName, 'Eigenschap '+prop+' is onbekend voor '+node.type, node, [node]));
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

	var defaultProps = ['_row','ID','Prefix','Title'];
	function Error(file, error, node=null, rows=null, props=[]) {
		this.file = file;
		this.error = error;
		this.props = defaultProps.concat(props);
		this.node = node;
		this.rows = rows;
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
							if (node.deleted=='x') {
								delete node.deleted; //CHECK: laten staan voor foutmeldingen?
								parent.deletedChildren.push(node.id);
							} else if (node.deleted) {
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
								if (node.level.substr(0,2)=='--') {
									return; // this is a comment
								}
								var levels = node.level.split(',').map(function(level) { return level.trim().toLowerCase(); });
								combinedNode.level = [... new Set(combinedNode.level.concat(levels))];
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
								} else if (combinedNode[property].trim()!=node[property].trim()) {
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
					type: {}
				},
				errors: [],
				data: {
					doelniveau: []
				}
			};
			var moveDoelniveauProps = function(doelniveau, child) {
				var dnProps = curriculum.schemas['curriculum-basis'].properties.doelniveau.items.properties;
				var childType = child.type ? child.type : context.index.type[child.id];
				var childSchema = tree.findSchema(childType);
				if (childSchema) {
					var childProps = childSchema.properties[childType].items.properties;
					Object.keys(dnProps).forEach(p => {
						if (p!='id' && dnProps[p].type!='array' && child[p]) { //ignore arrays, only copy simple values
							doelniveau[p] = child[p];
							if (!childProps[p]) {
								delete child[p];
							}
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
				niveaus.forEach(function(niveau) {
					var dn = {
						id: curriculum.uuidv4(),
						type: 'doelniveau',
						niveau_id: [ niveau ]
					}; 
					var doelniveau = new Entity(dn, context, schema);
					doelniveau[prop+'_id'] = [ child.id ];
					moveDoelniveauProps(doelniveau, child);
					entity.doelniveau_id.push(doelniveau.id);
					context.data.doelniveau.push(doelniveau);
					context.index.id[doelniveau.id] = doelniveau;
					context.index.type[doelniveau.id] = 'doelniveau';
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
				var childSchema = tree.findSchema(childType);
				var childProperties = [];
				if (childSchema && childSchema.properties[childType]) {
					childProperties = childSchema.properties[childType].items.properties;
				} else {
					context.errors.push( new Error(entity._tree.fileName, 'Type '+childType+' is onbekend', child, [curriculum.clone(entity)]));
					return;
				}
				if (entityProperties[childType+'_id']) { // default case
					if (!entity[childType+'_id']) {
						entity[childType+'_id'] = [];
					}
					entity[childType+'_id'].push(child.id);
				} else if (childProperties[entityType+'_id']) { // reverse parent child link
					child.children.push(entity);
				} else if (isDoelniveauLink(childType, entityType, schema)) {
					// child is linked to parent entity through doelniveau
					makeDoelniveau(entity, childType, child);
				} else if (isDoelniveauChild(childType) && isDoelniveauChild(entityType)) {
					// if so combine child in the entity's doelniveau
					// doelniveau[child.type+'_id'] must have no other entries
					// FIXME: implement this
					var doelniveau = context.data.doelniveau.filter(e => e[entityType+'_id'] && e[entityType+'_id'].includes(entity.id));
					if (!doelniveau) {
						debugger;
					}
					if (!doelniveau[entityType+'_id']) {
						doelniveau[entityType+'_id'] = [];
					}
					doelniveau[entityType+'_id'].push(entity);
					moveDoelniveauProps(doelniveau, entity);
				} else if (isDoelniveauParent(childType) && isDoelniveauChild(entityType)) {
					// reverse parent child relation
					var doelniveaus = context.data.doelniveau.filter(e => e[entityType+'_id'] && e[entityType+'_id'].includes(entity.id));
					if (!doelniveaus) {
						debugger;
					}
					if (!child.doelniveau_id) {
						child.doelniveau_id = [];
					}
					var doelniveau = doelniveaus.pop(); // pick the last defined doelniveau
					child.doelniveau_id.push(doelniveau.id);
				}
			};

			tree.walk(node, function(node, parents) {
				var entity = new Entity(node, context, schema);
				if (entity.delete === 'x') {
					return;
				}
				var nodeType = node.type ? node.type : context.index.type[node.id];
				var schema = tree.findSchema(nodeType);
				if (node.children && node.children.length) {
					node.children.forEach(function(child) {
						if (child.prefix=="na/1/obhavo") {
							debugger;
						}
						var childType = child.type ? child.type : context.index.type[child.id];
						if (!node.delete=='x' && !isValidChildType(childType, nodeType, schema)) {
							context.errors.push( new Error(node._tree.fileName, 'Type '+childType+' is geen valide kind van '+nodeType, child, [node, child]));
							return;
						}
						addChildLink(entity, child, schema);
					});
				}
				if (!context.data[nodeType]) {
					context.data[nodeType] = [];
				}
				if (!context.index.id[node.id]) {
					context.data[nodeType].push(entity);
					context.index.id[node.id] = entity;
				}
				if (!context.index.type[node.id]) {
					context.index.type[node.id] = nodeType;
				}
			});
/*
			Object.keys(context.data).forEach(function(prop) {
				if (prop=='doelniveau') {
					return;
				}
				context.data[prop].forEach(function(entity) {
					makeDoelniveaus(entity, context);
				});
			});
*/
			return context;
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
					errors.push(new Error(node._tree.fileName, 'Onbekend niveau '+level, node, [Object.assign(node, {_row: node._rows.join(',')})]));
				}
			}).filter(Boolean);
		}
	};
