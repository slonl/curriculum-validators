    var ldkConfig = {
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
            'doelniveau': ['doel','kerndoel','niveau']
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
            'kerndoel':true 
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
