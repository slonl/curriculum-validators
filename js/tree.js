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

	function Node(row, index, tree) {
		var self = this;
		Object.keys(row).forEach(function(key) {
			var value = ''+row[key]; // force entries to string
			if (key=='ParentID') {
				key = 'parentId';
			} else {
				key = key.toLowerCase();
			}
			self[key] = value.trim();
		});
		this.children = [];
		this._row = index;
		Object.defineProperty(this, '_tree', {
			value: tree,
			writable: false,
			enumerable: false
		});
	}

	function Entity() {
		this._rows = [];
		this.children = [];
		this.parents = [];
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
			})
			.then(function(trees) {
				console.log(trees);
				return trees;
				/*
					var errors = [];
					trees.forEach(function(tree) {
						if (tree.errors) {
							errors = errors.concat(tree.errors);
						}
					});
					console.log(errors);
					editor.pageData.errors = errors;
				*/
				// assume contexts have been loaded
				var schema = curriculum.schemas[context];
				var jsonSets = trees.map(function(myTree) {
					return tree.convertToJSONSchema(myTree, schema);
				});
			});
		},
		buildFromArray: function(data, filename='') {
			var myTree = {
				fileName: filename,
				roots: [],
				all: [],
				ids: {},
				errors: []
			};
			var ids = {};

			data.forEach(function(row, index) {
				var node = new Node(row, index+2, myTree); // sheet is 1-indexed and has a header row
				myTree.all[index] = node;
				var nodeID = node.id ? (''+node.id).trim() : null;
				if (!nodeID) {
					nodeID = node.id = curriculum.uuidv4();
				} else if (!nodeID.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
					if (!ids[nodeID]) {
						ids[nodeID] = uuidv4();
					}
					nodeID = ids[nodeID];
				}
				if (!myTree.ids[nodeID]) {
					myTree.ids[nodeID] = [];
				}
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
							parent.children.push(node.id);
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
			// multiple entries for an ID have the same data
			Object.keys(myTree.ids).forEach(function(id) {
				myTree.ids[id] = myTree.ids[id].reduce(function(combinedNode, node) {
					Object.keys(node).forEach(function(property) {
						switch(property) {
							case '_row':
								combinedNode._rows.push(node._row);
							break;
							case 'children':
								combinedNode.children = [... new Set(combinedNode.children.concat(node.children))];
							break;
							case 'parentId':
								// there is no need for the ParentID anymore, as we now have children
								// combinedNode.parents = [... new Set(combinedNode.parents.concat(node.ParentID))];
							break;
							default:
								if (!combinedNode.hasOwnProperty(property)) {
									combinedNode[property] = node[property];
								} else if (combinedNode[property].trim()!=node[property].trim()) {
									// explicitly allow later nodes to leave out everything except ID by only iterating
									// over the defined properties in node
									myTree.errors.push(new Error(
										myTree.fileName,
										'Verschil in data '+property+' was '+combinedNode[property]+' nu '+node[property],
										node,
										myTree.ids[id],
										[
											property
										]
									));
								}
							break;
						}
					});
					return combinedNode;				
				}, new Entity());
			});
			if (!myTree.errors.length) {
				myTree = tree.combineNodes(myTree);
			}
			return myTree;
		},
		combineNodes: function(myTree) {
			// walk the root
			var newTree = {
				fileName: myTree.fileName,
				ids: myTree.ids,
				root: myTree.ids[myTree.roots[0].id]
			};
			var walk = function(node, callback) {
				node.children.forEach(function(nodeID) {
					walk(newTree.ids[nodeID], callback);
				});
				callback(node);
			};
			walk(newTree.root, function(node) {
				node.children = node.children.map(function(nodeID) {
					return newTree.ids[nodeID];
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
	        result += '<span class="slo-tag">'+entity.type+'</span><span class="slo-title">'+title+'</span></span>';
	        result += '<div class="slo-treeview-children">';

	        if (entity.children) {
		        entity.children.forEach(function(child) {
		            result += tree.render(child);
		        });
			}
	        result += '</div>';

	        return result;
	    }		
		
	};
