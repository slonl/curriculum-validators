importSheet = (function() {

    function RowNode(row, index) {
        var self = this;
        Object.keys(row).forEach(function(key) {
            var value = ''+row[key]; // all entries in sheets should be a string, force it here
            self[key] = value.trim();
        });
        this._id = index;
    }

    function buildTree(sheet, config) {
        if (!config) {
            config = {};
        }
        config = Object.assign({
            parentID: 'ParentID',
            ID: 'ID',
            title: 'Title',
            type: 'Type',
            prefix: 'Prefix',
            topLevel: 'Vak'
        }, config);


		console.log('sheet: '+sheet.fileName);
        var tree = {
			fileName: sheet.fileName,
            childID: [],
            all: [],
            ids: {},
            fullIds: {},
            errors: [],
            fixes: [],
            config: config
        };

        var hasParent = [];

		var getExcelIndex = function(node) {
			return '['+node._sheet+':'+node._row+'] ';
		}

        //FIXME: build tree with full OBK ids, so vak, vak+vakkern, vak+vakkern+vaksubkern, etc.
        // this fixes the problem when two identical OBK ids occur under different parents
        // without this fix, all children of these identical OBK ids will appear in all parents

        // step 1: create a stack with the current ID chain
        // read row
        // if row.ParentID matches current top ID in the stack, push row.ID on the stack
        // if row.ParentID doesn't match the stack, pop the stack untill it does
        // row.fullID is now the full stack, so copy that

        var previousStacks = [];
        var idStack = [];
        var getFullID = function(node) {
            var localStack = idStack.slice();
            if (node.ParentID) {
                while (localStack.length && localStack[localStack.length-1] != node.ParentID) {
                    localStack.pop();
                }
                if (!localStack.length) {
                    // check previous stacks, with the same number of entries
                    for (var i=previousStacks.length-1;i>=0;i--) {
                        var localStack = previousStacks[i].slice();
                        if (localStack[localStack.length-1] == node.ParentID) {
                            break;
                        }
                    }
                    if (!localStack || localStack[localStack.length-1]!=node.ParentID) {
                        if (node.Type!='Vak') {
                            //FIXME: configure top level Type somewhere
//                            throw new Error('could not find ParentID',node);
                            tree.errors.push(getExcelIndex(node)+'Missende Parent '+node.ParentID+' bij '+node.ID+' '+node.Prefix+': '+node.Title+' ('+node.Type+')');
                        }
                    }
                }
            }
            localStack.push(node.ID);
            previousStacks.push(localStack);
            idStack = localStack;
            return idStack.join(';');
        };

        var getType = function(type) {
            var alias = config.alias;
            if (!type) {
                return '';
            }
            type = type.toLowerCase().trim();
            if (alias[type]) {
                type = alias[type];
            }
            return type;
        }


		var counter = 0;
        sheet.forEach(function(row, index) {			
            var node = new RowNode(row, counter);
			node._sheet = sheet.fileName;
			node._row = index+2; // excel begint bij row 1 (+1) en de titel row telt niet mee (+1)
			node.Type = getType(node.Type);
			if (!config.types[node.Type]) {
				if (config.filterTypes[node.Type]) {
	           		tree.fixes.push(getExcelIndex(node)+'Verwijderd volgens filterTypes lijst: '+node.Title+' ('+node.Type+')');
				} else {
	                tree.errors.push(getExcelIndex(node)+'Onbekend type: '+node.Title+' ('+node.Type+')');
				}
			} else {
	            tree.all[counter] = node;
	            var fullID = getFullID(node);
	            node.fullID = fullID;
	            tree.fullIds[fullID] = node;
	            if (!tree.ids[node[config.ID]]) {
	                tree.ids[node[config.ID]] = []; // allow more than one row with the same ID
	            }
	            tree.ids[node[config.ID]].push(node);
				counter++;
			}
        });

        // link parents to children
        tree.all.forEach(function(node, index) {
            if (config.parentID) {
                var parent = null;
                // first check the full chain of ID's up to the root
                var parentFullID = node.fullID.split(';');
                parentFullID.pop();
                parentFullID = parentFullID.join(';');
                if (parentFullID && parentFullID != node.fullID && tree.fullIds[parentFullID]) {
                    parent = tree.fullIds[parentFullID];
                }
                var rootFullID = node.fullID.split(';').shift();
                if (!parent) {
                     //now search for nearest row above this row, with ID==ParentID
                    for (var i=index-1;i>=0;i--) {
                        if (tree.all[i][config.ID] == node[config.parentID]) {
                            parent = tree.all[i];
                            var parentRootFullID = parent.fullID.split(';').shift();
                            if (parentRootFullID != rootFullID) {
                                parent = null;
                            } else {
                                tree.fixes.push(getExcelIndex(node)+'Missende Parent voor '+node.ID+' '+node.Prefix+': '+node.Title+' ('+node.Type+') - vervangen door '+parent.Prefix+': '+parent.Title+' ('+parent.Type+')');
                            }
                            break;
                        }
                    }
                }
                //if not found there, search the tree.ids
                if (!parent && node[config.parentID] && tree.ids[node[config.parentID]]) {
                    tree.ids[node[config.parentID]].forEach(function(parentNode) {
                        var parentRootFullID = parentNode.fullID.split(';').shift();
                        if (parentRootFullID == rootFullID) {
                            parent = parentNode; //FIXME: what if there is more than one?
                            tree.fixes.push(getExcelIndex(node)+'Missende Parent voor '+node.ID+' '+node.Prefix+': '+node.Title+' ('+node.Type+') - vervangen door '+parent.Prefix+': '+parent.Title+' ('+parent.Type+')');
                        }
                    });
                }
                if (!parent) {
                    hasParent[node._id]=false;
                    if (node.Type!=config.topLevel) { //FIXME: configure check on top level types
                        tree.errors.push(getExcelIndex(node)+'Missende ParentID bij '+node.ID+' '+node.Prefix+': '+node.Title+' ('+node.Type+')');
                    }
                } else {
                    if (!parent.childID) {
                        parent.childID = [];
                    }
                    parent.childID.push(node._id);
                    hasParent[node._id] = true;
                }
            } else {
                throw new Error('no parentID configured');
            }
        });

        // find all root nodes and add them to tree.roots
        tree.all.forEach(function(node) {
            if (!hasParent[node._id]) {
                tree.childID.push(node._id);
            }
        });
        return tree;
    }

    function flatten(arr, result = []) {
        for (let i = 0, length = arr.length; i < length; i++) {
            const value = arr[i];
            if (Array.isArray(value)) {
                flatten(value, result);
            } else {
                result.push(value);
            }
        }
        return result;
    }

    return {
        import: function(sheet, config) {
            var combinedSheet = [];
            Object.keys(sheet).forEach(function(sheetName) {
				if (sheetName != 'fileName') {
	                combinedSheet = combinedSheet.concat(sheet[sheetName]);
				}
            });
			combinedSheet.fileName = sheet.fileName;
            var errors  = 0;



            var tree = buildTree(combinedSheet, config);
            return tree;
        },
        toHTML: function(node, tree) {
            if (!tree) {
                tree = node;
            }
            var html = '<li>';
            if (tree.config.prefix && node[tree.config.prefix]) {
                html += node[tree.config.prefix]+' ';
            }
            if (node[tree.config.title]) {
                html += node[tree.config.title];
            }
            if (tree.config.type) {
                html+= ' ('+node[tree.config.type]+')';
            }
            if (node.childID) {
                html+='<ul>';

                var children = node.childID.map(function(id) {
                    return tree.all[id];
                });
                children = flatten(children);
                html+= children.map(function(node) {
                    return importSheet.toHTML(node, tree);
                }).join("");

                html+='</ul>';
            }
            html += '</li>';
            return html;
        },
        importAll: function(sheets, config, callback) {
            var trees = sheets.map(function(sheet) {
                return importSheet.import(sheet, config);
            });
            console.log(trees);
            var fulltree = {
                childID: [],
                all: [],
                ids: {},
                fullIds: {},
                errors: [],
				fixes: []
            };
            // read each tree and change node._id to have a sheet prefix
            // append the data to the fulltree
            trees.forEach(function(tree) {
                if (callback) {
                    tree = callback(tree); // allow changing each tree on its own
                }
                var offset = fulltree.all.length;
                tree.all.forEach(function(node) {
                    node._id += offset;
                    if (node.childID) {
                        node.childID = node.childID.map(function(chID) {
                            return chID + offset;
                        });
                    }
                    fulltree.all.push(node);
                    if (!fulltree.ids[node.ID]) {
                        fulltree.ids[node.ID] = [];
                    }
                    fulltree.ids[node.ID].push(node);
                    fulltree.fullIds[node.fullID] = node;
                });
                tree.childID.forEach(function(chID) {
                    fulltree.childID.push(chID+offset);
                });
				fulltree.errors = fulltree.errors.concat(tree.errors);
				fulltree.fixes  = fulltree.fixes.concat(tree.fixes);

                fulltree.config = tree.config;
            });
            // TODO: remove duplicate nodes - whith no difference in the data at all.
            return fulltree;
        },
        entities: function(tree, config) {
            // return an object with lists of entities created from the tree, based on the configuration (context) passed
            // check that each node has a type that matches with the config, or add an error for that node, including sheet _id
        }
    }
})();