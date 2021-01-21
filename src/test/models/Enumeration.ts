import * as orm from "typeorm";

import { Belongs } from "../../Belongs";
import { Has } from "../../Has";
import { IncrementalColumn } from "../../IncrementalColumn";

import { EnumerationGroup } from "./EnumerationGroup";
import { SpecialEnumeration } from "./SpecialEnumeration";

@orm.Entity()
export class Enumeration extends orm.BaseEntity
{
    @IncrementalColumn()
    public readonly id!: number;
    
    @Belongs.ManyToOne(() => EnumerationGroup, 
        group => group.children, 
        "enumration_group_id"
    )
    public group!: Belongs.ManyToOne<EnumerationGroup>;

    @Has.OneToOne(() => SpecialEnumeration, special => special.base)
    public special!: Has.OneToOne<SpecialEnumeration>;
}