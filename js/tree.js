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

	function getExcelIndex(node) {
		return '['+node._tree.fileName+':'+node._row+']';
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
						errors.push({'file': file.name,'error': error});
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
				// assume contexts have been loaded
				var schema = curriculum.schemas[context];
				var trees = combinedSheets.map(function(sheet) {
					return tree.buildFromArray(sheet, sheet.fileName);
				});
				return trees;
			})
			.then(function(trees) {
				console.log(trees);
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
			data.forEach(function(row, index) {
				var node = new Node(row, index+2, myTree); // sheet is 1-indexed and has a header row
				myTree.all[index] = node;
				var nodeID = node.ID ? (''+node.ID).trim() : null;
				if (!nodeID) {
					nodeID = node.ID = curriculum.uuidv4();
				}
				if (!myTree.ids[nodeID]) {
					myTree.ids[nodeID] = [];
				}
				myTree.ids[nodeID].push(node);
			});
			// link parents to children
			// find rootnodes
			myTree.all.forEach(function(node, index) {
				var parentID = node.ParentID ? (''+node.ParentID).trim() : null;
				if (!parentID) {
					myTree.roots.push(node);
				} else {
					if (!myTree.ids[parentID]) {
						myTree.errors.push(getExcelIndex(node)+' Missende Parent, parentID '+parentID);
					} else {
						myTree.ids[parentID].forEach(function(parent) {
							parent.children.push(node);
						});
					}
				}
			});
			return myTree;
		}
	};
