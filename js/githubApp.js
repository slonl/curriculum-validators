const githubApp  = simply.app({
    'commands': {
		'handle-changes': async function(form, values) {
			var schemas = {};
			if (!Array.isArray(values.applyChanges)) {
				if ( !values.applyChanges ) {
					alert('Selecteer tenminste 1 context');
					return;
				}
				values.applyChanges = [ values.applyChanges ];
			}
			values.applyChanges.forEach(schema => {
				schemas[schema] = githubApp.view.changedSchemas[schema];
			});
			return githubApp.actions['handle-changes'](schemas);
		},
        'delete-change' : async function(el) {
            // find the id of the entity;
            var id = el.closest('.slo-entiteit-change').querySelector("a").innerHTML;
            if (originalEntities[id]) {
                var original = clone(originalEntities[id]);
                delete originalEntities[id];
                   curriculum.index.id[id] = original;
                //FIXME: update curriculum.data as well?
            } else {
                delete curriculum.index.id[id];
                if (githubApp.view.entity && githubApp.view.entity.id == id) {
                    githubApp.view.entity = {};
                }
            }
            
            el.parentNode.parentNode.removeChild(el.parentNode);
            githubApp.view.changeCount = githubApp.view.changes.length;
            localStorage.changes = JSON.stringify(githubApp.view.changes);

/*
            // FIXME: this should fire an event, because the renderTree is part of another app
            if (githubApp.view.rootEntity) {
                var root = curriculum.index.id[githubApp.view.rootEntity];
                githubApp.actions.renderTree(root, githubApp.view.niveau, githubApp.view.schemas);
            }
            // reload the page to show the changes;
            if (githubApp.view.entity) {
                var entityId = githubApp.view.entity.id;
                if (entityId == id) {
                    if (curriculum.index.id[id]) {
                        githubApp.actions.showEntity(id);
                    } else if (githubApp.view.rootEntity) {
                        githubApp.actions.showEntity(githubApp.view.rootEntity);
                    } else {
                        simply.route.goto(document.location.pathname + '#new/');
                    }
                }                                    
            } else {
                simply.route.goto(document.location.pathname + '#new/');
            }
 */           
        },
		'remove-changes' : async function() {
			githubApp.view.changes = [];
			githubApp.view.changeCount = 0;
			localStorage.changes = JSON.stringify([]);
		},
        'commit-changes' : async function() {
            document.body.dataset.loading="true"
            try {
                let done = await githubApp.actions['commit-changes'](githubApp.view.changes, githubApp.view.commitMessage)
                done.sort((a,b)=>b-a).forEach(function(changeIndex) {
                    githubApp.view.changes.splice(changeIndex, 1);
                })
                githubApp.view.changeCount = githubApp.view.changes.length;
                localStorage.changes = JSON.stringify(githubApp.view.changes);
                githubApp.view.commitMessage = '';
                document.body.dataset.loading="false";
/*
                //FIXME: fire an event again
                if (githubApp.view.rootEntity) {
                    var root = curriculum.index.id[githubApp.view.rootEntity];
                    githubApp.actions.renderTree(root, githubApp.view.niveau, githubApp.view.schemas);
                }
 */
            } catch(error) {
                document.body.dataset.loading="false";
                alert(error);
            }
        }
    },
    'actions': {
        start: async function(user, pass) {
            var schemas = {}
            // FIXME: use githubApp.view.repos or add to function params
            window.repos.forEach(repo => {
                schemas[repo] = 'slonl/'+repo
            })
            // FIXME: idem
            var branch = 'editor';
            
            try {
                // get user info
                // put it in the githubApp.view.user
                // name and avatar_url
                var gh = new curriculum.Octokit({ auth: pass })
                let profile = await gh.rest.users.getAuthenticated()
                githubApp.view.user = profile.data
                document.body.classList.add('slo-logged-on');
                let loaded = await Promise.all(
                    Object.keys(schemas)
                    .map(function(context) {
                        return curriculum.loadContextFromGithub(context, context, 'slonl', branch, pass)
                    })
                )

                curriculum.parsedSchemas = {};
                let parsed = await Promise.all(
                    Object.keys(curriculum.schemas)
                    .map(async function(context) {
                        let parsedSchema = await curriculum.parseSchema(curriculum.schemas[context])
                        curriculum.parsedSchemas[context] = parsedSchema;
                        return parsedSchema;
                    })
                )

                // restore changes from localstorage;
                if (localStorage.importChanges) {
                    githubApp.view.changes = JSON.parse(localStorage.importChanges);
                    githubApp.view.changeCount = githubApp.view.changes.length;
                }
                document.body.dataset.loading = "false";
                simply.route.handleEvents();
                simply.route.match();
                return true;
            } catch(e) {
                document.body.dataset.loading = "false";
                githubApp.view['login-error'] = e;
                throw e;
            }
        },
        'handle-changes': async function(schemas) {
            var changes = [];
            var changedIds = {};
            var changesType = {};
            var changesSchema = {};
            Object.keys(schemas).forEach(schema => {
                Object.keys(schemas[schema]).forEach(type => {
                    console.log('building change set: '+type+' ('+schemas[schema][type].length+')');
                    schemas[schema][type].forEach(entity => {
                        var original = curriculum.index.id[entity.id];
                        if (!original) {
                            original = {};
                            Object.assign(original, entity); // overwrite information from entity into the original entity
                            original.unreleased = true;
                            curriculum.schema[schema][type].push(original);
                            curriculum.data[type].push(original);
                        } else {
                            if (!original.unreleased) {
                                original.dirty = true;
                            }
                            Object.assign(original, entity); // overwrite information from entity into the original entity
                            var index = curriculum.schema[schema][type].findIndex(e => e.id === entity.id);
                            if (index<0) {
                                throw new Error('Kan originele entiteit niet vinden');
                            }
                            curriculum.schema[schema][type].splice(index, 1, original);

                            var index = curriculum.data[type].findIndex(e => e.id === entity.id);
                            if (index<0) {
                                throw new Error('Kan originele entiteit niet vinden');
                            }
                            curriculum.data[type].splice(index, 1, original);
                        }
                        changes.push(original);
                        curriculum.index.id[entity.id] = original;
                        curriculum.index.type[entity.id] = type;
                        curriculum.index.schema[entity.id] = schema;
                    });
                });
            });

            // check that no entity in the selected schemas has a reference
            // to an item that isn't in the selected list or in the current
            // curriculum dataset
            var hasMissingReferences = function(e) {
                var refProps = Object.keys(e).filter(p => Array.isArray(e[p]));
                for (var i=0,l=refProps.length; i<l; i++) {
                    for (var ii=0,ll=e[refProps[i]].length; ii<ll; ii++) {
                        var id = e[refProps[i]][ii];
                        if (!changedIds[id] && !curriculum.index.id[id]) {
                            return true;
                        }
                    }
                }
                return false;
            };

            var missingRefs = false;
            for (var i=0,l=changes.length; i<l; i++) {
                if (hasMissingReferences(changes[i])) {
                    missingRefs = true;
                    break;
                }
            }
            if (missingRefs) {
                alert('Deze selectie bevat entiteiten met referenties naar nog niet bestaande entiteiten die nu niet mee geimporteerd worden. Pas de selectie aan a.u.b.');
            } else {
                Object.keys(changesType).forEach(id => curriculum.index.type[id] = changesType[id]);
                Object.keys(changesSchema).forEach(id => curriculum.index.schema[id] = changesSchema[id]);
                githubApp.view.changes = changes;
                githubApp.view.changeCount = changes.length;
            }
        },
        'commit-changes': async function(changes, message) {
            if (!message) {
                throw new Error('Commit message required');
            }
            var done = [];
            var schemas = {};
            changes.forEach(function(change, changeIndex) {
                if (!change.commit) {
                    return false;
                }
                var section = curriculum.index.type[change.id];
                var schema = curriculum.getSchemaFromType(section);
                if (!schemas[schema]) {
                    schemas[schema] = {};
                }
                
                schemas[schema][section]=1;
                done.push(changeIndex);
            });
            var clean = function(dataset) {
                dataset = clone(dataset);
                dataset.forEach(function(entity) {
                    delete entity.section;
                    delete entity.parents;
                    delete entity.children;
                    delete entity.commit;
                    if (!entity.dirty || entity.dirty==="0") {
                        delete entity.dirty;
                    }
                    if (!entity.deleted || entity.deleted==="0") {
                        delete entity.deleted;
                    }
                    Object.keys(entity).forEach(function(p) {
                        if (Array.isArray(entity[p]) && entity[p].length==0) {
                            delete entity[p];
                        }
                    });
                });
                return dataset;
            };
            var files = [];
            Object.keys(schemas).forEach(function(schema) {
                Object.keys(schemas[schema]).forEach(function(section) {
                    var filename = curriculum.schemas[schema].properties[section]['#file'];
                    files.push({ path: filename, data: JSON.stringify(clean(curriculum.schema[schema][section]), null, "\t"), schema: schema});
                });
            });
            var errors = {};
            var writeFile = async function() {
                if (!files.length) {
                    if (Object.keys(errors).length) {
                        //FIXME: some changes may have been committed correctly...
                        return reject(errors);
                    } else {
                        return resolve(done);
                    }
                }
                var file = files.shift();
                return curriculum.sources[file.schema].writeFile(file.path, file.data, message).then(writeFile);
            }
            await writeFile();

            // clear originals because revert is no longer an option
            originalEntities = {};
            return done;
        }
    },
    view: {
        changes: [],
        changeCount: 0,
        commitMessage: "",
        rootEntity: null,
        entity: null,
        niveau: null,
        schemas: []
    }
});
