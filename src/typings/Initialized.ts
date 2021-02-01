import { Belongs } from "../decorators/Belongs"

import { OmitNever } from "./OmitNever";
import { PrimaryGeneratedColumnValueType } from "./PrimaryGeneratedColumnValueType"

import { DEFAULT } from "../DEFAULT"

export type Initialized<T extends object> 
    = OmitNever<Initialized.Essential<T>>
    & Partial<OmitNever<Initialized.Nullable<T>>>;

export namespace Initialized
{
    export type Essential<T extends object> = 
    {
        [P in keyof T]: T[P] extends (boolean | number | string | Date)
            ? (T[P] | DEFAULT)
            : T[P] extends Belongs.OneToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? never
                    : Entity | PrimaryGeneratedColumnValueType<Primary>
            : T[P] extends Belongs.ManyToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? never
                    : Entity | PrimaryGeneratedColumnValueType<Primary>
            : never;
    };

    export type Nullable<T extends object> = 
    {
        [P in keyof T]: T[P] extends ((boolean | number | string | Date)) | null
            ? (T[P] | DEFAULT | null)
            : T[P] extends Belongs.OneToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? Entity | PrimaryGeneratedColumnValueType<Primary> | null
                    : never
            : T[P] extends Belongs.ManyToOne<infer Entity, infer Primary, infer Options>
            ? Options extends { nullable: true }
                ? Entity | PrimaryGeneratedColumnValueType<Primary> | null
                : never
            : never;
    };
}
