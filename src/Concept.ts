export class Concept {

    static readonly SYSTEM_CONCEPT_CODE_PREFIX = "system concept ";
    static readonly ENTITY_CONCEPT_CODE_PREFIX = "A ";


    private id: string;
    private code: string;
    private shortname: string;

    constructor(id: string, code: string, shortname: string) {
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

    setId(id: string) {
        this.id = id;
    }
    setCode(code: string) {
        this.code = code;
    }

    setShortname(sn: string) {
        this.shortname = sn;
    }

    isSame(concept: Concept): boolean {
        return this.getId() === concept.getId();
    }

    copy(c: Concept) {
        this.id = c.getId();
        this.code = c.getCode();
        this.shortname = c.getShortname();
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