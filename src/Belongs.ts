import * as orm from "typeorm";
import { Has } from "./Has";

import { IEntity } from "./internal/IEntity";
import { CapsuleNullable } from "./typings/CapsuleNullable";
import { CreatorType } from "./typings/CreatorType";

export namespace Belongs
{
    /* -----------------------------------------------------------
        MANY-TO-ONE
    ----------------------------------------------------------- */
    export type ManyToOne<Target extends IEntity, Options extends Partial<ManyToOne.IOptions> = {}> = Helper<Target, Options>;

    export function ManyToOne<Target extends IEntity, Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne<Mine extends IEntity, Target extends IEntity, Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (target: Target) => Has.OneToMany<Mine>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne(...args: any[]): PropertyDecorator
    {
        return typeof args[1] === "function"
            ? (_Belongs_to as Function)(orm.ManyToOne, ...args)
            : (_Belongs_to as Function)(orm.ManyToOne, args[0], undefined, ...args.slice(1));
    }

    export namespace ManyToOne
    {
        export interface IOptions
        {
            index: boolean;
            nullable: boolean;
        }
    }

    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    export type OneToOne<Target extends IEntity, Options extends Partial<OneToOne.IOptions> = {}> = Helper<Target, Options>;

    export function OneToOne<Target extends IEntity, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne<Mine extends IEntity, Target extends IEntity, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (target: Target) => Has.OneToOne<Mine>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne(...args: any[]): PropertyDecorator
    {
        return typeof args[1] === "function"
            ? (_Belongs_to as Function)(orm.OneToOne, ...args)
            : (_Belongs_to as Function)(orm.OneToOne, args[0], undefined, ...args.slice(1));
    }

    export namespace OneToOne
    {
        export interface IOptions extends ManyToOne.IOptions
        {
            unique: boolean;
            primary: boolean;
        }
    }

    /* -----------------------------------------------------------
        BACKGROUND
    ----------------------------------------------------------- */
    class Helper<Target extends IEntity, Options extends Partial<ManyToOne.IOptions>>
    {
        private readonly target_: CreatorType<Target>;
        private readonly source_: any;
        private readonly getter_: string;
        private readonly field_: string;
        private changed_: boolean;

        public constructor(target: CreatorType<Target>, source: ManyToOne.IOptions, property: string, field: string)
        {
            this.target_ = target;
            this.source_ = source;
            this.getter_ = `${property}_getter`;
            this.field_ = field;
            this.changed_ = false;
        }

        public get id(): CapsuleNullable<number, Options>
        {
            return this.source_[this.field_];
        }
        public set id(value: CapsuleNullable<number, Options>)
        {
            const previous: number | null = this.source_[this.field_];
            this.source_[this.field_] = value;

            if (previous !== value)
            {
                delete this.source_[`__${this.getter_}__`];
                delete this.source_[`__has_${this.getter_}__`];
                this.changed_ = true;
            }
        }

        public async get(): Promise<CapsuleNullable<Target, Options>>
        {
            const id: number | null = this.id;
            if (id === null)
                return null!;

            if (this.changed_ === true)
            {
                const loaded: Target | undefined = await orm.getRepository(this.target_).findOne(this.id!);
                this.source_[this.getter_] = Promise.resolve(loaded ? loaded : null);

                this.changed_ = true;
            }
            return await this.source_[this.getter_];
        }

        public set(obj: CapsuleNullable<Target, Options>): void
        {
            this.changed_ = false;
            this.source_[this.field_] = (obj !== null) ? obj.id : null!;
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        public statement(alias: string): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(alias)
                .andWhere(`${alias}.id = :id`, { id: this.id });
        }
    }

    function _Belongs_to<Mine extends IEntity, Target extends IEntity, Options extends object>
        (
            relation: typeof orm.ManyToOne | typeof orm.OneToOne,
            targetGen: () => CreatorType<Target>,
            inverse: ((target: Target) => (Has.OneToOne<Mine> | Has.OneToMany<Mine>)) | undefined,
            field: string,
            options?: Options
        ): PropertyDecorator
    {
        if (options === undefined)
            options = {} as Options;

        return function ($class, $property)
        {
            // DEFINE THE PROPERTY
            const getter: string = `${$property as string}_getter`;
            const label: string = `${$property as string}_helper`;

            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Options>
                {
                    if (this[label] === undefined)
                        this[label] = new Helper(targetGen(), this, $property as string, field);
                    return this[label];
                }
            });
            
            // ADJUST DECORATORS
            orm.Column("int", { ...options, unsigned: true })($class, field);
            if (inverse)
            {
                const helper: Has.OneToMany<Mine> = inverse(new (targetGen())) as Has.OneToMany<Mine>;
                relation(targetGen, helper["getter_"], { ...options, lazy: true })($class, getter);
            }
            else
                relation(targetGen, { ...options, lazy: true })($class, getter);
            orm.JoinColumn({ name: field })($class, getter);
        };
    }

    type TypeGenerator<Entity extends IEntity> = () => CreatorType<Entity>;
}