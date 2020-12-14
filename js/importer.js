	var contexts = [];
    var importTool = simply.app({
        container: document.body,
        routes : {
        },
        commands: {
            uploadXLSX: function(form, values) {
                document.body.dataset.loading="true";
                var files = Array.from(form.files.files);
                return tree.importXLSX(files, values.context)
                .then(function(trees) {
                    document.body.dataset.loading="false";
                    console.log('trees',trees);
                    var errors = [];
                    var rendered = [];
                    trees.forEach(function(myTree) {
                        if (myTree.errors) {
                            errors = errors.concat(myTree.errors);
                        } else {
                            rendered.push(tree.render(myTree.root));
							var context = tree.convertToContext(myTree.root, values.context);
							contexts.push(context);
							if (context.errors) {
								errors = errors.concat(context.errors);
							}
                        }
                    });
					errors = errors.filter(Boolean);
					if (errors.length) {
	                    editor.pageData.errors = errors.slice(0, 100);
					}
					var validations = [];
					contexts.forEach(function(data) {
						var valid = validator.validate(values.context, data);
						if (valid.length) {
							validations = validations.concat(valid);
						}
					});
					validations = validations.filter(Boolean);
					if (validations.length) {
						editor.pageData.validation = validations;
					}
					if (!errors.length && !validations.length) {
						console.log('contexts',contexts);
						tree.showChanges(document.querySelector('.slo-tree-changes'), contexts);
					} else {
						console.log(errors);
						console.log(validations);
					}
					
                    document.querySelector('.slo-tree-render').innerHTML = rendered.join('');
                });
            },
            logoff: function() {
                localStorage.removeItem('login');
                location.reload(true);
            },
            login: function(form, values) {
                document.body.dataset.loading="true";
                return importTool.actions.start(values.username, values.password)
                .then(function() {
                    window.username = values.username;
                    window.password = values.password;
                    document.body.dataset.loading="false";
                    document.getElementById('login').removeAttribute('open');
                    importTool.view['login-error'] = '';
                    if (values.savelogin) {
                        localStorage.setItem('login',JSON.stringify(values));
                    }
                    return true;
                })
                .then(function() {
                        if (typeof LogRocket != 'undefined') {
                            LogRocket.identify(values.username);
                        }
                    return true;
                })
                .catch(function(error) {
                    if (error.path=='/user') {
                        importTool.view['login-error'] = 'Github login mislukt';
                        document.body.dataset.loading="false";
                        return false;
                    } else {
                        document.getElementById('login').removeAttribute('open');
                        importTool.view['login-error'] = '';
                        if (values.savelogin) {
                            localStorage.setItem('login',JSON.stringify(values));
                        }
                        throw error;
                    }
                });
            },
			'handle-changes': function(form, values) {
				var schemas = {};
				if (!Array.isArray(values.applyChanges)) {
					if ( !values.applyChanges ) {
						alert('Selecteer tenminste 1 context');
						return;
					}
					values.applyChanges = [ values.applyChanges ];
				}
				values.applyChanges.forEach(schema => {
					schemas[schema] = editor.pageData.changedSchemas[schema];
				});
				return importTool.actions['handle-changes'](schemas);
			},
            'delete-change' : function(el) {
                // find the id of the entity;
                var id = el.closest('.slo-entiteit-change').querySelector("a").innerHTML;
                if (originalEntities[id]) {
                    var original = clone(originalEntities[id]);
                    delete originalEntities[id];
                       curriculum.index.id[id] = original;
                    //FIXME: update curriculum.data as well?
                } else {
                    delete curriculum.index.id[id];
                    if (editor.pageData.entity && editor.pageData.entity.id == id) {
                        editor.pageData.entity = {};
                    }
                }
                
                el.parentNode.parentNode.removeChild(el.parentNode);
                editor.pageData.changeCount = editor.pageData.changes.length;
                localStorage.changes = JSON.stringify(editor.pageData.changes);

                  if (editor.pageData.rootEntity) {
                       var root = curriculum.index.id[editor.pageData.rootEntity];
                    importTool.actions.renderTree(root, editor.pageData.niveau, editor.pageData.schemas);
                }
                
                // reload the page to show the changes;
                if (editor.pageData.entity) {
                    var entityId = editor.pageData.entity.id;
                    if (entityId == id) {
                        if (curriculum.index.id[id]) {
                            importTool.actions.showEntity(id);
                        } else if (editor.pageData.rootEntity) {
                            importTool.actions.showEntity(editor.pageData.rootEntity);
                        } else {
                            simply.route.goto(document.location.pathname + '#new/');
                        }
                    }                                    
                } else {
                    simply.route.goto(document.location.pathname + '#new/');
                }
            },
            'commit-changes' : function() {
                document.body.dataset.loading="true";
                importTool.actions['commit-changes'](editor.pageData.changes, editor.pageData.commitMessage)
                .then(function(done) {
                    done.sort().reverse().forEach(function(changeIndex) {
                        editor.pageData.changes.splice(changeIndex, 1);
                    })
                    editor.pageData.changeCount = editor.pageData.changes.length;
                    localStorage.changes = JSON.stringify(editor.pageData.changes);
                    editor.pageData.commitMessage = '';
                    document.body.dataset.loading="false";
                })
                .then(function() {
                    if (editor.pageData.rootEntity) {
                        var root = curriculum.index.id[editor.pageData.rootEntity];
                        importTool.actions.renderTree(root, editor.pageData.niveau, editor.pageData.schemas);
                    }
                })
                .catch(function(error) {
                    document.body.dataset.loading="false";
                    alert(error);
                });
            },
            'save' : function() {
                if (!editor.pageData.entity.id) {
                    editor.pageData.entity.id = curriculum.uuidv4();
                }
                importTool.actions.save(clone(editor.pageData.entity));
                   if (editor.pageData.rootEntity) {
                       var root = curriculum.index.id[editor.pageData.rootEntity];
                    importTool.actions.renderTree(root, editor.pageData.niveau, editor.pageData.schemas);
                }                
            },
            'showEntity': function(el, value) {
                el.classList.toggle('slo-open');
            }
        },
        actions: {
            'showLogin': function() {
                 document.getElementById('login').setAttribute('open','open');
                 importTool.view['login-error'] = '';
                 return Promise.resolve(true);
            },
            'autologin': function(username, password) {
                window.username = username;
                window.password = password;
                document.body.dataset.loading="true";
                return importTool.actions.start(username, password)
                .then(function() {
                    document.body.dataset.loading="false";
                    return true;
                })
                .then(function() {
                    if (typeof LogRocket != 'undefined') {
                        LogRocket.identify(username);
                    }                    
                    return true;
                })
                .catch(function(error) {
                    if (error.path == '/user') {
                        document.getElementById('login').setAttribute('open','open');
                        importTool.view['login-error'] = '';
                        document.body.dataset.loading="false";
                        return false;
                    } else {
                        document.getElementById('login').removeAttribute('open');
                        importTool.view['login-error'] = '';
                        throw error;
                    }
                });
            },
			'handle-changes': function(schemas) {
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
								curriculum.schema[schema][type].push(original);
								curriculum.data[type].push(original);
							} else {
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
					editor.pageData.changes = changes;
					editor.pageData.changeCount = changes.length;
				}
			},
            'commit-changes': function(changes, message) {
                if (!message) {
                    return Promise.reject('Commit message required');
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
                return new Promise(function(resolve, reject) {
                    var errors = {};
                    var writeFile = function() {
                        if (!files.length) {
                            if (Object.keys(errors).length) {
                                //FIXME: some changes may have been committed correctly...
                                return reject(errors);
                            } else {
                                return resolve(done);
                            }
                        }
                        var file = files.shift();
//						debugger;
                        return curriculum.sources[file.schema].writeFile(file.path, file.data, message).then(writeFile);
                    }
                    return writeFile();
                }).then(function() {
                    // clear originals because revert is no longer an option
                    originalEntities = {};
                    return done;
                });
            },
            start: function(user, pass) {
                var schemas = {
                    'curriculum-basis': 'slonl/curriculum-basis',
                    'curriculum-lpib': 'slonl/curriculum-lpib',
                    'curriculum-kerndoelen': 'slonl/curriculum-kerndoelen',
                    'curriculum-examenprogramma': 'slonl/curriculum-examenprogramma',
                    'curriculum-examenprogramma-bg': 'slonl/curriculum-examenprogramma-bg',
                    'curriculum-syllabus': 'slonl/curriculum-syllabus',
                    'curriculum-doelgroepteksten': 'slonl/curriculum-doelgroepteksten',
                    'curriculum-leerdoelenkaarten': 'slonl/curriculum-leerdoelenkaarten'
                };
                var branch = 'editor';

                // get user info
                // put it in the editor.pageData.user
                // name and avatar_url
                var gh = new GitHub({username:user, password: pass});
                return gh.getUser().getProfile()
                .then(function(profile) {
                    editor.pageData.user = profile.data;
                    document.body.classList.add('slo-logged-on');
                    return profile;
                })
                .then(function() {
                    return Promise.all(Object.keys(schemas).map(function(context) {
                        return curriculum.loadContextFromGithub(context, window.repos[context], window.username, window.password, window.branchName)
						.then(function() {
							return curriculum.loadData(context);
						});
                    }));
                })
                .then(function() {
                    curriculum.parsedSchemas = {};
                    return Promise.all(Object.keys(curriculum.schemas).map(function(context) {
                        return curriculum.parseSchema(curriculum.schemas[context])
                        .then(function(parsedSchema) {
                            curriculum.parsedSchemas[context] = parsedSchema;
                            return parsedSchema;
                        });
                    }));
                })
				.then(function() {
					curriculum.validations = {};
					validator.loadSchemas(Object.keys(curriculum.schemas));
					return Promise.all(Object.keys(curriculum.schemas).map(function(context) {
						curriculum.validations[context] = validator.validate(context); //, curriculum.data);
						return curriculum.validations[context];
					}));
				})
				.then(function() {
/*
					editor.pageData.validation = [];
					Object.keys(curriculum.validations).forEach(function(context) {
						if (curriculum.validations[context]!==true) {
							var validation = curriculum.validations[context];
						} else {
							var validation = [ { innerHTML: context+' is helemaal goed.' } ];
						}
						editor.pageData.validation = editor.pageData.validation.concat(validation);
					});
*/
				})
                .then(function() {
                    // restore changes from localstorage;
                    if (localStorage.importChanges) {
                        editor.pageData.changes = JSON.parse(localStorage.importChanges);
                        editor.pageData.changeCount = editor.pageData.changes.length;
                    }
                    document.body.dataset.loading = "false";
                    simply.route.handleEvents();
                    simply.route.match();
                    return true;
                });
            }
        }
    });
