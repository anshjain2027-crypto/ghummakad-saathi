export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Database {
  transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}
