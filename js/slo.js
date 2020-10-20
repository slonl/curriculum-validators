/**
 *
 */

/*
    TODO: allow scrolling of right pane
*/
(function() {

    simply.bind = false; // using simply-edit instead

    var highlighted = {};
    var previousId = false;
    var doelniveaus = [];

                    var niveauEntiteiten = [
                        {
                                prefix: '1000',
                                title: 'po',
                                id: 'bk:512e4729-03a4-43a2-95ba-758071d1b725',
                                description: 'Primair Onderwijs',
                                type: 'Sector'
                        },
                        {
                                prefix: '3101',
                                title: 'ob vmbo bb',
                                id: '50d3e467-28c8-4c42-a0fe-e0000819ba39',
                                description: 'VMBO basisberoepsgerichte leerweg, onderbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3103',
                                title: 'ob vmbo gl',
                                id: '01aede69-edcd-4352-97e8-e16cb5d0015e',
                                description: 'VMBO gemengde leerweg, onderbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3102',
                                title: 'ob vmbo kb',
                                id: '2c0dd3c9-4432-4f0a-b103-f3ea2f5c1fc8',
                                description: 'VMBO kaderberoepsgerichte leerweg, onderbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3104',
                                title: 'ob vmbo tl',
                                id: 'c63858da-23e4-4e1e-8456-b4aa13a6a826',
                                description: 'VMBO theoretische leerweg, onderbouw',
                                type: 'Opleiding'      
                        },
                        {
                                prefix: '4107',
                                title: 'ob havo',
                                id: '5ca732b3-3ec2-4b13-9f08-d55b8739fe31',
                                description: 'HAVO, onderbouw',
                                type: 'Sector'
                        },
                        {
                                prefix: '4150',
                                title: 'ob vwo',
                                id: 'b5a4f104-fb2d-4c71-8f36-702d9567a752',
                                description: 'VWO, onderbouw',
                                type: 'Sector'
                        },
                        {
                                prefix: '3501',
                                title: 'bb vmbo bb',
                                id: '861d98e4-e5ae-4ed7-89f6-f224605f7c97',
                                description: 'VMBO basisberoepsgerichte leerweg, bovenbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3503',
                                title: 'bb vmbo gl',
                                id: '64852857-b601-419f-9cbb-e1335a185303',
                                description: 'VMBO gemengde leerweg, bovenbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3507',
                                title: 'bb vmbo kb',
                                id: '8574855d-0670-42bf-9f73-dc6706278b8b',
                                description: 'VMBO kaderberoepsgerichte leerweg, bovenbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '3504',
                                title: 'bb vmbo tl',
                                id: '8450c011-f812-4f89-97a9-6b8820baffc5',
                                description: 'VMBO theoretische leerweg, bovenbouw',
                                type: 'Opleiding'
                        },
                        {
                                prefix: '4600',
                                title: 'bb havo',
                                id: '6dc8e1f2-a929-418f-b4e5-6be1204639da',
                                description: 'HAVO, bovenbouw',
                                type: 'Sector'
                        },
                        {
                                prefix: '4700',
                                title: 'bb vwo',
                                id: 'caf5e806-cdb6-4d62-a5ed-0c3c1ff3e0bb',
                                description: 'VWO, bovenbouw',
                                type: 'Sector'
                        },
                        {
                                prefix: '',
                                title: 'ob vo',
                                id: '33cb23d5-67e2-4f82-9737-e72f8c1ca6cd',
                                description: 'Voortgezet Onderwijs, onderbouw',
                                type: 'Sector'
                        }
                    ];

                    var niveaus = {
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
//                        'ob vo': '33cb23d5-67e2-4f82-9737-e72f8c1ca6cd'
                    };

    window.slo = simply.app({
        commands: {
            downloadEntiteiten: function(el, value) {
                this.app.actions.downloadEntiteiten(value);
            },
            downloadXLSX: function(el, value) {
                var target = document.getElementById(value);
                this.app.actions.downloadXLSX(target);
            },
            downloadTree: function(el, value) {
                this.app.actions.downloadTree();
            },
            uploadXLSX: function(el, value) {
                this.app.actions.uploadXLSX(el, value);
            },
            uploadLDXLSX: function(el, value) {
                this.app.actions.uploadLDXLSX(el, value);
            },
            uploadLD2XLSX: function(el, value) {
                this.app.actions.uploadLD2XLSX(el, value);
            },
            uploadOBKXLSX: function(el, value) {
                this.app.actions.uploadOBKXLSX(el, value);
            },
            uploadKerndoelenXLSX: function(el, value) {
                this.app.actions.uploadKerndoelenXLSX(el, value);
            },
            uploadExamenXLSX: function(el, value) {
                this.app.actions.uploadExamenXLSX(el);
            },
            uploadExamenBGXLSX: function(el, value) {
                this.app.actions.uploadExamenBGXLSX(el);
            },
            uploadSyllabusXLSX: function(el, value) {
                this.app.actions.uploadSyllabusXLSX(el);
            },
            uploadNiveauXLSX: function(el, value) {
                this.app.actions.uploadNiveauXLSX(el);
            },
            toggleStruct: function(el, value) {
                this.app.actions.toggleStruct(el, value);
            },
            showRow: function(el) {
                this.app.actions.showRow(el, el.dataset.sloId);
            },
            editRow: function(el) {
                this.app.actions.editRow(el.closest('tr').dataset.simplyValue);
            },
            prevRow: function() {
                this.app.actions.prevRow();
            },
            nextRow: function() {
                this.app.actions.nextRow();
            },
            addRow: function() {
                this.app.actions.addRow();
            },
            delRow: function(el) {
                this.app.actions.delRow(el.closest('tr'));
            },
            close: function(el) {
                this.app.actions.close(el.closest('dialog'));
            },
            addChild: function(el) {
                if (el.form.elements.newChild.value) {
                    this.app.actions.addChild(el.form.elements.id.value, el.form.elements.newChild.value);
                    el.form.elements.newChild.value = '';
                }
            },
            delChild: function(el) {
                childId = el.parentElement.querySelector('.child-id').innerHTML;
                currentId = slo.view.updateRow.ID;
                this.app.actions.delChild(currentId, childId);
            },
            OBKShow: function(el) {
                var type = el.parentElement.dataset.sloType;
                var id = el.parentElement.dataset.sloId;
                var types = {
                    'vak' : 'vakkern',
                    'vakkern': 'vaksubkern',
                    'vaksubkern': 'vakinhoud',
                    'vakinhoud': 'doelniveau',
                    'doelniveau': 'doel'
                };
                var childType = types[type];
                var entity = slo.entities[type].filter(function(entity) {
                    return entity.id == id;
                }).pop();
                var ids = null;
                while (childType && typeof entity[childType+'_id'] == 'undefined') {
                    childType = types[childType];
                }
                var ids = entity[childType+'_id'];
                if (ids) {
                    var ul = el.nextElementSibling;
                    ul.innerHTML = getOBKHTML(slo.entities, childType, ids);
                }
                el.parentElement.classList.toggle('slo-collapsed');
            }
        },
        actions: {
            downloadTree: function() {
                var downloadTree = function(exportObj, exportName){
                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
                    var downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href",     dataStr);
                    downloadAnchorNode.setAttribute("download", exportName + ".json");
                    document.body.appendChild(downloadAnchorNode); // required for firefox
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                 }
                 downloadTree(slo.nodes, 'obk-tree.json');
                //saveAs(JSON.stringify(slo.nodes, null, "\t"), 'obk-tree.json');
            },
            downloadEntiteiten: function(name) {
                var renameData = function(data, rename, entiteiten) {
                    var applyDefinition = function(row, type, definition, extra) {
                        if (!entiteiten[type]) {
                            entiteiten[type] = [];
                        }
                        if (!extra) {
                            extra = {};
                        }
                        var entiteit = {};
                        Object.keys(definition).forEach(function(key) {
                            if ( typeof definition[key] == 'string' ) {
                                switch (definition[key][0]) {
                                    case '[':
                                        var linkType = definition[key].substring(1,definition[key].length-1);
                                        if (!row.ChildID) {
                                            break;
                                        }
                                        var children = row.ChildID.split(',');
                                        entiteit[key] = [];
                                        [].forEach.call(children, function(childID){
                                            childID = childID.trim();
                                            var childType = rename[slo.all[childID].Type];
                                            if (childType==linkType) {
                                                entiteit[key].push(childID);
                                            }
                                        });
                                    break;
                                    case '{':
                                        switch(definition[key].substring(1, definition[key].length-1)) {
                                            case 'uuid':
                                                var matching = entiteiten[type].filter(function(entry) {
                                                    return entry.title == entiteit.title;
                                                });
                                                if (!matching.length) {
                                                    entiteit[key] = uuidv4();
                                                } else {
                                                    entiteit[key] = matching[0].id;
                                                }
                                            break;
                                            case 'niveau':
                                                var levels = row.Level.split(',');
                                                levels = levels.map(l => l.trim()).map(l => niveaus[l]);
                                                if (!levels || !levels[0]) {
                                                    debugger;
                                                }
                                                entiteit[key] = levels;
                                            break;
                                            default:
                                                var ref = definition[key].substring(1,definition[key].length-1);
                                                if (ref.indexOf(':')!=-1) {
                                                    var refs = ref.split(':');
                                                    ref = refs[0];
                                                    subref = refs[1];
                                                    entiteit[key] = [extra[ref][subref] || ''];
                                                } else {
                                                    entiteit[key] = extra[ref] || '';
                                                }
                                            break;
                                        }
                                    break;
                                    default:
                                        entiteit[key] = row[definition[key]];
                                        if (typeof entiteit[key] === 'string' || entiteit[key] instanceof String) {
                                            entiteit[key] = entiteit[key].trim();
                                        }
                                    break;
                                }
                            } else {
                                extra[key] = applyDefinition(row, key, definition[key], extra);
                            }
                        });
                        if (Object.keys(entiteit).length) {
                            entiteiten[type].push(entiteit);
                        }

                        return entiteit;
                    };
                    Object.keys(data).forEach(function(ID) {
                        var row = data[ID];
                        if (!rename[row.Type]) {
                            console.warn('Skipped '+row.Type+' '+ID);
                            return;
                        }
                        row.originalType = row.Type;
                        row.Type = rename[row.Type];
                        if (!definitions[row.Type]) {
                            console.warn('Missing definition '+row.Type);
                            return;
                        }
                        applyDefinition(row, row.Type, definitions[row.Type]);    
                    });
                    return entiteiten;
                };
                if (name=='obk') {
                    
                } else if (name=='kerndoelen') {
                    var definitions = {
                        kerndoel_vakleergebied: {
                            id: 'ID',
                            title: 'Title',
                            description: 'Omschrijving',
                            prefix: 'Prefix',
                            tags: 'Tag',
                            kerndoel_domein_id: '[kerndoel_domein]',
                            kerndoel_uitstroomprofiel_id: '[kerndoel_uitstroomprofiel]',
                            kerndoel_id: '[kerndoel]'
                        },
                        kerndoel_domein: {
                            id: 'ID',
                            title: 'Title',
                            description: 'Omschrijving',
                            prefix: 'Prefix',
                            tags: 'Tag',
                            kerndoel_id: '[kerndoel]'
                        },
                        kerndoel_uitstroomprofiel: {
                            id: 'ID',
                            title: 'Title',
                            description: 'Omschrijving',
                            prefix: 'Prefix',
                            tags: 'Tag'
                        },
                        kerndoel: {
                            id: 'ID',
                            title: 'Title',
                            description: 'Omschrijving',
                            prefix: 'Prefix',
                            tags: 'Tag',
                            level: 'Niveau'
                        }
                    }
                    var rename = {
                        'kerndoel': 'kerndoel',
                        'kerndoel_domein': 'kerndoel_domein',
                        'kerndoel_uitstroomprofiel': 'kerndoel_uitstroomprofiel',
                        'kerndoel_vakleergebied': 'kerndoel_vakleergebied'
                    };
                    var entiteiten = {};
                } else {
                    var definitions = {
                        ldk_vak : {
                            id: '{uuid}',
                            vak_id: 'ID',
                            title: 'Title',
                            description: 'Description',
                            ldk_vakkern_id: '[ldk_vakkern]',
                            doelniveau_id: '[doelniveau]'
                        },
                        ldk_vakkern: {
                            id: '{uuid}',
                            vakkern_id: 'ID',
                            title: 'Title',
                            description: 'Description',
                            ldk_vaksubkern_id: '[ldk_vaksubkern]',
                            doelniveau_id: '[doelniveau]'
                        },
                        ldk_vaksubkern: {
                            id: '{uuid}',
                            vaksubkern_id: 'ID',
                            title: 'Title',
                            description: 'Description',
                            ldk_vakinhoud_id: '[ldk_vakinhoud]',
                            doelniveau_id: '[doelniveau]'
                        },
                        ldk_vakinhoud: {
                            id: '{uuid}',
                            vakinhoud_id: 'ID',
                            title: 'Title',
                            doelniveau_id: '[doelniveau]'
                        },
                        doel: {
                            title: 'Title',
                            id: 'ID',
                            description: 'Description',
                            type: 'originalType'
                        },
                        doelniveau: {
                            id: 'ID',
                            doel_id: '[doel]',
                            niveau_id: '{niveau}'
                        }
                    };
                    var entiteiten = {
                        'niveau': niveauEntiteiten
                    };
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
                var downloadJSON = function(data, name) {
                    var zip = new JSZip();
                    zip.file(name, JSON.stringify(data, null, '\t'));
                    zip.generateAsync({type:'blob'})
                    .then(function(content){
                        saveAs(content, 'entiteiten.zip');
                    })
                };
                switch(name) {
                    case 'leerdoelen':
                        var rename = {
                            'vak': 'ldk_vak',
                            'kern': 'ldk_vakkern',
                            'leerdoel kern': 'doel',
                            'subkern': 'ldk_vaksubkern',
                            'leerdoel subkern': 'doel',
                            'vakkern': 'ldk_vakkern',
                            'vaksubkern': 'ldk_vaksubkern',
                            'leerdoel': 'doel',
                            'doel': 'doel',
                            'niveau': 'niveau',
                            'inhoud': 'ldk_vakinhoud',
                            'kerndoel': 'doel',
                            'doelniveau': 'doelniveau',
                            'ldk_vak': 'ldk_vak',
                            'ldk_vakkern': 'ldk_vakkern',
                            'ldk_vaksubkern': 'ldk_vaksubkern',
                            'ldk_vakinhoud': 'ldk_vakinhoud',

                        };
                        var files = {
                            'ldk_vak': 'ldk.vakken.json',
                            'ldk_vakkern': 'ldk.vakkernen.json',
                            'ldk_vaksubkern': 'ldk.vaksubkernen.json',
                            'ldk_vakinhoud': 'ldk.vakinhouden.json',
                            'doelniveau': 'doelniveaus.json',
                            'doel': 'doelen.json',
                            'niveau': 'niveaus.json'
                        };
                        downloadZipFile(renameData(slo.all, rename, entiteiten), files, 'entiteiten.zip');
//                        downloadJSON(renameData(slo.all, rename),'out.json');
                    break;
                    case 'kerndoelen': 
                        var files = {
                            'kerndoel': 'kerndoelen.json',
                            'kerndoel_domein': 'domeinen.json',
                            'kerndoel_vakleergebied': 'vakleergebieden.json',
                            'kerndoel_uitstroomprofiel': 'uitstroomprofielen.json'
                        }
                        downloadZipFile(renameData(slo.all, rename, entiteiten), files, 'entiteiten.zip');
                    break;
                    case 'obk':
                        var files = {
                            'vak': 'vakken.json',
                            'vakkern': 'vakkernen.json',
                            'vaksubkern': 'vaksubkernen.json',
                            'vakinhoud': 'vakinhouden.json',
                            'doelniveau': 'doelniveaus.json',
                            'kerndoel': 'kerndoelen.json',
                            'doel': 'doelen.json',
                            'niveau': 'niveaus.json',
                            'deprecated': 'deprecated.json',
                            'alias': 'alias.json'
                        };
                        downloadZipFile(slo.entities, files, 'obk-entiteiten.zip');
//                        downloadJSON(slo.entities, 'obk.json');
                    break;
                }
            },
            //TODO: return promises in actions
            downloadXLSX: function(table) {
                var headings = ["ID", "ChildID", "Prefix", "Title", "Description", "Type", "Level", "Tags"];
                var name = table.querySelector('tbody').getAttribute('data-simply-list');
                var data = slo.api.clone(slo.view[name]);
                data.forEach(function(record) {
                    var childIDs = slo.all[record.ID].ChildID.split(',');
                    childIDs = childIDs.map(function(id) {
                        return slo.api.checkDedup(id);
                    });
                    record.ChildID = childIDs.join(',');
                });
                var ws = XLSX.utils.json_to_sheet(data, {header: headings});
                var wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, name);
                XLSX.writeFile(wb, name+'.xlsx');
            },
            uploadOBKXLSX: function(upload) {
                var reader = new FileReader();
                var finish = function(sheets) {
                    var firstKey = Object.keys(sheets)[0];
                    var dataSheet = sheets[firstKey];

                    var map = {
                        vak: {
                            id: 'Vak:OBK-Id',
                            title: 'Vak:Label',
                            description: 'Vak:Omschrijving'
                        },
                        vakkern: {
                            id: 'Vakkern:OBK-Id',
                            title: 'Vakkern:Label',
                            description: 'Vakkern:Omschrijving',
                            volgnr: 'Vakkern:Volgnr'
                        },
                        vaksubkern: {
                            id: 'Vaksubkern:OBK-Id',
                            title: 'Vaksubkern:Label',
                            description: 'Vaksubkern:Omschrijving',
                            volgnr: 'Vaksubkern:Volgnr'
                        },
                        vakinhoud: {
                            id: 'Vakinhoud:OBK-Id',
                            title: 'Vakinhoud:Label',
                            description: 'Vakinhoud:Omschrijving',
                            volgnr: 'Vakinhoud:Volgnr'
                        },
                        doel: {
                            id: 'Doel:OBK-Id',
                            title: 'Doel:Label',
                            description: 'Doel:Omschrijving',
                            volgnr: 'Doel:Volgnr'
                        }
                    }
                    slo.entities = {
                        vak: [],
                        vakkern: [],
                        vaksubkern: [],
                        vakinhoud: [],
                        doelniveau: [],
                        doel: [],
                        alias: [],
                        kerndoel: [],
                        niveau: niveauEntiteiten,
                        deprecated: []
                    };
                    var addChild = function(parentId, childId, name) {
                        if (!seen[parentId]) {
                            throw Error('unknown parent '+parentId);
                        }
                        var parent = seen[parentId];
                        if (!parent[name]) {
                            parent[name] = [];
                        }
                        if (parent[name].indexOf(childId)==-1) {
                            parent[name].push(childId);
                        }
                    };
                    var parseKerndoelen = function(row) {
                        if (!row['Kerndoelen:Labels']) {
                            return [];
                        }
                        var labels = row['Kerndoelen:Labels'].split('|').map(function(label) {
                            return label.trim();
                        });
                        var ids = row['Kerndoelen:Id'].split('|').map(function(id) {
                            return id.trim();
                        });
                        var kerndoelen = labels.map(function(label, index) {
                            return {
                                id: ids[index],
                                title: label,
                                type: 'kerndoel',
                                doelniveau_id: []
                            }
                        });
                        kerndoelen.forEach(function(doel) {
                            if (!slo.all[doel.id]) {
                                slo.all[doel.id] = doel;
                                slo.entities['kerndoel'].push(doel);
                            }
                        });
                        return kerndoelen.map(function(doel) {
                            return doel.id;
                        });
                    };
                    var updateKerndoelen = function(kerndoelen, doelniveaus) {
                        kerndoelen.forEach(function(kerndoelId) {
                            var kerndoel = seen[kerndoelId];
                            kerndoel.doelniveau_id = kerndoel.doelniveau_id.concat(doelniveaus);
                        });
                    };

                    var count = 1;
                    var nodes = slo.nodes;
                    dataSheet.forEach(function(row) {
                        var prevEntity = null;
                        var vakId, vakkernId, vaksubkernId, vakinhoudId = null;

                        count++;
                        Object.keys(map).forEach(function(entity) {
                            var temp = {
                            };
                            Object.keys(map[entity]).forEach(function(property) {
                                temp[property] = row[map[entity][property]];
                            });
                            if (!temp.id) {
                                console.log('unreadable row: '+row);
                                return;
                            }
/*
                            if (!seen[temp.id]) {
                                seen[temp.id] = temp;
                                out[entity].push(temp);
                            }
*/
                            switch(entity) {
                                case 'vak':
                                    if (!nodes[temp.id]) {
                                        nodes[temp.id] = Object.assign({
                                            type: 'vak',
                                            children: {},
                                            doelniveau: {}
                                        }, temp);
                                    }
                                    vakId = temp.id;
                                break;
                                case 'vakkern':
                                    //addChild(prevEntity.id, temp.id, 'vakkern_id');
                                    if (!nodes[vakId].children[temp.id]) {
                                        nodes[vakId].children[temp.id] = Object.assign({
                                            type: 'vakkern',
                                            children: {},
                                            doelniveau: {}
                                        }, temp);
                                    }
                                    vakkernId = temp.id;
                                break;
                                case 'vaksubkern':
                                    //addChild(prevEntity.id, temp.id, 'vaksubkern_id');
                                    if (!nodes[vakId].children[vakkernId].children[temp.id]) {
                                        nodes[vakId].children[vakkernId].children[temp.id] = Object.assign({
                                            type: 'vaksubkern',
                                            children: {},
                                            doelniveau: {}
                                        }, temp);
                                    }
                                    vaksubkernId = temp.id;
                                break;
                                case 'vakinhoud':
                                    //addChild(prevEntity.id, temp.id, 'vakinhoud_id');
                                    if (!nodes[vakId].children[vakkernId].children[vaksubkernId].children[temp.id]) {
                                        nodes[vakId].children[vakkernId].children[vaksubkernId].children[temp.id] = Object.assign({
                                            type: 'vakinhoud',
                                            children: {},
                                            doelniveau: {}
                                        }, temp);
                                    }
                                    vakinhoudId = temp.id;
                                break;
                                case 'doel':
                                    var kerndoelen = parseKerndoelen(row);
/*                                    var doelniveaus = [];
                                    Object.keys(niveaus).forEach(function(niveau) {
                                        if (row[niveau].trim().toLowerCase()=='true') {
                                            var doelniveau = {
                                                id: uuidv4(),
                                                doel_id: [temp.id],
                                                niveau_id: [niveaus[niveau]]
                                            };
                                            switch(niveau) {
                                                case 'po':
                                                case 'ob vmbo bl': 
                                                case 'ob vmbo gl':
                                                case 'ob vmbo kl':
                                                case 'ob vmbo tl':
                                                case 'ob havo':
                                                case 'ob vwo':
                                                    temp.type='tussendoel';
//                                                    doelniveau.doel_id.concat(kerndoelen);
                                                break;
                                                default:
                                                    temp.type='eindterm';
                                                break;
                                            }
                                            seen[doelniveau.id] = doelniveau;
                                            out['doelniveau'].push(doelniveau);
                                            doelniveaus.push(doelniveau.id);
                                            //addChild(prevEntity.id, doelniveau.id, 'doelniveau_id');
                                        } else if (row[niveau].trim().toLowerCase()!='false') {
                                            console.error('row '+count+': Invalid value for niveau '+niveau+': '+row[niveau]);
                                        }
                                    });
                                    updateKerndoelen(kerndoelen, doelniveaus); 
*/
                                    var parent = nodes[vakId];
                                    if (vakkernId) {
                                        parent = parent.children[vakkernId];
                                    }
                                    if (vaksubkernId) {
                                        parent = parent.children[vaksubkernId];
                                    }
                                    if (vakinhoudId) {
                                        var parent = parent.children[vakinhoudId];
                                    }
                                    if (!parent.doelniveau[temp.id]) {
                                        parent.doelniveau[temp.id] = [];
                                    }
                                    parent.doelniveau[temp.id].push(Object.assign(temp, {
                                        niveaus: Object.keys(niveaus).map(function(niveau) {
                                            if (row[niveau].trim().toLowerCase() == 'true') {
                                                var result = niveaus[niveau];
                                                return result;
                                            }
                                        }).filter(Boolean),
                                        kerndoelen: kerndoelen
                                    }));
                                break;
                            }
                            prevEntity = temp;
                        });
                    });
//                    renderOBK(out);
console.log('obk tree done');
                    obk.fix(slo.nodes);
                };
                reader.onload = function(e) {
                    var data = e.target.result;
                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                    var sheets = {};
                    workbook.SheetNames.forEach(function(sheetName) {
                        sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                            workbook.Sheets[sheetName]
                        );
                    });
                    finish(sheets);
                };
                reader.onerror = function(ex) {
                    console.error(ex);
                };
                reader.readAsBinaryString(upload.files[0]);    

            },
            uploadExamenXLSX: function(upload) {
                var processFile = function(file) {
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheets = {};
                            workbook.SheetNames.forEach(function(sheetName) {
                                sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                    workbook.Sheets[sheetName]
                                );
                            });
                            //finish(sheets);
                            resolve(sheets);
                        };
                        reader.onerror = function(ex) {
                            console.error(ex);
                            reject(ex);
                        };
                        reader.readAsBinaryString(file);
                    });
                };
                var files = Array.from(upload.files);
                var sheets = [];
                var processFiles = function() {
                    var file = files.pop();
                    if (file) {
                        return processFile(file).then(function(sheet) {
                            sheet.fileName = file.name;
                            sheets.push(sheet);
                            return processFiles();
                        });
                    }
                    return sheets;
                };
                processFiles().then(function(sheets) {
                    var tree = importSheet.importAll(sheets, examenConfig, function(tree) {
                        // correct stuff that can only be done per tree/sheet
                        // change all ID/ParentID's that aren't UUID's to uuid, since these can be things like '1A', which may occur in multiple sheets
                        // corrigeer alle ID's en links naar ID's
						var uuidMapping = {};
						var counter = 0;
						var seen = {};
						tree.all.forEach(function(row) {
							if (!isUUID(row.ID)) {
								if (!row.ID) {
									row.ID = 'missing_'+counter++;
								}
								if (!uuidMapping[row.ID]) {
									uuidMapping[row.ID] = uuidv4();
								}
								var newID = uuidMapping[row.ID];
								if (!seen[newID]) {
									seen[newID] = row;
								}
								if (seen[newID] != row) {
									tree.errors.push(row._sheet+':'+row._row+' bevat een al eerder gebruikte ID: "'+row.ID+'".');
								}
								row.ID = newID;
							}
							if (typeof row.ParentID!="undefined" && !isUUID(row.ParentID)) {
								if (uuidMapping[row.ParentID]) {
									row.ParentID = uuidMapping[row.ParentID];
								}
							}
						});
                        return tree;
                    });
                    parseTree(tree, examenConfig, document.getElementById('examenprogramma_info'));
                });
            },
            uploadExamenBGXLSX: function(upload) {
                var processFile = function(file) {
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheets = {};
                            workbook.SheetNames.forEach(function(sheetName) {
                                sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                    workbook.Sheets[sheetName]
                                );
                            });
                            //finish(sheets);
                            resolve(sheets);
                        };
                        reader.onerror = function(ex) {
                            console.error(ex);
                            reject(ex);
                        };
                        reader.readAsBinaryString(file);
                    });
                };
                var files = Array.from(upload.files);
                var sheets = [];
                var processFiles = function() {
                    var file = files.pop();
                    if (file) {
                        return processFile(file).then(function(sheet) {
                            sheet.fileName = file.name;
                            sheets.push(sheet);
                            return processFiles();
                        });
                    }
                    return sheets;
                };
                processFiles().then(function(sheets) {
                    var tree = importSheet.importAll(sheets, examenBGConfig, function(tree) {
                        // correct stuff that can only be done per tree/sheet
                        // change all ID/ParentID's that aren't UUID's to uuid, since these can be things like '1A', which may occur in multiple sheets
                        // corrigeer alle ID's en links naar ID's
                        return tree;
                    });
                    parseTree(tree, examenBGConfig, document.getElementById('examenprogramma_bg_info'));
                });
            },
            uploadSyllabusXLSX: function(upload) {
                var processFile = function(file) {
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheets = {};
                            workbook.SheetNames.forEach(function(sheetName) {
                                sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                    workbook.Sheets[sheetName]
                                );
                            });
                            //finish(sheets);
                            resolve(sheets);
                        };
                        reader.onerror = function(ex) {
                            console.error(ex);
                            reject(ex);
                        };
                        reader.readAsBinaryString(file);
                    });
                };
                var files = Array.from(upload.files);
                var sheets = [];
                var processFiles = function() {
                    var file = files.pop();
                    if (file) {
                        return processFile(file).then(function(sheet) {
                            sheet.fileName = file.name;
                            sheets.push(sheet);
                            return processFiles();
                        });
                    }
                    return sheets;
                };
                processFiles().then(function(sheets) {
                    var tree = importSheet.importAll(sheets, syllabusConfig, function(tree) {
                        // correct stuff that can only be done per tree/sheet
                        // change all ID/ParentID's that aren't UUID's to uuid, since these can be things like '1A', which may occur in multiple sheets
                        // corrigeer alle ID's en links naar ID's
                        return tree;
                    });
                    parseTree(tree, syllabusConfig, document.getElementById('syllabus_info'));
                });
            },
            uploadNiveauXLSX: function(upload) {
                var processFile = function(file) {
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheets = {};
                            workbook.SheetNames.forEach(function(sheetName) {
                                sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                    workbook.Sheets[sheetName]
                                );
                            });
                            //finish(sheets);
                            resolve(sheets);
                        };
                        reader.onerror = function(ex) {
                            console.error(ex);
                            reject(ex);
                        };
                        reader.readAsBinaryString(file);
                    });
                };
                var files = Array.from(upload.files);
                var sheets = [];
                var processFiles = function() {
                    var file = files.pop();
                    if (file) {
                        return processFile(file).then(function(sheet) {
                            sheet.fileName = file.name;
                            sheets.push(sheet);
                            return processFiles();
                        });
                    }
                    return sheets;
                };
                processFiles().then(function(sheets) {
                    var tree = importSheet.importAll(sheets, niveauConfig, function(tree) {
                        // correct stuff that can only be done per tree/sheet
                        // change all ID/ParentID's that aren't UUID's to uuid, since these can be things like '1A', which may occur in multiple sheets
                        // corrigeer alle ID's en links naar ID's
                        return tree;
                    });
                    parseTree(tree, niveauConfig, document.getElementById('niveau_info'));
                });
            },

            uploadLD2XLSX: function(upload, target) {
                var processFile = function(file) {
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheets = {};
                            workbook.SheetNames.forEach(function(sheetName) {
                                sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                    workbook.Sheets[sheetName]
                                );
                            });
                            //finish(sheets);
                            resolve(sheets);
                        };
                        reader.onerror = function(ex) {
                            console.error(ex);
                            reject(ex);
                        };
                        reader.readAsBinaryString(file);
                    });
                };
                var files = Array.from(upload.files);
                var sheets = [];
                var processFiles = function() {
                    var file = files.pop();
                    if (file) {
                        return processFile(file).then(function(sheet) {
                            sheet.fileName = file.name;
                            sheets.push(sheet);
                            return processFiles();
                        });
                    }
                    return sheets;
                };
                processFiles().then(function(sheets) {
                    var tree = importSheet.importAll(sheets, ldkConfig, function(tree) {
                        // correct stuff that can only be done per tree/sheet
                        // change all ID/ParentID's that aren't UUID's to uuid, since these can be things like '1A', which may occur in multiple sheets
                        // corrigeer alle ID's en links naar ID's
						var uuidMapping = {};
						var counter = 0;
						var seen = {};
						tree.all.forEach(function(row) {
							if (!isUUID(row.ID)) {
								if (!row.ID) {
									row.ID = 'missing_'+counter++;
								}
								if (!uuidMapping[row.ID]) {
									uuidMapping[row.ID] = uuidv4();
								}
								var newID = uuidMapping[row.ID];
								if (!seen[newID]) {
									seen[newID] = row;
								}
								if (seen[newID] != row) {
									tree.errors.push(row._sheet+':'+row._row+' bevat een al eerder gebruikte ID: "'+row.ID+'".');
								}
								row.ID = newID;
							}
							if (typeof row.ParentID!="undefined" && !isUUID(row.ParentID)) {
								if (uuidMapping[row.ParentID]) {
									row.ParentID = uuidMapping[row.ParentID];
								}
							}
						});
                        return tree;
                    });
                    parseTree(tree);
                });
/*                var promises = files.map(processFile);
                Promise.all(promises)
                .then(function(filesData) {
                    var tree = importSheet.importAll(filesData);
                });
*/
//                files.forEach(function(file) {
//                    processFile(file);
//                });
            },
            uploadLDXLSX: function(upload, target) {
                var sheets = {};
                var uuidMapping = [];
                var finish = function(sheets) {
                    var combinedSheet = [];
                    Object.keys(sheets).forEach(function(sheetName) {
                        combinedSheet = combinedSheet.concat(sheets[sheetName]);
                    });
                    var errors = 0;
                    var IDs = {};
                    var unique = slo.api.clone(slo.view[target]);
                    var prefixes = {};
                    var addedDoelNiveaus = [];
                    var getDoelNiveau = function(doelID, Level) {
                        if (!Level) {
                            debugger;
                        }
                        var DoelNiveau = doelniveaus.filter(function(dn) {
                            return dn.ChildID == doelID && dn.Level == Level;
                        }).pop();
                        if (!DoelNiveau) {
                            var DoelNiveau = {
                                ID: uuidv4(),
                                ChildID: doelID,
                                Level: Level,
                                Type: 'DoelNiveau'
                            };
                            DoelNiveau.Title = DoelNiveau.ID;
                            doelniveaus.push(DoelNiveau);
                            slo.all[DoelNiveau.ID] = DoelNiveau;
                            addedDoelNiveaus.push(DoelNiveau);
                        }
                        return DoelNiveau;
                    };
                    var loadDoelNiveaus = function() {
                        combinedSheet.forEach(function(row) {
                            if (row.Type=='doelniveau') {
                                doelniveaus.push(row);
                            }
                        });
                    };
                    var makeEntity = function(row) {
                        if (!row.ID && row.ID!==0) {
                            row.ID = uuidv4();
                        }
                        row = slo.api.correctData(row);
                        if (typeof row.ID == 'string' && row.ID.length >= 36) {
                            row.ID = row.ID.trim();
                        } else {
                            var index = row.ID;
                            if ( uuidMapping[index] ) {
                                row.ID = uuidMapping[index];
                            } else {
                                row.ID = uuidv4();
                                uuidMapping[index] = row.ID;
                            }
                        }
                        if (!slo.all[row.ID]) {
                            // first check for duplicates
                            row.ID = slo.api.dedup(row);
                        }
                        if (row.Prefix) {
                            prefixes[row.Prefix] = row.ID;
                        }
                        if (row.Type.match(/leerdoel|leerdoel kern|leerdoel subkern|inhoud/i)) {
                            // doel op niveau entiteit maken / vinden
                            var DoelNiveau = getDoelNiveau(row.ID, row.Level);
                        } else {
                            var DoelNiveau = false;
                        }

                        if (!slo.all[row.ID]) {
                            slo.all[row.ID] = Object.assign({
                                ID: '',
                                ChildID: '',
                                Prefix: '',
                                Title: '',
                                Description: '',
                                Type: '',
                                Level: '',
                                Tags: ''
                            }, row);
                            unique.push(slo.all[row.ID]);
                        } else if (!slo.all[row.ID].Title) {
                            slo.all[row.ID] = Object.assign(slo.all[row.ID], row);
                            unique.push(slo.all[row.ID]);
                        } 
                        if (row.ParentID || row.ParentID===0) {
                            if (typeof row.ParentID == 'string' && row.ParentID.length >= 36) {
                                row.ParentID = row.ParentID.trim();
                            } else {
                                if ( uuidMapping[row.ParentID]) {
                                    row.ParentID = uuidMapping[row.ParentID];
                                } else {
                                    throw new Error('Unkown ParentID '+row.ParentID+' for '+row.ID);
                                }
                            }
                            row.ParentID = slo.api.checkDedup(row.ParentID);
                            if (!slo.parents[row.ID]) {
                                slo.parents[row.ID] = new Set();
                            }
                            if (DoelNiveau) {
                                slo.parents[row.ID].add(DoelNiveau.ID);
                                if (!slo.parents[DoelNiveau.ID]) {
                                    slo.parents[DoelNiveau.ID] = new Set();
                                }
                                slo.parents[DoelNiveau.ID].add(row.ParentID);
                                if (!slo.all[row.ParentID]) {
                                    slo.all[row.ParentID] = { ID: row.ParentID, ChildID: ''};
                                }
                                slo.api.fixHierarchyByParent(row, prefixes);
                                var children = slo.all[row.ParentID].ChildID.split(',').filter(Boolean);
                                children.push(DoelNiveau.ID);
                            } else {
                                slo.parents[row.ID].add(row.ParentID);
                                if (!slo.all[row.ParentID]) {
                                    slo.all[row.ParentID] = { ID: row.ParentID, ChildID: '' };
                                }
                                slo.api.fixHierarchyByParent(row, prefixes);
                                var children = slo.all[row.ParentID].ChildID.split(',').filter(Boolean);
                                children.push(row.ID);
                            }
                            slo.all[row.ParentID].ChildID = children.filter(onlyUnique).join(',');
                            delete row.ParentID;
                            delete slo.all[row.ID].ParentID;
                        } else if (row.ChildID) {
                            row.ChildID = row.ChildID.split(',').map(function(id) {
                                return slo.api.checkDedup(id.trim());
                            }).join(',');
                        }
                        row.Title = row.Title.trim();
                    }
                    loadDoelNiveaus(combinedSheet);
                    combinedSheet.forEach(function(row) {
                        makeEntity(row);
                    });
                    Object.keys(slo.all).forEach(function(id) {
                        if (typeof slo.all[id].Title == 'undefined') {
                            unique.push(Object.assign(slo.all[id], {
                                Title: '',
                                Prefix: '',
                                Type: '',
                                Level: '',
                                Description: ''
                            }));
                        }
                    });
                    unique = unique.concat(addedDoelNiveaus);

                    unique.forEach(function(row) {
                        if (checkJSONRow(slo.all[row.ID])) {
                            errors++;
                        }
                    });
                    unique.forEach(function(row) {
                        row.ChildID.split(',').forEach(function(childID) {
                            childID = childID.trim();
                            if (childID) {
                                if (!slo.parents[childID]) {
                                    slo.parents[childID] = new Set();
                                }
                                slo.parents[childID].add(row.ID);
                            }
                        });
                    });
                    unique.forEach(function(row) {
                        row.Level = slo.all[row.ID].Level;    
                    });
                    findRoots();
                    slo.view.errors = errors;
                    slo.view[target] = unique;
                    var all = unique.map(function(row) {
                        return {
                            option: {
                                value: ''+row.ID,
                                innerHTML: ''+(row.Prefix?row.Prefix+' ':'') + row.Title
                            }
                        }
                    });
                    slo.view[target+'-ids'] = all;
                    showStruct({
                        ChildID: slo.roots.join(',')
                    });
                    slo.view[target+'-headers'] = ['ID','ChildID','Prefix','Title','Description','Type','Level'];
                }
                var processFile = function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        var sheets = {};
                        workbook.SheetNames.forEach(function(sheetName) {
                            sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                workbook.Sheets[sheetName]
                            );
                        });
                        finish(sheets);
                    };
                    reader.onerror = function(ex) {
                        console.error(ex);
                    };
                    reader.readAsBinaryString(file);
                };
                var files = Array.from(upload.files);
                files.forEach(function(file) {
                    processFile(file);
                });
            },
            uploadKerndoelenXLSX: function(upload, target) {
                var sheets = {};
                var uuidMapping = [];
                var finish = function(sheets) {
                    var tree = importSheet.import(sheets);
                    // generate missing id's
                    var uuidMapping = {};
                    tree.all = tree.all.map(function(row) {
                        if (!isUUID(row.ID)) {
                            if (!uuidMapping[row.ID]) {
                                uuidMapping[row.ID] = uuidv4();
                            }
                            row.ID = uuidMapping[row.ID];
                        }
                        return row;
                    });
                    tree.ids = {};
                    tree.all.forEach(function(row) {
                        if (tree.ids[row.ID]) {
                            // merge - only happens for level
                            tree.ids[row.ID].level += ', '+row.level;
                        } else {
                            tree.ids[row.ID] = row;
                        }
                    });
                    tree.all = tree.all.map(function(row) {
                        if (row.ParentID) {
                            row.ParentID = uuidMapping[row.ParentID] ? uuidMapping[row.ParentID] : row.ParentID;
                        }
                        if (row.childID) {
                            row.ChildID = row.childID.map(function(id) {
                                if (!tree.all[id].ID) {
                                    debugger;
                                }
                                return tree.all[id].ID;
                            }).filter(onlyUnique).join(',');
                        }
                        return row;
                    });
                    slo.all = tree.ids;
                    // show tree as rows
                    slo.view.kerndoelen = slo.api.clone(tree.all);
                    slo.data.kerndoelen = tree;
                };

                var processFile = function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        var sheets = {};
                        workbook.SheetNames.forEach(function(sheetName) {
                            sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                workbook.Sheets[sheetName]
                            );
                        });
                        finish(sheets);
                    };
                    reader.onerror = function(ex) {
                        console.error(ex);
                    };
                    reader.readAsBinaryString(file);
                };
                var files = Array.from(upload.files);
                files.forEach(function(file) {
                    processFile(file);
                });
            },
            uploadXLSX: function(upload, target) {
                var sheets = {};
                var uuidMapping = [];
                var finish = function(sheets) {
                    var combinedSheet = [];
                    Object.keys(sheets).forEach(function(sheetName) {
                        combinedSheet = combinedSheet.concat(sheets[sheetName]);
                    });
                    var errors = 0;
                    var IDs = {};
                    var unique = slo.api.clone(slo.view[target]);
                    var prefixes = {};
                    combinedSheet.forEach(function(row) {
                        if (!row.ID && row.ID!==0) {
                            row.ID = uuidv4();
                        }
                            row = slo.api.correctData(row);
                            if (typeof row.ID == 'string') {
                                row.ID = row.ID.trim();
                            } else {
                                var index = row.ID;
                                if ( uuidMapping[index] ) {
                                    row.ID = uuidMapping[index];
                                } else {
                                    row.ID = uuidv4();
                                    uuidMapping[index] = row.ID;
                                }
                            }
                            if (!slo.all[row.ID]) {
                                // first check for duplicates
                                row.ID = slo.api.dedup(row);
                            }
                            if (row.Prefix) {
                                prefixes[row.Prefix] = row.ID;
                            }
                            if (!slo.all[row.ID]) {
                                slo.all[row.ID] = Object.assign({
                                    ID: '',
                                    ChildID: '',
                                    Prefix: '',
                                    Title: '',
                                    Description: '',
                                    Type: '',
                                    Level: '',
                                    Tags: ''
                                }, row);
                                unique.push(slo.all[row.ID]);
                            } else if (!slo.all[row.ID].Title) {
                                slo.all[row.ID] = Object.assign(slo.all[row.ID], row);
                                unique.push(slo.all[row.ID]);
                            } else if (typeof row.Level != 'undefined') {
                                var Levels = slo.all[row.ID].Level.split(',');
                                Levels.push(row.Level.trim());
                                slo.all[row.ID].Level = Levels.filter(onlyUnique).join(',');
                                row.Level = slo.all[row.ID].Level;
                            }
                            if (row.ParentID || row.ParentID===0) {
                                if (typeof row.ParentID == 'string') {
                                    row.ParentID = row.ParentID.trim();
                                } else {
                                    if ( uuidMapping[row.ParentID]) {
                                        row.ParentID = uuidMapping[row.ParentID];
                                    } else {
                                        throw new Error('Unkown ParentID '+row.ParentID+' for '+row.ID);
                                    }
                                }
                                row.ParentID = slo.api.checkDedup(row.ParentID);
                                if (!slo.parents[row.ID]) {
                                    slo.parents[row.ID] = new Set();
                                }
                                slo.parents[row.ID].add(row.ParentID);
                                if (!slo.all[row.ParentID]) {
                                    slo.all[row.ParentID] = { ID: row.ParentID, ChildID: '' };
                                }
                                slo.api.fixHierarchyByParent(row, prefixes);
                                var children = slo.all[row.ParentID].ChildID.split(',').filter(Boolean);
                                children.push(row.ID);
                                slo.all[row.ParentID].ChildID = children.filter(onlyUnique).join(',');
                                delete row.ParentID;
                                delete slo.all[row.ID].ParentID;
                            } else if (row.ChildID) {
                                row.ChildID = row.ChildID.split(',').map(function(id) {
                                    return slo.api.checkDedup(id.trim());
                                }).join(',');
                            }
                            row.Title = row.Title.trim();
                    });
                    Object.keys(slo.all).forEach(function(id) {
                        if (typeof slo.all[id].Title == 'undefined') {
                            unique.push(Object.assign(slo.all[id], {
                                Title: '',
                                Prefix: '',
                                Type: '',
                                Level: '',
                                Description: ''
                            }));
                        }
                    });
                    unique.forEach(function(row) {
                        if (checkJSONRow(slo.all[row.ID])) {
                            errors++;
                        }
                    });
                    unique.forEach(function(row) {
                        row.ChildID.split(',').forEach(function(childID) {
                            childID = childID.trim();
                            if (childID) {
                                if (!slo.parents[childID]) {
                                    slo.parents[childID] = new Set();
                                }
                                slo.parents[childID].add(row.ID);
                            }
                        });
                    });
                    unique.forEach(function(row) {
                        row.Level = slo.all[row.ID].Level;    
                    });
                    findRoots();
                    slo.view.errors = errors;
                    slo.view[target] = unique;
                    var all = unique.map(function(row) {
                        return {
                            option: {
                                value: ''+row.ID,
                                innerHTML: ''+(row.Prefix?row.Prefix+' ':'') + row.Title
                            }
                        }
                    });
                    slo.view[target+'-ids'] = all;
                    showStruct({
                        ChildID: slo.roots.join(',')
                    });
                    slo.view[target+'-headers'] = ['ID','ChildID','Prefix','Title','Description','Type','Level'];
                };

                var processFile = function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        var sheets = {};
                        workbook.SheetNames.forEach(function(sheetName) {
                            sheets[sheetName] = XLSX.utils.sheet_to_row_object_array(
                                workbook.Sheets[sheetName]
                            );
                        });
                        finish(sheets);
                    };
                    reader.onerror = function(ex) {
                        console.error(ex);
                    };
                    reader.readAsBinaryString(file);
                };
                var files = Array.from(upload.files);
                files.forEach(function(file) {
                    processFile(file);
                });
            },
            openStruct: function(id) {
                var renderStruct = function(row, childStruct) {
                    if (!slo.all[row.ID]) {
                        console.error('Missing entity '+row.ID, row);
                        return;
                    }
                    var struct = getStructHTML(slo.all[row.ID], childStruct);
                    var nodes = slo.container.querySelectorAll('li[data-slo-id="'+row.ID+'"]');
                    if (!nodes.length) {
                        if (slo.parents[row.ID]) {
                            slo.parents[row.ID].forEach(function(parent) {
                                if (slo.all[parent]) {
                                    renderStruct(slo.all[parent], { id: row.ID, html: struct} );
                                } else if (row.Type!='ldk_vak') {
                                    console.error('Missing parent '+parent, row);
                                }
                            });
                        }
                    } else {
                        [].forEach.call(nodes, function(el) {
                            var ul = el.querySelector(':scope > ul');
                            ul.innerHTML = struct;
                        });
                    }
                };
                highlighted[id] = true;
                var rowEl = slo.container.querySelector('tr[data-simply-value="'+id+'"]');
                var row   = slo.all[id];
                renderStruct(row);
                var el = slo.container.querySelector('li[data-slo-id="'+id+'"]');
                if (el) {
                    rowEl.classList.add('slo-highlight');
                    var els = slo.container.querySelectorAll('li[data-slo-id="'+id+'"]');
                    [].forEach.call(els, function(el) {
                        do {
                            el.classList.remove('slo-collapsed');
                            var ul = el.querySelector(':scope > ul');
                            if (ul.innerHTML == '') {
                                ul.innerHTML = getStructHTML(slo.all[id]);
                            }
                            el = el.parentElement.closest('li[data-slo-id]');
                        } while(el);
                    });
                }
            },
            closeStruct: function(id) {
                delete highlighted[id];
                var rowEl = slo.container.querySelector('tr[data-simply-value="'+id+'"]');
                var el    = slo.container.querySelector('li[data-slo-id="'+id+'"]');
                if (el) {
                    rowEl.classList.remove('slo-highlight');
                    var els = slo.container.querySelectorAll('li[data-slo-id="'+id+'"]');
                    [].forEach.call(els, function(el) {
                        do {
                            if (!highlighted[el.dataset.sloId] 
                                && !el.querySelector(':scope li:not(.slo-collapsed)')
                            ) {
                                el.classList.add('slo-collapsed');
                            }
                            el = el.parentElement.closest('li[data-slo-id]');
                        } while(el);
                    });
                }
            },
            toggleStruct: function(el, id) {
                if (highlighted[id]) {
                    slo.actions.closeStruct(id);
                } else {
                    slo.actions.openStruct(id);
                }
            },
            showRow: function(el, id) {
                if (el.classList.contains('slo-collapsed')) {
                    el.classList.remove('slo-collapsed');
                    // find children and render them here
                    var ul = el.querySelector(':scope > ul');
                    if (ul.innerHTML == '') {
                        ul.innerHTML = getStructHTML(slo.all[id]);
                    }
                    var rowEl = slo.container.querySelector('tr[data-simply-value="'+id+'"]');
                    if (rowEl) {
                        rowEl.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        rowEl.classList.add('slo-yellow-fade');
                        window.setTimeout(function() {
                            rowEl.classList.remove('slo-yellow-fade');
                        }, 1000);
                    }
                } else {
                    el.classList.add('slo-collapsed');
                }
            },
            editRow: function(id) {
                // fill the edit overlay with the data linked to id
                // show edit overlay directly below the row clicked
                var editPanel = document.getElementById('editPanel');
                if (previousId) {
                    slo.actions.closeStruct(previousId);
                    previousId = false;
                }
                if (!highlighted[id]) {
                    previousId = id;
                }
                slo.actions.openStruct(id);
                slo.view.updateID = id;
                slo.view.updateRow = slo.api.clone(slo.all[id]);
                slo.view.updateRow.children = slo.view.updateRow.ChildID.split(',').map(function(childID) {
                    if (childID) {
                        return {
                            ID: childID,
                            Title: slo.all[childID].Title
                        };
                    } else {
                        return null;
                    }
                }).filter(Boolean);
                var current = false;
                var count = 0;
                for (var i=0, l=slo.view['leerdoelen'].length;i<l;i++) {
                    if (slo.view['leerdoelen'][i].ID == id) {
                        current = i+1;
                        break;
                    }
                }
                slo.view.count = {
                    max: slo.view['leerdoelen'].length,
                    current: current
                };
                window.setTimeout(function() {
                    [].forEach.call(editPanel.querySelectorAll('input,textarea'), function(el) {
                        if (el.value) {
                            el.parentElement.classList.add('is-dirty');
                        } else {
                            el.parentElement.classList.remove('is-dirty');
                        }
                    });
                    editPanel.classList.remove('slo-hidden');
                    document.body.classList.add('slo-dialog');
                    slo.api.validateInputs();
                    editPanel.open = true;
                    window.setTimeout(function() {
                        editPanel.querySelector('input,textarea').focus();
                    })
                },100);
            },
            prevRow: function() {
                slo.view.count.current = Math.max(slo.view.count.current - 1, 1);
                slo.actions.editRow(slo.view['leerdoelen'][slo.view.count.current-1].ID);
            },
            nextRow: function() {
                slo.view.count.current = Math.min(slo.view.count.current + 1, slo.view.count.max);
                slo.actions.editRow(slo.view['leerdoelen'][slo.view.count.current-1].ID);
            },
            addRow: function() {
                var row = {
                    ID: uuidv4(),
                    ChildID: '',
                    Prefix: '',
                    Title: '',
                    Description: '',
                    Type: '',
                    Level: ''
                };
                slo.view['leerdoelen'].push(row);
                slo.all[row.ID] = row;
            },
            delRow: function(rowEl) {
                var id = rowEl.dataset.simplyValue;
                var record = slo.view['leerdoelen'].filter(function(record) {
                    return record.ID==id;
                })[0];
                if (record.error) {
                    slo.view.errors -= 1;
                }
                rowEl.parentElement.removeChild(rowEl);
                if (slo.parents[id]) {
                    slo.parents[id].forEach(function(parentID) {
                        if (slo.all[parentID]) {
                            var children = slo.all[parentID].ChildID.split(',');
                            children = children.filter(function(childID) {
                                return childID!=id;
                            });
                            slo.all[parentID].ChildID = children.join(',');
                        }
                    });
                }
                if (record.ChildID) {
                    record.ChildID.split(',').forEach(function(childID) {
                        childID = childID.trim();
                        slo.parents[childID].delete(id);
                    });
                }
                delete slo.all[id];
//                slo.all[id].Title = '<span style="color: red;">Verwijderd</span>';
//                slo.all[id].Prefix = '';
                findRoots();
//                slo.roots = slo.roots.filter(function(rootID) {
//                    return rootID!=id;
//                });
                showStruct({
                    ChildID: slo.roots.join(',')
                });
            },
            close: function(dialog) {
                document.body.classList.remove('slo-dialog');
                dialog.removeAttribute('open');
                dialog.classList.add('slo-hidden');
            },
            update: function(id, data) {
                // update leerdoelen
                var record = slo.view['leerdoelen'].filter(function(row) {
                    return row.ID == id;
                })[0];
                data.children.forEach(function(child) {
                    if (!slo.parents[child.ID]) {
                        slo.parents[child.ID] = new Set();
                    }
                    slo.parents[child.ID].add(data.ID);
                });
                record.ID          = ''+data.ID;
                record.ChildID     = ''+data.children.map(function(child) {
                    return child.ID.trim();
                }).join(',');
                record.Prefix      = ''+data.Prefix;
                record.Title       = ''+data.Title;
                record.Description = ''+data.Description;
                record.Type        = ''+data.Type;
                record.Level       = ''+data.Level;
                var wasError = record.error;
                record.error = '';
                slo.all[record.ID] = record;
                if (checkJSONRow(record)) {
                    if (!wasError) {
                        slo.view.errors += 1;
                    }
                } else {
                    if (wasError) {
                        slo.view.errors -= 1;
                    }
                }
                if (!slo.view.errors) {
                    slo.view.errors = '';
                }
                findRoots();
                showStruct({
                    ChildID: slo.roots.join(',')
                });
                window.setTimeout(function() {
                    //FIXME: do this on resolve
                    slo.actions.openStruct(data.ID);
                }, 500);
            },
            addChild: function(parentID, childID) {
                if (!slo.api.isParent(slo.all[parentID], childID)) {
                    slo.view.updateRow.children.push({
                        ID: slo.all[childID].ID,
                        Title: slo.all[childID].Title
                    });
                    slo.actions.update(slo.view.updateID, slo.view.updateRow);
                }
            },
            delChild: function(parentID, childID) {
                slo.view.updateRow.children = slo.view.updateRow.children.filter(function(child) {
                    return (child.ID!=childID);
                });
                slo.actions.update(slo.view.updateID, slo.view.updateRow);
                if (slo.parents[childID]) {
                    slo.parents[childID].delete(parentID);
                }
                findRoots();
                showStruct({
                    ChildID: slo.roots.join(',')
                });
            }                
        },
        routes: {
            //TODO: implement basic routes
        },
        saveChanges: false,
    });

    function uuidv4() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    }

    simply.collect.addListener('record', function(elements) {
        window.setTimeout(function() {
            slo.actions.update(slo.view.updateID, slo.view.updateRow);
        }, 100);
    });

    var checkJSONRow = function(row) {
        if (!row.ID && row.ID!==0) {
            row.error = 'Geen ID';
            return row.error;
        }
        if (typeof row.ID == 'string') {
            row.ID = row.ID.trim();
        }
        row.Type    = row.Type ? row.Type.toLowerCase().trim() : '';
        var types   = ["vak","eindterm","kern","vakkern","subkern","vaksubkern","inhoud","vakinhoud","leerdoel", "leerdoel kern","leerdoel subkern","kerndoel", "doelniveau"];
        if (!row.Type) {
            if (row.Title.match(/kerndoel.*/i)) {
                row.Type    = 'kerndoel';
            } else {
                row.error = 'Type mist';
                return row.error;
            }
        }
        if (types.indexOf(row.Type)==-1) {
            row.error = "Onbekend type";
            return row.error;
        }
    };

    var isUUID = function(id) {
        var RE = /^(bk:)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return RE.test(id);
    };

    slo.nodes = {};
    slo.all = {};
    slo.parents = {};
    slo.roots = [];
    slo.entities = {};
    slo.missingParents = [];
    slo.data = {};

    function findRoots() {
        slo.roots = [];
        Object.keys(slo.all).forEach(function(childID) {
            if (!slo.parents[childID] || !slo.parents[childID].size) {
                slo.roots.push(childID);
            }
        });
    }

    function getChildType(type) {
        var types = ['vak','vakkern','vaksubkern','vakinhoud',null]
        var index = types.indexOf(type);
        return (index!=-1) ? types[index+1] : false;
    };

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    };


    var obk = {
        idIndex: {},
        walk: function(nodes, f, parent) {
            Object.keys(nodes).forEach(function(nodeId) { 
                f.call(nodes[nodeId], parent);
                if (nodes[nodeId].children) { 
                    obk.walk(nodes[nodeId].children, f, nodes[nodeId]); 
                }
                // don't walk over doelniveau, let calback function f do that if needed
            });
        },
        findDuplicates: function(tree) {
            obk.walk(tree, function(parent) {
                this.parent = parent;
                if (!obk.idIndex[this.id]) {
                    obk.idIndex[this.id] = [];
                }
                obk.idIndex[this.id].push(this);
            });
        },
        generateNewIds: function() {
            var generateId = function(node){
                if (!node.uuid) {
                    node.uuid = uuidv4();
                    node.replaces = [node.id];
                    if (node.parent) {
                        generateId(node.parent);
                    }
                }
            };
            Object.keys(obk.idIndex).forEach(function(obkId) {
                if (obk.idIndex[obkId].length==1) {
                    return;
                }
                obk.idIndex[obkId].forEach(function(node) {
                    generateId(node);
                });
            });
        },
        addEntities: function() {

            if (!slo.entities.alias) {
                slo.entities.alias = [];
            }

            var addDoel = function(doelen, node) {
                // merge data from doelen into single doel
                // add alias for different titles/descriptions
                var doel = doelen[0];

                var entity = slo.all[doel.id];
                // maak een nieuw doel entity, als deze nog niet bestaat
                if (!entity) {
                    entity = slo.all[doel.id] = {
                        id: doel.id,
                        title: doel.title,
                        description: doel.description,
                        volgnr: doel.volgnr
                    };
                    slo.entities.doel.push(entity);
/*                } else {
                    // als deze wel bestaat, controleer dan title en description, bij verschil voeg
                    // dan een alias toe voor bestaande doel gekoppeld aan node
                    if (entity.title != doel.title || entity.description != doel.description) {
                        slo.entities.alias.push({
                            doel_id: doel.id,
                            title: doel.title,
                            description: doel.description,
                            parent_id: node.uuid ? node.uuid : node.id
                        });
                    }
*/                }

                doelen.forEach(function(doel) {
                    if (entity.title != doel.title || entity.description != doel.description) {
                        slo.entities.alias.push({
                            doel_id: doel.id,
                            title: doel.title,
                            description: doel.description,
                            parent_id: node.uuid ? node.uuid : node.id
                        });
                    }
                });
                return entity
            };
            var linkKerndoelen = function(kerndoelen, doelniveaus) {
                kerndoelen.forEach(function(kerndoelId) {
                    var kerndoel = slo.all[kerndoelId];
                    kerndoel.doelniveau_id = kerndoel.doelniveau_id.concat(doelniveaus).filter(onlyUnique);
                });
            };

            var niveauIndex = {};
            
            var addDoelNiveaus = function(doelen, node) {
                // can have multiple doelen with same id, different niveau and maybe title/description
                var doelEntity = addDoel(doelen, node);
//                console.log('added doel '+doelen[0].id);
                // maak een nieuwe doelniveau entity voor elk niveau, als deze nog niet bestaat
                var doelniveaus = [];
                var kerndoelen = [];
                doelen.forEach(function(doel) {
                    doel.niveaus.forEach(function(niveauId) {
//                        if (niveauId=='861d98e4-e5ae-4ed7-89f6-f224605f7c97') {
//                            debugger;
//                        }
                        if (!niveauIndex[doelEntity.id]) {
                            niveauIndex[doelEntity.id] = {};
                        }
                        var doelniveau = niveauIndex[doelEntity.id][niveauId];
                        if (!doelniveau) {
                            doelniveau = {
                                id: uuidv4(),
                                doel_id: [doelEntity.id],
                                niveau_id: [niveauId]
                            };
                            niveauIndex[doelEntity.id][niveauId] = doelniveau;
                            slo.entities.doelniveau.push(doelniveau);
//                            console.log('added '+doelniveau.id+' for niveau '+niveauId);
                        } else {
//                            console.log('found '+doelniveau.id+' for niveau '+niveauId);
                        }
                        doelniveaus.push(doelniveau.id);
                    });
                    kerndoelen = kerndoelen.concat(doel.kerndoelen);
                });
                // koppel kerndoelen aan doel entity
                linkKerndoelen(kerndoelen.filter(onlyUnique), doelniveaus);
                return doelniveaus;
            };

            var addEntity = function(node) {
                var id = node.uuid ? node.uuid : node.id;
                if (!node.added) {
                    node.added = true;
                    var entity = {
                        id: id,
                        title: node.title,
                        description: node.description
                    };
                    if (node.uuid) {
                        entity.unreleased = true;
                        entity.replaces = [ node.id ];
                    }
                    if (node.volgnr) {
                        entity.volgnr = node.volgnr;
                    }
                    if (node.children && Object.keys(node.children).length) {
                        var prop = getChildType(node.type);
                        if (!prop) {
                            throw new Error('node has children, but type does not support it. '+id);
                        }
                        entity[prop+'_id'] = Object.values(node.children).map(function(childNode) {
                            return childNode.uuid ? childNode.uuid : childNode.id;
                        });
                    }
                    if (node.doelniveau) {
                        entity.doelniveau_id = flatten(Object.values(node.doelniveau).map(function(doelen) {
                            return addDoelNiveaus(doelen, node);
                        })).filter(onlyUnique);
                    }
                    slo.all[id] = entity;
                } else {
                    console.log('already seen this node',node);
                }
                if (!slo.entities[node.type]) {
                    slo.entities[node.type] = [];
                }
                slo.entities[node.type].push(entity);
                return entity;
            }
            Object.keys(obk.idIndex).forEach(function(obkId) {
                console.log(obkId);
                obk.idIndex[obkId].forEach(function(node) {
                    addEntity(node);
                });
            });
        },
        deprecateEntities: function(nodes) {
            var deprecatedIndex = {};
            // walk over the tree and for each node with a uuid
            obk.walk(nodes, function(parent) {
                var node = this;
                if (node.uuid) {
                    // find or create deprecated entity with the nodes id (obk id)
                    if (!deprecatedIndex[node.id]) {
                        deprecatedIndex[node.id] = {
                            id: node.id,
                            title: node.title,
                            description: node.description,
                            types: [],
                            replacedBy: []
                        };
                        slo.entities.deprecated.push(deprecatedIndex[node.id]);
                    }
                    var deprecated = deprecatedIndex[node.id];
                    // add data from this node to the entity, inc. doelniveau
                    if (Object.keys(node.children).length) {
                        var childType = getChildType(node.type);
                        var prop = childType+'_id';
                        if (!deprecated[prop]) {
                            deprecated[prop] = [];
                        }
                        deprecated[prop] = deprecated[prop].concat(Object.keys(node.children)).filter(onlyUnique);
                    }
                    if (Object.keys(node.doelniveau).length) {
                        if (!deprecated.doelniveau_id) {
                            deprecated.doelniveau_id = [];
                        }
                        deprecated.doelniveau_id = deprecated.doelniveau_id.concat(slo.all[node.uuid].doelniveau_id).filter(onlyUnique);
                    }
                    // add node's uuid to replacedBy array
                    deprecated.replacedBy.push(node.uuid);
                    // add type
                    if (deprecated.types.indexOf(node.type)==-1) {
                        deprecated.types.push(node.type);
                    }
                }
            });
        },
        fix: function(nodes) {
            obk.findDuplicates(nodes);
            obk.generateNewIds();
            obk.addEntities();
            obk.deprecateEntities(nodes);
        }
    }

    editor.transformers.childrenIDs = {
        render: function(children) {
            if (!children) {
                return '';
            }
            return children.map(function(child) {
                return child.id;
            }).join(',');
        },
        extract: function(childIDs) {
            if (!childIDs) {
                return [];
            }
            return childIDs.split(',').map(function(id) {
                return slo.all[id];
            });
        }
    };
    document.body.addEventListener('change', function(evt) {
        if (evt.target.id=='updateRow_type') {
            slo.api.validateInputs();
        }
    });
    document.body.addEventListener('input', function(evt) {
         document.getElementById('updateRow_type').parentElement.classList.remove('is-invalid');
    });

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

    var dedupIndex = {};
    var dedupMapping = {};
    slo.api = {
        clone: function(ob) {
            return JSON.parse(JSON.stringify(ob));
        },
        isParent(node, id) {
            if (node.ID == id ) {
                return true;
            }
            if (slo.parents[node.ID]) {
                if (slo.parents[node.ID].has(id)) {
                    return true;
                }
                for (var parent of slo.parents[node.ID]) {
                       if (slo.api.isParent(slo.all[parent], id)) {
                           return true;
                       }
                }
            }
            return false;
        },
        validateInputs: function() {
            // FIXME: use checkRow here somehow
            var sloType=document.getElementById('updateRow_type');
            sloType.value = sloType.value.trim();
            if (sloType.value.match(/^(vak|eindterm|kern|vakkern|subkern|vaksubkern|inhoud|vakinhoud|leerdoel|leerdoel kern|leerdoel subkern|kerndoel|doelniveau)$/)) {
                sloType.parentElement.classList.remove('is-invalid');
            } else {
                sloType.parentElement.classList.add('is-invalid');
            }
        },
        correctData: function(row) {
            row.error = '';
            row.Type = (row.Type ? row.Type.trim().toLowerCase() : '');
            var types = {
                'vak' : 'vak',
                'kern' : 'vakkern',
                'subkern' : 'vaksubkern',
                'inhoud': 'vakinhoud'
            };
            if (types[row.Type]) {
                row.Type = types[row.Type];
            }
            row.Title = (row.Title ? row.Title.trim() : '');
            row.Description = (row.Description ? row.Description.trim() : '');
            row.Prefix = (row.Prefix ? (''+row.Prefix).trim() : '');
            if (row.Level) {
                var Levels = row.Level.split(',');
                Levels = Levels.map(function(level) {
                    return (''+level).trim();
                });
                row.Level = Levels.join(',');
            }
            row.Tags = (row.Tags ? row.Tags.trim() : '');
            return row;
        },
        fixHierarchy: function(row) {
            var hierarchy = {
                'vak': null,
                'vakkern': 'vak',
                'vaksubkern': 'vakkern',
                'vakinhoud': 'vaksubkern'
            };
            row.ChildID.split(',').forEach(function(childID) {
                var child = slo.all[childID];
                if (hierarchy[child.Type] && hierarchy[child.Type]!=row.Type) {
                    console.log('hierarchy error for '+child.ID+': expected '+hierarchy[child.Type]+', got '+row.Type);
                    // find by prefix

                }
            });
        },
        fixHierarchyByParent: function(row, prefixes) {
            var hierarchy = {
                'vak': null,
                'vakkern': 'vak',
                'vaksubkern': 'vakkern',
                'vakinhoud': 'vaksubkern'
            };
            var parent = slo.all[row.ParentID];
            if (hierarchy[row.Type] && hierarchy[row.Type]!=parent.Type) {
                // find by prefix
                if (row.Prefix) {
                    var parentPrefix = row.Prefix.split('.');
                    var p = '';
                    do {
                        p = parentPrefix.pop();
                    } while (parentPrefix.length && !p);
                    parentPrefix = parentPrefix.join('.');
                    if (!prefixes[parentPrefix]) {
                        parentPrefix+='.';
                    }
                    if (prefixes[parentPrefix]) {
                        var newParentID = prefixes[parentPrefix];
                        var newParent = slo.all[newParentID];
                        if (newParent && hierarchy[row.Type]==newParent.Type) {
                            row.ParentID = newParentID;
                        } else {
                            console.log('hierarchy error for '+row.ID+': expected '+hierarchy[row.Type]+', got '+parent.Type+', prefix parent was '+newParent.Type+': '+row.Prefix+' '+row.Title);
                        }
                    } else {
                        console.log('hierarchy error for '+row.ID+': expected '+hierarchy[row.Type]+', got '+parent.Type+', prefix '+parentPrefix+' not found');
                    }
                } else {
                    console.log('hierarchy error for '+row.ID+': expected '+hierarchy[row.Type]+', got '+parent.Type+', no prefix');
                }
            }
        },
        dedup: function(row) {
            var ID = (''+row.ID).trim();
            if (ID.substr(0,3)=='bk:') {
                return ID;
            }
            var index = (row.Prefix?(''+row.Prefix).trim():'')+':'+row.Title.trim()+':'+(row.Type?row.Type.trim():'');
            var dedup = dedupIndex[index];
            if (!dedup) {
                dedupIndex[index] = row.ID;
                return row.ID;
            }
            dedupMapping[row.ID] = dedup;
            return dedup;
        },
        checkDedup: function(ID) {
            if (dedupMapping[ID]) {
                return dedupMapping[ID];
            }
            return ID;
        },
        get: function(url, callback) {
            // FIXME: use fetch api instead
            document.body.setAttribute("data-slo-loading", true);
            var http = new XMLHttpRequest();
            http.open("GET", url, true);
            http.onreadystatechange = function() {//Call a function when the state changes.
                if(http.readyState == 4) {
                    document.body.removeAttribute("data-slo-loading");
                    if (http.status > 199 && http.status < 300) {
                        // localStorage[url] = http.responseText;
                        callback(http.responseText);
                    }
                }
            };
            http.send();
        },

        handleFiles: function(files, callback) {
            //FIXME: use promise instead of callback
            // Check for the various File API support.
            if (window.FileReader) {
                // FileReader are supported.
                slo.api.getAsText(files[0], callback);
            } else {
                alert('FileReader are not supported in this browser.');
            }
        },

        getAsText: function(fileToRead, callback) {

            var loadHandler = function(event) {
                var csv = event.target.result;
                processData(csv);
            }

            var processData = function(csv) {
                var allTextLines = csv.split(/\r\n|\n/);
                var lines = [];
                var result = [];
                var headers = [];

                for (var i=0; i<allTextLines.length; i++) {
                    if (allTextLines[i].length === 0) {
                        // console.warn("Received empty file");
                        continue;
                    }
                    var data = allTextLines[i].split(/;/);
                    var tarr = {};
                    for (var j=0; j<data.length; j++) {
                        tarr["col" + j] = data[j].replace(/^"/, '').replace(/"$/, '');
                    }
                    if (i == 0){
                        headers = tarr;
                    } else {
                        result.push(tarr);
                    }
                }
                callback(result, headers);
            }

            var errorHandler = function(evt) {
                if(evt.target.error.name == "NotReadableError") {
                    alert("Cannot read file !");
                }
            }

            if (typeof fileToRead == "string") {
                processData(fileToRead);
            } else {
                var reader = new FileReader();
                if (reader.readAsText && fileToRead) {
                    // Read file into memory as UTF-8
                    reader.readAsText(fileToRead);
                    // Handle errors load
                    reader.onload = loadHandler;
                    reader.onerror = errorHandler;
                }
            }
        },

        downloadCSV: function(dataset, headings, name) {
            var data = [];
            data.push(headings.map(function(h) {
                return '"'+h.replace('"','""')+'"';
            }).join(';'));

            for (var i=0,l=dataset.length;i<l;i++) {
                var cols=[];
                var ii=0;
                while (typeof dataset[i]['col'+ii] != 'undefined') {
                    cols.push(dataset[i]['col'+ii]);
                    ii++;
                }
                data.push(cols.map(function(h) {
                    return '"'+h.replace('"','""')+'"';
                }).join(';'));
            }

            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data.join('\r\n')));
            pom.setAttribute('download', name+'.csv');

            if (document.createEvent) {
                var event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                pom.dispatchEvent(event);
            } else {
                pom.click();
            }
        }
    };

    function getStructHTML(struct, childStruct) {
        if (!struct.ChildID) { return ''; }
        var list = [];
        var seen = {};
        struct.ChildID.split(',').filter(onlyUnique).forEach(function(childID) {
            var result = '';
            if (childID) {
                childID = slo.api.checkDedup(childID.trim());
                if (seen[childID]) {
                    return;
                }
                seen[childID] = true;
                var child = slo.all[childID];
                result += '<li class="slo-collapsed" data-slo-id="'+child.ID+'" data-simply-command="showRow"><span>';
                if (child.Type=='doelniveau') {
                    result += '<span class="slo-levels">' + child.Level + '</span>  ';
                    child.ChildID.split(',').filter(onlyUnique).forEach(function(doelID) {
                        result += '<span class="slo-doel">'+slo.all[doelID].Prefix+' '+slo.all[doelID].Title+'</span>, ';
                    });
                    result = result.substring(0, result.length-2);
                } else {
                    result += (child.Prefix ? child.Prefix : '') + ' ' 
                    + (child.Title ? child.Title : 'No title for '+child.ID);
                }
                result += '</span><ul>';
                if (childStruct && childStruct.id==child.ID) {
                    result += childStruct.html;
                }
                result += '</ul>';
                result += '</li>';
            }
            list.push({
                html: result,
                child: child
            });
        });
        list = list.sort(function(a,b) {
            if ((!a.child.Prefix && b.child.Prefix) || a.child.Prefix<b.child.Prefix) {
                return -1;
            }
            if ((!b.child.Prefix && a.child.Prefix) || a.child.Prefix>b.child.Prefix) {
                return 1;
            }
            return 0;
        });
        return list.map(function(entry) {
            return entry.html;
        }).join("\n");
    }

    function showStruct(struct) {
        document.querySelector('ul.slo-list-root').innerHTML = getStructHTML(struct);
    }

    function getOBKHTML(out, type, ids) {
        var result = '';
        var list = out[type];
        if (ids) {
            list = list.filter(function(entity) {
                return ids.indexOf(entity.id)!=-1;
            });
        }
        switch(type) {
            case 'doelniveau':
                list.forEach(function(entity) {
                    doel = out.doel.filter(function(doel) {
                        return entity['doel_id'].indexOf(doel.id)!=-1;
                    }).pop();
                    niveau = out.niveau.filter(function(niveau) {
                        return entity['niveau_id'].indexOf(niveau.id)!=-1;
                    }).pop();
                    result += '<li class="slo-collapsed"><span data-slo-type="niveau" data-slo-id="'+niveau.id+'">'
                        +niveau.title+'</span>: <span data-slo-type="doel" data-slo-id="'+doel.id+'">'+doel.title+'</span></li>';
                });
            break;
            default:
                list.forEach(function(entity) {
                    result += '<li class="slo-collapsed" data-slo-type="'+type+'" data-slo-id="'+entity.id+'"><span data-simply-command="OBKShow">'
                        +entity.title+'</span><ul></ul></li>';
                });
            break;
        }
        return result;
    }

    function renderOBK(out) {
        document.querySelector('ul.obk-list-root').innerHTML = getOBKHTML(out, 'vak');
    }
})();
