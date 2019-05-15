    var niveauConfig = {
        //Vertaal lijst van bron types naar entiteiten types
        alias: {
			'' : 'niveaus'
        },
        // welke directe parents kunnen er in de excel boom staan, dus niet de uiteindelijke context
        typeParents: {
			'niveaus': ['sector'],
            'sector': ['referentieniveau','fase','leerjaar'],
        },
        // welke direct kinderen kunnen er in de boom staan
        typeChildren: {
            'sector': ['referentieniveau','fase','leerjaar'],
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
			'niveaus': true,
            'sector': true,
            'referentieniveau': true,
            'opleiding': true,
            'leerjaar': true,
            'fase': true,
			'beheersingsniveau': true,
			'wiskundeniveau' : true
        },
        // zijn gebruikte ID's links naar bestaande entiteiten, zoja onder welke property moeten ze bewaard worden
        links: {
        },
        // welke types worden in welk json bestand opgeslagen
        files: {
            'sector': 'sectoren.json',
            'referentieniveau': 'referentieniveaus.json',
            'opleiding': 'opleidingen.json',
            'leerjaar': 'leerjaren.json',
            'fase': 'fases.json',
            'tag': 'tags.json'
        },
        // welke niveau's zijn er, dit moet eigenlijk uit de curriculum-doelen context opgehaald worden
        niveaus: {
        },
        // welke types mogen verwijderd worden
        filterTypes: {
        },
        // wat is het bovenste niveau type
        topLevel: 'niveaus'
    };
