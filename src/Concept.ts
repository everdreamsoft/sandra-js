export class Concept {

    static readonly SYSTEM_CONCEPT_CODE_PREFIX = "system concept ";
    static readonly ENTITY_CONCEPT_CODE_PREFIX = "A ";


    private id: number;
    private code: string;
    private shortname: string;

    constructor(id: number, code: string, shortname: string) {
        this.id = id;
        this.code = code;
        this.shortname = shortname;
    }


    getId() {
        return this.id;
    }

    getCode() {
        return this.code;
    }

    getShortname() {
        return this.shortname;
    }

    setId(id: number) {
        this.id = id;
    }

    isSame(concept: Concept): boolean {
        return this.getShortname() === concept.getShortname();
    }

    getDBArrayFormat(withId: boolean = true) {
        if (withId)
            return [this.id.toString(), this.code, this.shortname];

        return [this.code, this.shortname];
    }

    getJSON(withId: boolean = true) {

        if (withId)
            return {
                "id": this.id.toString(),
                "code": this.code,
                "shortname": this.shortname
            };

        return {
            "code": this.code,
            "shortname": this.shortname
        };
    }

}