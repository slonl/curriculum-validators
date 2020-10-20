var parseTree = function(tree, config, container) {
    console.log(tree);

    var defaultConfig = {
        //Vertaal lijst van bron types naar entiteiten types
        alias: {
            'vak': 'ldk_vak',
            'kern': 'ldk_vakkern',
            'subkern': 'ldk_vaksubkern',
            'inhoud': 'ldk_vakinhoud',
            'leerdoel': 'doel',
            'leerdoel kern': 'doel',
            'leerdoel subkern': 'doel'
        },
        // welke directe parents kunnen er in de excel boom staan, dus niet de uiteindelijke context
        typeParents: {
            'doel': ['ldk_vak','ldk_vakkern','ldk_vaksubkern','doelniveau'],
            'kerndoel': ['ldk_vak','ldk_vakkern','ldk_vaksubkern','doelniveau'],
            'doelniveau': ['ldk_vakinhoud','ldk_vaksubkern','ldk_vakkern','ldk_vak'],
            'ldk_vakinhoud': ['ldk_vaksubkern'],
            'ldk_vaksubkern': ['ldk_vakkern'],
            'ldk_vakkern': ['ldk_vak']
        },
        // welke direct kinderen kunnen er in de boom staan
        typeChildren: {
            'ldk_vak': ['ldk_vakkern','doelniveau','vak'],
            'ldk_vakkern': ['ldk_vaksubkern','doelniveau','vakkern'],
            'ldk_vaksubkern': ['ldk_vakinhoud','doelniveau','vaksubkern'],
            'ldk_vakinhoud': ['doelniveau','vakinhoud'],
            'doelniveau': ['doel','kerndoel']
        },
        // wat is de directe parent van de inhouden types
        hierarchy: {
            'ldk_vak': null,
            'ldk_vakkern': 'ldk_vak',
            'ldk_vaksubkern': 'ldk_vakkern',
            'ldk_vakinhoud': 'ldk_vaksubkern'
        },
        // welke types zijn er in de context beschikbaar (entiteit types)
        types: {
            'ldk_vak': true,
            'ldk_vakkern': true,
            'ldk_vaksubkern': true,
            'ldk_vakinhoud':true,
            'doelniveau':true,
            'doel':true,
            'kerndoel':true,
			'tag':true
        },
        // zijn gebruikte ID's links naar bestaande entiteiten, zoja onder welke property moeten ze bewaard worden
        links: {
            'ldk_vak': 'vak_id',
            'ldk_vakkern': 'vakkern_id',
            'ldk_vaksubkern': 'vaksubkern_id',
            'ldk_vakinhoud': 'vakinhoud_id'
        },
        // welke types worden in welk json bestand opgeslagen
        files: {
            'ldk_vak': 'ldk.vakken.json',
            'ldk_vakkern': 'ldk.vakkernen.json',
            'ldk_vaksubkern': 'ldk.vaksubkernen.json',
            'ldk_vakinhoud': 'ldk.vakinhouden.json',
            'doelniveau': 'doelniveaus.json',
            'doel': 'doelen.json',
            'tag': 'tags.json'
        },
        // welke niveau's zijn er, dit moet eigenlijk uit de curriculum-doelen context opgehaald worden
        niveaus: {
            'po': 'bk:512e4729-03a4-43a2-95ba-758071d1b725',
            'ob vmbo bb': '50d3e467-28c8-4c42-a0fe-e0000819ba39',
            'ob vmbo gl': '01aede69-edcd-4352-97e8-e16cb5d0015e',
            'ob vmbo kb': '2c0dd3c9-4432-4f0a-b103-f3ea2f5c1fc8',
            'ob vmbo tl': 'c63858da-23e4-4e1e-8456-b4aa13a6a826',
            'ob havo': '5ca732b3-3ec2-4b13-9f08-d55b8739fe31',
            'ob vwo': 'b5a4f104-fb2d-4c71-8f36-702d9567a752',
            'bb vmbo bb': '861d98e4-e5ae-4ed7-89f6-f224605f7c97',
            'bb vmbo gl': '64852857-b601-419f-9cbb-e1335a185303',
            'bb vmbo kb': '8574855d-0670-42bf-9f73-dc6706278b8b',
            'bb vmbo tl': '8450c011-f812-4f89-97a9-6b8820baffc5',
            'bb havo': '6dc8e1f2-a929-418f-b4e5-6be1204639da', 
            'bb vwo': 'caf5e806-cdb6-4d62-a5ed-0c3c1ff3e0bb',
        },
        // welke types mogen verwijderd worden
        filterTypes: {
            'doorlopende leerlijn': true
        },
        // wat is het bovenste niveau type
        topLevel: 'ldk_vak'
    };

    config = Object.assign(defaultConfig, config);

    if (!tree.fixes) {
        tree.fixes = [];
    }

    var reverseNiveaus = {};
    Object.keys(config.niveaus).forEach(function(niveau) {
        reverseNiveaus[config.niveaus[niveau]] = niveau;
    });

	var getExcelIndex = function(node) {
		return '['+node._sheet+':'+node._row+'] ';
	};

    var isUUID = function(id) {
        var RE = /^(bk:)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return RE.test(id);
    };

    function uuidv4() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    }

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    //non recursive flatten deep using a stack: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
    function flatten(input) {
      const stack = [...input];
      const res = [];
      while (stack.length) {
        // pop value from stack
        const next = stack.pop();
        if (Array.isArray(next)) {
          // push back array items, won't modify the original input
          stack.push(...next);
        } else {
          res.push(next);
        }
      }
      //reverse to restore input order
      return res.reverse();
    }

    var findChildrenByType = function(node, type) {
        if (node.Type == type) {
            return node;
        }
        if (node.childID) {
            var nodes = [];
            node.childID.forEach(function(chId) {
                var subnodes = findChildrenByType(tree.all[chId], type);
                if (subnodes) {
                    nodes = nodes.concat(subnodes);
                }
            });
            return flatten(nodes).filter(onlyUnique);
        }
        return null;
    };

    var removeChild = function(node, child) {
        child.ParentID = null;
		if (!node || !node.childID) {
			return;
		}
        node.childID = node.childID.filter(function(childId) {
            return childId!=child._id;
        });
    };

    var addChild = function(node, child) {
        if (!node.childID) {
            node.childID = [];
        }
        if (node.childID.indexOf(child._id)==-1) {
            node.childID.push(child._id);
        }
        child.ParentID = node.ID;
    };
    var getNearestParent = function(node) {
        var types = config.typeParents;
        var nodeType = node.Type;
        var rootFullID = node.fullID.split(';').shift();
        if (!rootFullID) {
            tree.errors.push(getExcelIndex(node)+'Geen valide ID voor '+node._id+': '+node.ID+' '+node.Prefix+':'+node.Title+' ('+node.Type+')');
        } else if (types[nodeType]) {
            for (var i=node._id-1; i>=0; i--) {
                var p = tree.all[i];
                var parentRootFullID = p.fullID.split(';').shift();
                if (parentRootFullID != rootFullID) {
                    return null;
                }
                var pt = p.Type;
                if (types[nodeType].indexOf(pt)!==-1) {
                    return p;
                }
            }
        }
        return null;
    }

    var getParent = function(node) {
        var parent = null;
        if (node.fullID) {
            var parentFullID = node.fullID.split(';');
            parentFullID.pop();
            parentFullID = parentFullID.join(';');
            if (parentFullID && parentFullID!=node.fullID && tree.fullIds[parentFullID]) {
                parent = tree.fullIds[parentFullID];
            }
        }
        if (!parent && node.ParentID) {
            var parents = tree.ids[node.ParentID];
			if (!parents) {
				tree.errors.push(getExcelIndex(node)+'Missende Parent met ID '+node.ParentID+' bij '+node.ID+' '+node.Title);
				return null;
			}
            parents = parents.filter(function(parent) {
   	            return parent.childID && parent.childID.indexOf(node._id)!==-1;
       	    });
           	parent = parents[0]; // should only be one
        }
        if (!parent) {
            var parent = getNearestParent(node);
            if (parent) {
                tree.errors.push(getExcelIndex(node)+'Missend ParentID voor '+getRootTitle(node)+':'+node.ID+' '+node.Prefix+':'+node.Title+'; dichtsbijzijnde parent is: '+parent.ID+' '+parent.Prefix+':'+parent.Title);
                node.ParentID = parent.ID;
            } else if (node.Type!=config.topLevel) {
                tree.errors.push(getExcelIndex(node)+'Missend ParentID voor '+getRootTitle(node)+':'+node.ID+' '+node.Type+' '+node.Title+'; could not find substitute;');
            }
        }
        return parent;
    };

    var arraysEqual = function(arr1, arr2) {
        var all = arr1.concat(arr2);
        var unique = all.filter(onlyUnique);
        return unique.length == 0;
    };

    var getHash = function(node) {
        if (!node.Title) {
            tree.errors.push(getExcelIndex(node)+'Missende titel voor '+getRootTitle(node)+':'+node.ID+' ('+node.Type+')');
        }
        if (!node.Prefix && !node.Title) {
            return false;
        }
        return node.Prefix+':'+node.Title;
    };

    var getRoot = function(node) {
        var rootFullID = node.fullID.split(';').shift();
        return tree.fullIds[rootFullID];
    };

    var getRootTitle = function(node) {
        var root = getRoot(node);
        if (root) {
            return root.Title;
        }
        return '(Onbekend)';
    };

    var getRootNiveau = function(node) {
        var root = getRoot(node);
        if (root.Level) {
            return root.Level;
        }
    };

    var getPrefix = function(node) {
        return node.Prefix ? node.Prefix + ': ' : '';
    };




    // attempt to build sensible ID's 
    // if the nodes are the same across sheets, they should reuse the same uuid
    // if not, then not, even if the ID (not - uuid) are the same
    // only change ID's that aren't UUID's
    var uuidMapping = {};
    var removedIDs = {};
    tree.all.forEach(function(node) {
        if (!isUUID(node.ID)) {
            var oldID = node.ID;
            if (!removedIDs[oldID]) {
                removedIDs[oldID] = [];
            }
            removedIDs[oldID].push(node);

            var hash = getHash(node);
            if (hash) {
                if (!uuidMapping[hash]) {
                    uuidMapping[hash] = uuidv4();
                }
                newID = uuidMapping[hash];
                node.ID = newID;
                tree.ids[node.ID] = [node];
                tree.ids[oldID] = tree.ids[oldID].filter(function(node) {
                    return node.ID == oldID;
                });
            }
        }
        if (node.ParentID && removedIDs[node.ParentID]) {
            var parents = removedIDs[node.ParentID];
            node.ParentID = parents[parents.length-1].ID; // last node seen with this ID
        }
    });

    // some sheets use ParentID before defining them, so catch these now
    tree.all.forEach(function(node) {
        if (node.ParentID && removedIDs[node.ParentID]) {
            var parents = removedIDs[node.ParentID];
            node.ParentID = parents[parents.length-1].ID; // last node seen with this ID
        }
    });



    // corrigeer missende parents
    tree.all.forEach(function(node) {
        var parent = getParent(node); //fixes it inside getParent() if needed
    });

	var matchesHierarchy = function(node, parent) {
		var nodeType = node.Type;
		var parentType = parent.Type;
		if (!config.hierarchy[nodeType]) {
			return true;
		}
		var allowedParents = config.hierarchy[nodeType];
		if (!Array.isArray(allowedParents)) {
			allowedParents = [allowedParents];
		}
		if (allowedParents.indexOf(parentType)!==-1) {
			return true;
		}
		return false;
	}

    var hierarchyErrors = 0;
    var fixHierarchyByPrefix = function(node, prefixes, level) {
        var hierarchy = config.hierarchy;
        var parent = getParent(node);
		if (!parent) {
			return;
		}
        var nodeType = node.Type;
        var parentType = parent.Type;
        var rootID = node.fullID.split(';').shift();
        var rootEntity = tree.fullIds[rootID];
        if (!matchesHierarchy(node, parent)) { //hierarchy[nodeType] && hierarchy[nodeType]!=parentType) {
            // find by prefix
            if (node.Prefix) {
                var parentPrefix = node.Prefix.split('.');
                var p = '';
                do {
                    p = parentPrefix.pop();
                } while (parentPrefix.length && !p);
                parentPrefix = parentPrefix.join('.');
                if (prefixes[parentPrefix] && prefixes[parentPrefix+'.']) {
                    if (prefixes[parentPrefix] < prefixes[parentPrefix+'.']) {
                        parentPrefix+='.';
                    }
                } else if (!prefixes[parentPrefix]) {
                    parentPrefix+='.';
                }
                if (prefixes[parentPrefix]) {
                    var newParent_id = prefixes[parentPrefix];
                    var newParent = tree.all[newParent_id];
                    var parentRootFullID = newParent.fullID.split(';')[0];
                    var myRootFullID = node.fullID.split(';')[0];
                    if (parentRootFullID === myRootFullID) {
                        var newParentType = newParent.Type;
                        if (newParent && hierarchy[nodeType]==newParentType) {
                            node.ParentID = newParent.ID;
                            removeChild(parent, node);
                            addChild(newParent, node);
                            tree.fixes.push(getExcelIndex(node)+'ParentID moet worden aangepast voor '+getRootTitle(node)+' '+level+': '+getPrefix(node)+node.Title+' - verwachtte '+hierarchy[nodeType]+', kreeg '+parentType+', prefix parent was '+newParent.Type+': '+newParent.Prefix+': '+newParent.Title);
                        } else {
                            hierarchyErrors++;
                            tree.errors.push(getExcelIndex(node)+'ParentID fout in '+getRootTitle(node)+' '+level+': '+getPrefix(node)+node.Title+' ('+node.Type+')');
                        }
                    } else {
                        hierarchyErrors++;
                        tree.errors.push(getExcelIndex(node)+'ParentID fout in '+getRootTitle(node)+' '+level+': '+getPrefix(node)+node.Title+' ('+node.Type+')');
                    }
                } else {
                    hierarchyErrors++;
                    tree.errors.push(getExcelIndex(node)+'ParentID fout in '+getRootTitle(node)+' '+level+': '+getPrefix(node)+node.Title+' ('+node.Type+')');
                }
            } else {
                hierarchyErrors++;
                tree.errors.push(getExcelIndex(node)+'ParentID fout in '+getRootTitle(node)+' '+level+': '+getPrefix(node)+node.Title+' ('+node.Type+')');
            }
        }
    };

    // corrigeer de boom op basis van types en prefix
    var prefixes = {};
    var lastLevel = null;
    tree.all.forEach(function(node) {
        if (node.Level) {
            lastLevel = node.Level;
        }
        if(node.Prefix) {
            prefixes[node.Prefix] = node._id;
            fixHierarchyByPrefix(node, prefixes, lastLevel);
        }
    });

    var doelniveauIndex = {};
    // laad doelniveauIndex
    tree.all.forEach(function(node) {
        if (node.Type=='doelniveau') {
            if (!doelniveauIndex[node.niveau_id]) {
                doelniveauIndex[node.niveau_id] = [];
            }
            doelniveauIndex[node.niveau_id].push(node);
        }
    });

    var getDoelNiveau = function(niveauId, nodes) {
        var index = doelniveauIndex[niveauId];
        if (index) {
            for (var i=0, l=index.length; i<l; i++) {
                if (index[i].childID && arraysEqual(index[i].childID, nodes)) {
                    return index[i];
                }
            }
        } else {
            doelniveauIndex[niveauId] = [];
        }
        // not found, create a new one
        var doelniveau = {
            Type: 'doelniveau',
            ID: uuidv4(),
            niveau_id: [niveauId],
            childID: nodes,
            _id: tree.all.length
        };
        tree.all.push(doelniveau);

        doelniveauIndex[niveauId].push(doelniveau);
        return doelniveau;
    };

	var getSheetRootNiveau = function(node) {
		var rootID = tree.childID.filter(function(rootID) {
			return tree.all[rootID]._sheet == node._sheet;
		}).pop();
		if (rootID || rootID===0) {
			return tree.all[rootID].Level;
		}
		return null;
	}

    // vind alle doelen en maak daar doelniveau's van, als ze die nog niet als parent hebben
    var getNiveau = function(level, node) {
        if (config.niveaus[level]) {
            return config.niveaus[level];
        }
        var niveau = getSheetRootNiveau(node);
        if (!niveau) {
            tree.errors.push(getExcelIndex(node)+'Missend niveau(level) voor '+getRootTitle(node)+': '+node.ID+' '+getPrefix(node)+node.Title+' ('+node.Type+')');
//                throw new Error('Niveau mist voor ',node);
        } else {
            return niveau;
        }
    };

	if (!config.doelTypes) {
        if (config.doelType) {
            config.doelTypes = [config.doelType];
        } else {
    		config.doelTypes = ['doel','kerndoel'];
        }
	}
    tree.all.forEach(function(node) {
        if (config.doelTypes.includes(node.Type)) {
            var parent = getParent(node);
            if (parent && parent.Type!='doelniveau') {
                removeChild(parent, node);
                if (!node.Level) {
                    node.Level = getNiveau('',node); // get default level
                }
				if (node.Level) {
                    node.Level.split(',').forEach(function(level) {
                        var niveau = getNiveau(level.trim(),node);
                        var doelniveau = getDoelNiveau(niveau, [node._id]); //FIXME: hier lijkt alleen het laatste niveau uit te komen
    					if (!parent.childID) {
    						parent.childID = [];
    					}
                        parent.childID.push(doelniveau._id);
                    });
                }
            }			
		}
    });

    // vind alle kerndoelen en hang deze onder doelen
    //FIXME: kerndoelen mogen via doelniveau direct onder vak/vakkern/vaksubkern hangen, dus niet onder een doel verplaatsen
/*    tree.all.forEach(function(node) {
        var nodeType = node.Type;
        if (nodeType=='kerndoel') {
            var parent = getParent(node);
            if (parent && parent.type!='doelniveau') {
                removeChild(parent, node);
                var doelniveaus = findChildrenByType(parent, 'doelniveau');
                doelniveaus.forEach(function(doelniveau) {
                    if (!doelniveau.kerndoel_id) {
                        doelniveau.kerndoel_id = [];
                    }
                    doelniveau.kerndoel_id.push(node.ID); // kerndoelen ID's staan vast, dus kan ik hier gewoon gebruiken
                    doelniveau.childID.push(node._id);
                    var doel = tree.all[doelniveau.childID[0]];
                    if (parent.type!='doel') {
                        tree.fixes.push(getExcelIndex(node)+'Kerndoel verplaatst '+getRootTitle(node)+': '+getPrefix(node)+node.Title+' naar doel '+doel.Title+' ('+reverseNiveaus[doelniveau.niveau_id]+')');
                    }
                    node.ParentID = doelniveau.ID;
                });
            }
        }
    });
*/


    //hershuffle ID's - alle entiteiten krijgen nieuwe ID's
    var isOBKID = function(id) {
        return id && id.substring(0,3)=='bk:';
    };
    var replacements = {};
    tree.all.forEach(function(node) {
        if (isUUID(node.ID)) {
            if (config.links[node.Type]) {
                node[config.links[node.Type]] = [node.ID];
                if (!isOBKID(node.ID)) {
                    node.ID = "bk:" + node.ID;
                }
            }
        }
        // make sure ID's for vak/vakkern/vaksubkern get reused
        if (typeof node.ID == 'undefined') {
            tree.errors.push(getExcelIndex(node)+'Node mist ID: '+getRootTitle(node)+': '+node.Prefix+': '+node.Title+' ('+node.Type+')');
            return;
        }
        if (node.Type!='kerndoel' && isOBKID(node.ID)) {// || !isUUID(node.ID)) {
            var oldID = node.ID;
            var hash = getHash(node);
            if (hash) {
                if (!replacements[hash]) {
                    node.ID = uuidv4();
                    replacements[hash] = node.ID;
                    tree.ids[node.ID] = [node];
                } else {
                    // reuse - this can potentially be wrong...
                    node.ID = replacements[hash];
                    tree.ids[node.ID].push(node);
                }
            }
            if (tree.ids[oldID]) {
                tree.ids[oldID] = tree.ids[oldID].filter(function(node) {
                    return node.ID === oldID;
                });
            }
        }
    });

    // vind alle andere nodes en maak daar entiteiten van (gecorrigeerd)
	var entities = {};
	
/*    var entities = {
        ldk_vak: [],
        ldk_vakkern: [],
        ldk_vaksubkern: [],
        ldk_vakinhoud: [],
        doelniveau: [],
        doel: [],
        tag: []
    };
*/
    var seen = {};

    var addChildEntities = function(nodeId) {
        var node = tree.all[nodeId];
        if (node.ID) {
            if (!seen[node.ID]) {
                if (entities[node.Type]) { // kerndoel is already in curriculum-kerndoelen
                    var entity = makeEntity(node);
                    seen[node.ID] = entity;
                    entities[node.Type].push( entity );
                }
            } else {
                entity = seen[node.ID];
                mergeEntity(entity, node);
            }
        }
        if (node.childID) {
            node.childID.forEach(addChildEntities);
        }
    };
    var getChildrenByType = function(node, type) {
		if (type=='niveau') {
            if (!node.Level) {
                return [];
            }
			return node.Level.split(',').map(function(level) {
				return getNiveau(level.trim(),node);
			});
		}
        if (!node.childID) {
            return [];
        }
        if (node[type+'_id']) {
            return flatten([node[type+'_id']]);
        }
        return node.childID.map(function(id) {
            return tree.all[id];
        }).filter(function(child) {
            return child.Type == type;
        }).map(function(child) {
            return child.ID;
        }).filter(onlyUnique);
    };
    var addTags = function(node, entity) {
        var tags = node.Tags || node.tags;
        if (!tags) {
            return;
        }
        tags = tags.split(';').map((t) => t.trim());
        tags.forEach(function(tag) {
            tag = tag.trim();
            var tag_id = null;
            for (var i=entities.tag.length-1; i>=0; i--) {
                if (entities.tag[i].title == tag) {
                    tag_id = entities.tag[i].id;
                }
            }
            if (!tag_id) {
                var tagEntity = {
                    id: uuidv4(),
                    title: tag
                };
                entities.tag.push(tagEntity);
                tag_id = tagEntity.id;
            }
            if (!entity.tag_id) {
                entity.tag_id = [];
            }
            entity.tag_id.push(tag_id);
        });
    };

    var differenceCount = 0;
    var mergeEntity = function(entity, node) {
        var newEntity = makeEntity(node);
        Object.keys(newEntity).forEach(function(key) {
            if (typeof entity[key] == 'undefined') {
                entity[key] = newEntity[key];
            } else if (Array.isArray(newEntity[key])) {
                entity[key] = entity[key].concat(newEntity[key]);
                entity[key] = entity[key].filter(onlyUnique);
            } else if (entity[key] != newEntity[key]) {
				var message = getExcelIndex(node)+'Verschil '+getRootTitle(node)+' in '+entity.id+': '+key+'<br>'+entity[key]+' <br>'+newEntity[key];
				if (key!='type' && key!='Type') { //['title','description','level'].indexOf(key)!=-1) {
	                tree.fixes.push(message+'<br>onderste verwijderd');
				} else {
					tree.errors.push(message);
				}
                differenceCount++;
            }
        });
    }
    var makeEntity = function(node) {
        var entity = {
            id: node.ID
        }
        if (node.Type!='doelniveau') {
            entity.prefix = node.Prefix;
            entity.title = node.Title;
            entity.description = node.Description;
		} else if (node.niveau_id) {
			entity.niveau_id = node.niveau_id
		}
        if (node.ExamenprogrammaID) {
            entity.examenprogramma_id = [node.ExamenprogrammaID];
        }
        if (node.Tags || node.tags) {
            addTags(node, entity);
        }
        if (config.typeChildren[node.Type]) {
            var childTypes = config.typeChildren[node.Type];
            childTypes.forEach(function(childType) {
                entity[childType+'_id'] = getChildrenByType(node, childType);
            });
        }
        if (config.properties && config.properties[node.Type]) {
            var props = config.properties[node.Type];
            Object.keys(props).forEach(function(prop) {
                var col = props[prop];
                if (node[col]) {
                    entity[prop] = node[col];
                }
            });
        }
        return entity;
    }


    var downloadZipFile = function(data, fileNames, zipName) {
        var zip = new JSZip();
        Object.keys(fileNames).forEach(function(list) {
            zip.file(fileNames[list], JSON.stringify(data[list], null, '\t'));
        });
        zip.generateAsync({type:'blob'})
        .then(function(content){
            saveAs(content, zipName);
        });
    };

	Object.keys(config.types).forEach(function(type) {
		entities[type] = [];
	});

	fetch('https://raw.githubusercontent.com/slonl/curriculum-doelen/editor/data/tags.json')
	.then(function(response) {
		return response.json();
	})
	.then(function(json) {
		entities.tag = json;
	    tree.childID.forEach(addChildEntities);
	    var files = config.files;
	    var fixes = '<div class="slo-alert slo-warning">'+tree.fixes.join('<br>')+'</div>';
	    var errors = '<div class="slo-alert slo-errors">'+tree.errors.join('<br>')+'</div>';
		if (!container) {
			container = document.querySelector('ul.slo-list-root');
		}
	    if (tree.errors.length) {
	        container.innerHTML = errors + fixes; 
	    } else {
			downloadZipFile(entities, files, 'entities.zip');
			container.innerHTML = fixes + importSheet.toHTML(tree);
		}
		window.debugTree = tree;
	})
	.catch(function(error) {
		alert(error);
	});
};
