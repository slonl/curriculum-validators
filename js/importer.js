
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
                        }
                    });
                    editor.pageData.errors = errors;
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
                    var id = change.id;
                    var original = curriculum.data[curriculum.index.type[id]].find(function(entry) {
                        if (entry.id == id) {
                            return true;
                        }
                        return false;
                    });
                    if (original) {
                        var index = curriculum.data[curriculum.index.type[id]].indexOf(original);
                        curriculum.data[curriculum.index.type[id]][index] = change;
                    } else {
                        curriculum.data[curriculum.index.type[id]].push(change);
                    }
                    var section = curriculum.index.type[change.id];
                    var schema = curriculum.getSchemaFromType(section);
                    if (!schemas[schema]) {
                        schemas[schema] = [];
                    }
                    schemas[schema].push(section);
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
                        //FIXME: remove any properties that aren't part of the schema
                        //except dirty and deleted?
                    });
                    return dataset;
                };
                var files = [];
                Object.keys(schemas).forEach(function(schema) {
                    schemas[schema].forEach(function(section) {
                        var filename = curriculum.schemas[schema].properties[section]['#file'];
                        files.push({ path: filename, data: JSON.stringify(clean(curriculum.data[section]), null, "\t"), schema: schema});
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
                    // restore changes from localstorage;
                    if (localStorage.importChanges) {
                        editor.pageData.changes = JSON.parse(localStorage.importChanges);
                        editor.pageData.changeCount = editor.pageData.changes.length;
                    }
                    document.body.dataset.loading = "false";
                    simply.route.handleEvents();
                    simply.route.match();
                    return true;
                })
                .then(function() {
                    return Promise.all(Object.keys(schemas).map(function(context) {
                        return curriculum.loadContextFromGithub(context, window.repos[context], window.username, window.password, window.branchName);
                    }));
                })
                .then(function(schemas) {
                    curriculum.parsedSchemas = {};
                    return Promise.all(Object.keys(curriculum.schemas).map(function(context) {
                        return curriculum.parseSchema(curriculum.schemas[context])
                        .then(function(parsedSchema) {
                            curriculum.parsedSchemas[context] = parsedSchema;
                            return parsedSchema;
                        });
                    }));
                });
            }
        }
    });
