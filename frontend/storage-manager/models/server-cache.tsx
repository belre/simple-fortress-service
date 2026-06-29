
'use server'

export type ServerCacheType =
    "volatile" |
    "cookie" |
    "in-memory" |
    "redis"

export interface ISessionToken {
    key: string  // メソッドよりプロパティの方が自然
    get(): Promise<string | null>
}

export interface IMutableSessionToken extends ISessionToken {
    set(value: string): Promise<void>
    delete(): Promise<void>
}






