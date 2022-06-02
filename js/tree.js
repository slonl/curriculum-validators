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
		var aliases = {
			'ID': 'id',
			'Title':'title',
			'Description':'description',
			'ParentID':'parentId',
			'Level':'level',
			'Prefix':'prefix',
			'Type':'type'
		};
		Object.keys(row).forEach(function(key) {
			var value = ''+row[key]; // force entries to string
			if (aliases[key]) {
				key = aliases[key];
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
		this._rowData = row;
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
		if (curriculum.index.deprecated[node.id]) {
			context.errors.push(new Error(node._tree.fileName, 'ID '+node.id+' is deprecated',node,[node]));
		} else if (curriculum.index.type[node.id] && curriculum.index.type[node.id]!=node.type) {
			context.errors.push(new Error(node._tree.fileName, 'Type mag niet veranderen bij importeren, was '+curriculum.index.type[node.id]+', aangepast naar '+node.type, node, [node]));
		} else if (!curriculum.index.id[node.id]) {
			// @TODO: check to make sure we don't add entities to other contexts
			// except for tags/alias/doelniveaus/doelen
			// 1 - get the root entity schema
			// 2 - check that it is the same as this entities schema (jsonSchema)
			// 3 - if not, check that the jsonSchema is for curriculum-basis and the entity type is one of tag/alias/doelniveau/doel
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
				} else {
					context.errors.push(new Error(node._tree.fileName, 'Verwijst naar referentie '+targetId+' is deprecated:',node,[node]));
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
							if (typeof self[prop] === 'string' || self[prop] instanceof String) {
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
			return [id];
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
			var createNode = function(row, index, myTree) {
				var node = new Node(myTree, index, row);
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
				return node;
			}
			var createNodes = function(rows, myTree) {
				rows.forEach((row, index) => createNode(row, index+2, myTree)); // sheet is 1-indexed and has a header row
			};

			// fill in missing doelniveau's, since these are position (row) dependent
			/*
				in:
					entity A
						doel X
							kerndoel Y
				out:
					entity A
						doelniveau Z
							doel X
							kerndoel Y
			*/
			// if we do this after building the tree, doel X will have incorrect child kerndoel Y
			var insertDoelniveaus = function(myTree) {
				
				// get node with id with highest index < topIndex
				var findNodeByID = function(id, topIndex) {
					if (!myTree.ids[id]) {
						return null
					}
					var allNodes = myTree.ids[id].slice();
					allNodes.reverse();
					var node = null;
					do {
						node = allNodes.pop();
					} while(node && node._row>=topIndex);
					return node;
				};

				var canHaveChild = function(parent, child) {
					var parentSchema = tree.findSchema(parent.type);
					return typeof parentSchema.properties[parent.type].items.properties[child.type+'_id'] != 'undefined';
				};

				var hasDoelniveauLink = function(parent, child) {
					var parentSchema = tree.findSchema(parent.type);
					if (typeof parentSchema.properties[parent.type].items.properties.doelniveau_id != 'undefined') {
						var basisSchema = tree.findSchema('doelniveau');
						return typeof basisSchema.properties.doelniveau.items.properties[child.type+'_id'] != 'undefined';
					}
					return false;
				};

				var removeDoelniveauProperties = function(dn, node) {
					//var basisSchema = tree.findSchema('doelniveau');
					// properties allowed on doelniveau
					var dnAllowed = ['id','parentId','type','level','ce_se','prefix','children','deletedChildren'];
					// properties to move from child to doelniveau
					var dnMove = ['level','ce_se','prefix'];
					dnMove.forEach(p => {
						if (typeof dn[p]!='undefined' && typeof node[p]!='undefined' && dn[p]==node[p]) {
							delete node[p];
						}
					});
					Object.keys(dn).forEach(p => {
						if (p[0]!='_' && !dnAllowed.includes(p)) {
							delete dn[p];
						}
					});
				};

				var moveDoelniveauChildren = function(node, doelniveau, myTree) {
					//FIXME: assumes doelniveau children have no child rows themselves
					//FIXME: assumes all doelniveau children occur immediately after node._row in the sheet
					var index = node._row+1;
					do {
						var nextChild = myTree.all[index];
						if (nextChild && nextChild.parentId == node.id) {
							nextChild.parentId = doelniveau.id;
						} else {
							nextChild = null;
						}
						index++
					} while(nextChild);
				};

				var insertDoelniveau = function(parent, node, myTree) {
					// create new row with type doelniveau and new uuid and index node._row
					// TODO: check if there is an assumption later that _row is unique
					var newIndex = myTree.all.length+1;
					var fakeRow = curriculum.clone(node._rowData);
					// change id to new uuid, existing doelniveaus will be searched for later
					fakeRow.id = curriculum.uuidv4();
					fakeRow.type = 'doelniveau';
					myTree.generatedDoelniveaus.push(fakeRow.id);

					// insert doelniveau as child of parent
					fakeRow.parentId = parent.id;
					var dn  = createNode(fakeRow, newIndex, myTree);
					myTree.all[newIndex] = dn;

					// move node to child of doelniveau
					node.parentId = dn.id;

					// remove properties from node that are now in doelniveau (prefix, level, ce_se, ?)
					removeDoelniveauProperties(dn, node);

					// move children of node to dn
					moveDoelniveauChildren(node, dn, myTree);
				};

				if (tree.roots) {
					throw new Exception('Doelniveaus must be inserted before building the tree structure');
				}
				var nodes = myTree.all;
				nodes.forEach((node, index) => {
					if (!node.parentId) {
						return;
					}
					let parentId = node.parentId;
					if (ids[parentId]) {
						parentId = ids[parentId];
					}
					let parent = findNodeByID(parentId, index); // find last definition of parentId
					if (parent && !canHaveChild(parent, node)) {
						// maybe need to insert doelniveau
						if (hasDoelniveauLink(parent, node)) {
							// insert doelniveau, move next set of child rows to that doelniveau, if possible
							insertDoelniveau(parent, node, myTree);
						}
					}
					if (!parent) {
						myTree.errors.push(new Error(myTree.fileName,'Missende Parent '+parentId,node,[node],['ParentID']));
					}
				});
			};

			var myTree = {
				fileName: filename,
				roots: [],
				all: [],
				ids: {},
				errors: [],
				generatedDoelniveaus: []
			};
			var ids = {};
			var firstNode = null;
			// first create all nodes and give them uuids if not yet set
			createNodes(data, myTree);

			// expose ids for debugging
			window.idToUuid = ids;

			// do this before building the tree structure, or the tree will be incorrect.
//			var reverseGeneratedDoelniveaus = {};
			insertDoelniveaus(myTree);

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
							case '_rowData':
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
											'Verschil in data '+property+' was &quot;'+JSON.stringify(combinedNode[property])+'&quot; nu &quot;'+JSON.stringify(node[property])+'&quot;',
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
	        var title = (entity.prefix ? entity.prefix + ' ' : '') + (entity.title ? entity.title : entity.id);

	        var result = '<details><summary class="slo-treeview-title" data-simply-value="'+entity.id+'" title="'+escapeQuotes(entity.id)+'">';
	        result += '<span class="slo-tag">'+entity.type+'</span><span class="slo-title">'+title+'</span>';
			if (entity.level) {
				result += '<span class="slo-level">'+entity.level+'</span>';
			}
			result += '</summary>';
	        result += '<div class="slo-treeview-children">';

	        if (entity.children) {
		        entity.children.forEach(function(child) {
		            result += tree.render(child);
		        });
			}
	        result += '</div></details>';

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
				var props = Object.keys(dn).filter(p => p.substr(0,1)!='_');
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
			 * Return an array of child id's from *_id references in entity
			 */
			var getChildren = function(entity) {
				var children = new Set();
				for (const key in entity) {
					if (key.substr(key.length-3,3)==='_id') {
						children = new Set([...children].concat(entity[key]));
					}
				}
				return [...children];
			}

			/**
			 * Find existing doelniveau with exact same references
			 * Only match on reference properties (*_id)
			 */
			var findDoelniveau = function(dnId, refIndex) {
				var dn = context.index.id[dnId];
				var possibles = new Set;
				for (const childId of getChildren(dn)) {
					// find all doelniveaus that reference this child
					var refs = curriculum.index.references[childId];
					if (!refs) {
						return false; // no current entities reference this childId, e.g. because it is new in this sheet
					}
					var childDnRefs = new Set(refs.filter(id => curriculum.index.type[id]=='doelniveau'));
					if (!possibles.size) {
						possibles = childDnRefs;
					} else {
						// filter, keep only those that are already in the possibles list
						possibles = new Set([...possibles].filter(id => childDnRefs.has(id)));
					}
					if (!possibles.size) {
						// no possible match, so don't continue
						return false;
					}
				}
				for (const possibleMatch of possibles) {
					if (isMatch(dn, curriculum.index.id[possibleMatch])) {
						return possibleMatch;
					}
				}
				return false;
			}

			var replaceDoelniveau = function(entity, oldId, newId) {
				if (!entity.doelniveau_id) {
					throw new Error('Entity '+entity.id+' has no doelniveau_id');
				}
				var dnIndex = entity.doelniveau_id.indexOf(oldId);
				if (dnIndex>=0) {
					console.log('replacing link to doelniveau '+oldId+' with '+newId+' in '+entity.id+' ('+context.index.type[entity.id]+')');
					entity.doelniveau_id.splice(dnIndex, 1);
					if (!entity.doelniveau_id.includes(newId)) { // replacement doelniveau may already be there
						entity.doelniveau_id.push(newId);
					}
				}
			};

			var replaceDuplicateDoelniveaus = function() {
				if (!node._tree.generatedDoelniveaus.length) {
					return;
				}
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
				node._tree.generatedDoelniveaus.forEach(dnId => {
					var id = findDoelniveau(dnId);
					if (id && id!=dnId) {
						// replace references to dn.id to id
						if (refIndex[dnId]) {
							refIndex[dnId].forEach(refId => {
								var entity = context.index.id[refId];
								replaceDoelniveau(entity, dnId, id);
							});
						}
						// remove dn from context.data.doelniveau
						context.data.doelniveau = context.data.doelniveau.filter(e => e.id!=dnId);
						delete context.index.id[dnId];
						delete context.index.type[dnId];
					} else {
						console.log('No substitute doelniveau found for '+dnId);
					}
				});
			}

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
								console.log('unknown prop',prop,properties,myNodeType);
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
				//filterDuplicateDoelniveaus();
				replaceDuplicateDoelniveaus();
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

			var is_string = function(e) {
				return typeof e == 'string' || e instanceof String;
			};

			var onewayDiff = function(entityA, entityB) {
				//FIXME: check only properties from schema
				var props = Object.keys(entityA).filter(p => p.substr(0,1)!='_').filter(p => p!='dirty' && p!='sloID');
				for (var i=0,l=props.length;i<l;i++) {
					var p = props[i];
					if (!entityA[p] && !entityB[p]) {
						return false; // empty values or undefined or '' are the same
					}
					if (!entityB[p]) {
						return true; // entityA[p] is not empty, entityB[p] is
					}
					if (typeof entityB[p] != typeof entityA[p]) {
						return true; // at least one of them is not empty and types do not match
					}
					if (Array.isArray(entityB[p])) {
						if (entityB[p].length != entityA[p].length) {
							return true;
						}
						var so = new Set(entityB[p]);
						var se = new Set(entityA[p]);
						for (var v of se) {
							if (!so.has(v)) {
								return true;
							}
						}
					} else if (entityB[p]!=entityA[p]) {
						if (!is_string(entityB[p]) || !is_string(entityA[p]) || entityB[p].trim() != entityA[p].trim()) {
							return true; // at least one of them is not empty and values do not match
						}
					}
				}
				return false;
			};

			var hasDiff = function(newEntity, originalEntity) {
				return onewayDiff(newEntity, originalEntity) || onewayDiff(originalEntity, newEntity);
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
			var total = 0;
			Object.keys(schemas).forEach(c => {
				var schemaTotal = 0;
				schemaOutput = '<details class="slo-changes slo-changes-context">';
				schemaOutput += '<summary><input type="checkbox" checked name="applyChanges" value="'+escapeHtml(c)+'">' + escapeHtml(c) + '</summary>';
				Object.keys(schemas[c]).forEach(p => {
					var count = schemas[c][p].length;
					if (!count) {
						return;
					}
					schemaTotal+=count;
					schemaOutput += '<details class="slo-changes slo-changes-type"><summary>' + escapeHtml(p) + ': ' + (count==1 ? '1 entiteit' : count + ' entiteiten') + '</summary>';
					schemas[c][p].forEach(e => {
						schemaOutput += '<div class="slo-changes slo-changes-entity';
						var change = false;
						if (curriculum.index.id[e.id]) {
							change = curriculum.index.id[e.id];
							schemaOutput += ' slo-changes-entity-updated';
						} else {
							schemaOutput += ' slo-changes-entity-new';
						}
						schemaOutput += '">';
						Object.keys(e).forEach(ep => {
							if (Array.isArray(e[ep])) {
								var diff = getDiff(e[ep], change[ep]);
								if (diff != ',') {
									schemaOutput += escapeHtml(ep)+': '+diff+'<br>';
								}
							} else {
								if (change && change[ep] != e[ep] && (change[ep] || e[ep])) {
									schemaOutput += escapeHtml(ep)+': <ins>'+JSON.stringify(e[ep])+'</ins>';
									schemaOutput += ' (was: <del>'+JSON.stringify(change[ep])+'</del>)'+'<br>';
								} else if (['title','prefix','id'].includes(ep)) {
									schemaOutput += escapeHtml(ep)+': '+JSON.stringify(e[ep])+'<br>';
								}
							}
						});

						schemaOutput += '</div>';
					});
					schemaOutput += '</details>';
				});
				schemaOutput += '</details>';
				if (schemaTotal>0) {
					output += schemaOutput;
					total+=schemaTotal;
				}
			});
			output += '<div><button>Verwerk wijzigingen</button></div>';
			if (total>0) {
				el.innerHTML = output;
				console.log(schemas);
				editor.pageData.changedSchemas = schemas;
			} else {
				el.innerHTML = '<h3>Geen wijzigingen gevonden</h3>';
				editor.pageData.changedSchemas = [];
			}
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
