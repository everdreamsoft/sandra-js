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


    /**
     * 
     * @returns Returns concept id.
     */
    getId() {
        return this.id;
    }

    /**
     * 
     * @returns Returns concept code.
     */
    getCode() {
        return this.code;
    }

    /**
     * 
     * @returns Returns concept shortname.
     */
    getShortname() {
        return this.shortname;
    }

    /**
     * Sets concept id.
     * @param id S
     */
    setId(id: string) {
        this.id = id;
    }

    /**
     * Sets concept code.
     * @param code 
     */
    setCode(code: string) {
        this.code = code;
    }

    /**
     * Sets concept shortname.
     * @param sn 
     */
    setShortname(sn: string) {
        this.shortname = sn;
    }

    /**
     * 
     * @param concept 
     * @returns Returns true if given concept id is same as this concept object id.
     */
    isSame(concept: Concept): boolean {
        return this.getId() === concept.getId();
    }

    /**
     * Copies the content of given concept to this concept object.
     * @param c 
     */
    copy(c: Concept) {
        this.id = c.getId();
        this.code = c.getCode();
        this.shortname = c.getShortname();
    }

    /**
     * 
     * @param withId 
     * @returns Returns concept object as array [id,code,shortname], if is included if withId is true
     */
    getDBArrayFormat(withId: boolean = true) {
        if (withId)
            return [this.id.toString(), this.code, this.shortname];

        return [this.code, this.shortname];
    }

    /**
     * 
     * @param withId 
     * @returns Return concept as json 
     */
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