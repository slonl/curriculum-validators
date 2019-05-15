var examenConfig = {
        //Vertaal lijst van bron types naar entiteiten types
        alias: {
            'examenprogramma': 'examenprogramma',
            'vakleergebied': 'examenprogramma_vakleergebied',
            'domein': 'examenprogramma_domein',
            'subdomein': 'examenprogramma_subdomein',
            'globale eindterm': 'examenprogramma_eindterm',
			'kop 1': 'examenprogramma_kop1',
			'kop 2': 'examenprogramma_kop2',
			'kop 3': 'examenprogramma_kop3',
			'kop 4': 'examenprogramma_kop4',
			'body': 'examenprogramma_body'
        },
        // welke directe parents kunnen er in de excel boom staan, dus niet de uiteindelijke context
        typeParents: {
            'examenprogramma_vakleergebied': ['examenprogramma'],
            'examenprogramma_domein': ['examenprogramma'],
            'examenprogramma_subdomein': ['examenprogramma_domein'],
            'examenprogramma_eindterm': ['examenprogramma_subdomein','examenprogramma_domein'],
			'examenprogramma_kop1' : ['examenprogramma'],
			'examenprogramma_kop2': ['examenprogramma_kop1'],
			'examenprogramma_kop3': ['examenprogramma_kop2'],
			'examenprogramma_kop4': ['examenprogramma_kop3'],
			'examenprogramma_body': ['examenprogramma_kop1','examenprogramma_kop2','examenprogramma_kop3','examenprogramma_kop4']
        },
        // welke direct kinderen kunnen er in de boom staan
        typeChildren: {
            'examenprogramma': ['examenprogramma_vakleergebied','examenprogramma_domein','examenprogramma_kop1'],
            'examenprogramma_domein': ['examenprogramma_subdomein'],
            'examenprogramma_subdomein': ['examenprogramma_eindterm'],
            'examenprogramma_eindterm': ['niveau'],
			'examenprogramma_kop1': ['examenprogramma_kop2','examenprogramma_body'],
			'examenprogramma_kop2': ['examenprogramma_kop3','examenprogramma_body'],
			'examenprogramma_kop3': ['examenprogramma_kop4','examenprogramma_body'],
			'examenprogramma_kop4': ['examenprogramma_body']
        },
        // wat is de directe parent van de inhouden types
        hierarchy: {
            'examenprogramma': null,
            'examenprogramma_vakleergebied' : 'examenprogramma',
            'examenprogramma_domein': 'examenprogramma',
            'examenprogramma_subdomein': 'examenprogramma_domein',
            'examenprogramma_eindterm': ['examenprogramma_subdomein','examenprogramma_domein'],
			'examenprogramma_kop1': 'examenprogramma'
        },
        // welke types zijn er in de context beschikbaar (entiteit types)
        types: {
            'examenprogramma': true,
			'examenprogramma_vakleergebied' : true,
			'examenprogramma_domein' : true,
			'examenprogramma_subdomein' : true,
			'examenprogramma_eindterm' : true,
			'examenprogramma_kop1': true,
			'examenprogramma_kop2': true,
			'examenprogramma_kop3': true,
			'examenprogramma_kop4': true,
			'examenprogramma_body': true,
			'tag': true // is a property that is converted to an entity in curriculum-doelen
        },
        // zijn gebruikte ID's links naar bestaande entiteiten, zoja onder welke property moeten ze bewaard worden
        links: {
            'examenprogramma_vakleergebied_id': 'vak_id',
        },
        // welke types worden in welk json bestand opgeslagen
        files: {
            'examenprogramma': 'examenprogramma.json',
            'examenprogramma_vakleergebied': 'examenprogramma.vakleergebieden.json',
            'examenprogramma_domein': 'examenprogramma.domeinen.json',
            'examenprogramma_subdomein': 'examenprogramma.subdomeinen.json',
            'examenprogramma_eindterm': 'examenprogramma.eindtermen.json',
			'examenprogramma_kop1': 'examenprogramma.kop1.json',
			'examenprogramma_kop2': 'examenprogramma.kop2.json',
			'examenprogramma_kop3': 'examenprogramma.kop3.json',
			'examenprogramma_kop4': 'examenprogramma.kop4.json',
			'examenprogramma_body': 'examenprogramma.body.json',
			'tag':'tags.json'
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
            'toelichting': true,
            'ingangsdatum': true,
            'versie': true,
            'url examenprogramma': true,
            'jaargangversie': true,
            'publicatiestatus': true,
            '': true
        },
        // wat is het bovenste niveau type
        topLevel: 'examenprogramma'
};